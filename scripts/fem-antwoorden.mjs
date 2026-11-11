// Legt de antwoorden van Open FEM Studio vast voor de modules met een @fem-blok, zodat
// scripts/controleer.mjs hun varianten zonder FEM Studio kan doorrekenen.
//
//   node scripts/fem-antwoorden.mjs --app <pad naar de app-repository> [id …]
//
// Per module met test/varianten.json rekent het script elke variant door zoals de app
// in de werkruimte: de verzoeken van het blad gaan naar solve_open_fem_3d van de echte
// server, en het antwoord wordt compact bewaard (femBewaar) in test/<naam>.json.gz.
// De server: OCSS_FEM_SERVER, of de geïnstalleerde Open FEM Studio
// (%LOCALAPPDATA%\Open FEM Studio\openaec-mcp-server.exe op Windows). De rekenkern van
// de app moet gebouwd zijn (npm --prefix packages/core run build).
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { antwoordenPad, femBlokken, laadApp, leesVarianten, schrijfAntwoorden } from "./fem-varianten.mjs";

const args = process.argv.slice(2);
const appPad = args.includes("--app") ? args[args.indexOf("--app") + 1] : null;
const ids = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--app");
if (!appPad) {
  console.error("Gebruik: node scripts/fem-antwoorden.mjs --app <pad naar de app-repository> [id …]");
  process.exit(1);
}

const kandidaten = [
  process.env.OCSS_FEM_SERVER,
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Open FEM Studio", "openaec-mcp-server.exe"),
  process.env.ProgramFiles && join(process.env.ProgramFiles, "Open FEM Studio", "openaec-mcp-server.exe"),
  "/Applications/Open FEM Studio.app/Contents/MacOS/openaec-mcp-server",
  "/usr/bin/openaec-mcp-server",
].filter(Boolean);
const server = kandidaten.find((p) => existsSync(p));
if (!server) {
  console.error("Geen Open FEM Studio gevonden: zet OCSS_FEM_SERVER of installeer Open FEM Studio.");
  process.exit(1);
}

const { kern, scope, kentFem } = await laadApp(appPad);
if (!kentFem) {
  console.error("Deze rekenkern kent het @fem-blok niet; bouw een app met @fem.");
  process.exit(1);
}

/** Eén server over stdin/stdout: één JSON-RPC-bericht per regel, antwoorden op id. */
function start(pad) {
  const kind = spawn(pad, [], { stdio: ["pipe", "pipe", "ignore"] });
  const wacht = new Map();
  let buffer = "";
  kind.stdout.on("data", (d) => {
    buffer += d.toString("utf8");
    let i;
    while ((i = buffer.indexOf("\n")) >= 0) {
      const regel = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!regel) continue;
      let v;
      try { v = JSON.parse(regel); } catch { continue; }
      if (v.id != null && wacht.has(v.id)) { wacht.get(v.id)(v); wacht.delete(v.id); }
    }
  });
  let id = 0;
  const roep = (method, params) => new Promise((klaar) => {
    const n = ++id;
    wacht.set(n, klaar);
    kind.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: n, method, params }) + "\n");
  });
  return { roep, stop: () => kind.kill() };
}

const fem = start(server);
const init = await fem.roep("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "fem-antwoorden", version: "1" } });
const versie = init.result?.serverInfo?.version ?? "";
const tool = ((await fem.roep("tools/list", {})).result?.tools ?? []).find((t) => t.name === "solve_open_fem_3d");
if (!tool) {
  console.error(`Open FEM Studio ${versie} kent solve_open_fem_3d niet.`);
  fem.stop();
  process.exit(1);
}
const herkomst = { versie, sha256: createHash("sha256").update(readFileSync(server)).digest("hex"), schema: kern.schemaHash(tool.inputSchema) };
console.log(`Open FEM Studio ${versie}`);

let fouten = 0;
for (const id of readdirSync("modules").sort()) {
  const map = join("modules", id);
  if (!statSync(map).isDirectory() || (ids.length && !ids.includes(id))) continue;
  const varianten = leesVarianten(map);
  if (!varianten) continue;
  const meta = JSON.parse(readFileSync(join(map, "module.json"), "utf8"));
  const bron = readFileSync(join(map, meta.blad), "utf8");
  for (const v of varianten) {
    const blokken = femBlokken(kern.evaluate(kern.parse(bron), v.invoer ?? {}, scope, { toetsModus: "vragen" }));
    const mis = blokken.filter((b) => b.status !== "wacht");
    if (!blokken.length || mis.length) {
      console.log(`  ✗  ${id}/${v.naam}: ${mis.map((b) => `${b.status} ${b.melding ?? ""}`).join("; ") || "geen @fem-blok"}`);
      fouten++;
      continue;
    }
    const toetsingen = {};
    for (const verzoek of blokken.flatMap((b) => b.verzoeken ?? [])) {
      const t0 = Date.now();
      const r = await fem.roep("tools/call", { name: "solve_open_fem_3d", arguments: kern.femArgumenten(verzoek.bewaar) });
      if (r.error || r.result?.isError) {
        console.log(`  ✗  ${id}/${v.naam}, geval ${verzoek.bewaar.geval}: ${r.error?.message ?? r.result.content?.[0]?.text}`);
        fouten++;
        continue;
      }
      const ruw = r.result.structuredContent ?? JSON.parse(r.result.content[0].text);
      const uitkomst = kern.femBewaar(verzoek.bewaar, ruw);
      toetsingen[verzoek.hash] = { tool: verzoek.tool, verzoek: verzoek.bewaar, uitkomst, datum: new Date().toISOString(), herkomst };
      console.log(`  ·  ${id}/${v.naam}, geval ${verzoek.bewaar.geval}: ${verzoek.bewaar.x.length} knopen, ${Date.now() - t0} ms, Σ last ${uitkomst.som.last.toFixed(2)} kN, Σ R ${uitkomst.som.reactie.toFixed(2)} kN`);
    }
    schrijfAntwoorden(antwoordenPad(map, v.naam), { versie, toetsingen });
    console.log(`  ✓  ${id}/${v.naam}: ${Object.keys(toetsingen).length} antwoorden in ${antwoordenPad(map, v.naam)}`);
  }
}
fem.stop();
process.exit(fouten ? 1 : 0);
