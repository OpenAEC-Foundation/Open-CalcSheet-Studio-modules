// Legt de antwoorden van Open FEM Studio vast voor de modules met een @fem- of @kern-blok,
// zodat scripts/controleer.mjs hun varianten zonder FEM Studio kan doorrekenen.
//
//   node scripts/fem-antwoorden.mjs --app <pad naar de app-repository> [--opnieuw] [id …]
//
// Per module met test/varianten.json rekent het script elke variant door zoals de app
// in de werkruimte, in rondes: de verzoeken van het blad gaan naar de echte server
// (solve_open_fem_3d voor een @fem-blok, de tool van het blok voor een @kern-blok), en
// het blad rekent opnieuw met de antwoorden, tot er niets meer te vragen is. Een blok
// dat de uitkomst van een ander gebruikt (de scheurwijdte met de staalspanning uit het
// drielagenmodel) komt zo een ronde later. De antwoorden worden bewaard zoals de app ze
// bij een blad bewaart, in test/<naam>.json.gz; een @fem-antwoord compact (femBewaar).
//
// Wat er al ligt en nog bij het blad hoort, blijft staan: alleen wat ontbreekt gaat naar
// de server. Met --opnieuw wordt alles opnieuw gerekend. Een variant met "nietGerekend"
// of "antwoordenVan" heeft geen eigen antwoorden.
//
// De server: OCSS_FEM_SERVER, of de geïnstalleerde Open FEM Studio
// (%LOCALAPPDATA%\Open FEM Studio\openaec-mcp-server.exe op Windows). De rekenkern van
// de app moet gebouwd zijn (npm --prefix packages/core run build).
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { antwoordenPad, femBlokken, heeftKern, kernBlokken, laadApp, leesAntwoorden, leesVarianten, schrijfAntwoorden } from "./fem-varianten.mjs";

const args = process.argv.slice(2);
const appPad = args.includes("--app") ? args[args.indexOf("--app") + 1] : null;
const opnieuw = args.includes("--opnieuw");
const ids = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--app");
if (!appPad) {
  console.error("Gebruik: node scripts/fem-antwoorden.mjs --app <pad naar de app-repository> [--opnieuw] [id …]");
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

const { kern, scope, kentFem, kentKern } = await laadApp(appPad);
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
const tools = (await fem.roep("tools/list", {})).result?.tools ?? [];
if (!tools.some((t) => t.name === "solve_open_fem_3d")) {
  console.error(`Open FEM Studio ${versie} kent solve_open_fem_3d niet.`);
  fem.stop();
  process.exit(1);
}
const sha256 = createHash("sha256").update(readFileSync(server)).digest("hex");
const herkomstVan = (tool) => ({ versie, sha256, schema: kern.schemaHash(tools.find((t) => t.name === tool)?.inputSchema) });
console.log(`Open FEM Studio ${versie}`);

/** Eén aanroep zoals de app hem doet: het antwoord, of een fout met de melding van de server. */
async function roepTool(tool, argumenten) {
  const r = await fem.roep("tools/call", { name: tool, arguments: argumenten });
  if (r.error || r.result?.isError) throw new Error(r.error?.message ?? r.result.content?.[0]?.text ?? "onbekende fout");
  return r.result.structuredContent ?? JSON.parse(r.result.content[0].text);
}

const MAX_RONDES = 8;
let fouten = 0;
for (const id of readdirSync("modules").sort()) {
  const map = join("modules", id);
  if (!statSync(map).isDirectory() || (ids.length && !ids.includes(id))) continue;
  const varianten = leesVarianten(map);
  if (!varianten) continue;
  const meta = JSON.parse(readFileSync(join(map, "module.json"), "utf8"));
  const bron = readFileSync(join(map, meta.blad), "utf8");
  if (heeftKern(bron) && !kentKern) {
    console.log(`  ✗  ${id}: deze rekenkern kent het @kern-blok niet; bouw een app met @kern`);
    fouten++;
    continue;
  }
  for (const v of varianten) {
    if (v.nietGerekend || v.antwoordenVan) {
      console.log(`  ·  ${id}/${v.naam}: geen eigen antwoorden (${v.antwoordenVan ? `die van ${v.antwoordenVan}` : "hoort niet gerekend te worden"})`);
      continue;
    }
    const pad = antwoordenPad(map, v.naam);
    // Wat er al ligt, blijft gelden zolang het blad er nog om vraagt.
    const toetsingen = !opnieuw && existsSync(pad) ? { ...(leesAntwoorden(pad).toetsingen ?? {}) } : {};
    let nodes = [];
    let mis = null;
    let gevraagd = 0;
    for (let ronde = 1; ronde <= MAX_RONDES && !mis; ronde++) {
      const records = kern.leesVastgelegdeToetsingen(toetsingen) ?? {};
      const antwoorden = Object.fromEntries(Object.entries(records).map(([h, r]) => [h, kern.alsAntwoord(r)]));
      nodes = kern.evaluate(kern.parse(bron), v.invoer ?? {}, scope, { toetsModus: "vragen", toetsingen: antwoorden });
      const blokken = [...femBlokken(nodes), ...kernBlokken(nodes)];
      const stuk = blokken.filter((b) => b.status !== "wacht" && b.status !== "klaar");
      if (!blokken.length || stuk.length) {
        mis = stuk.map((b) => `${b.type} ${b.naam}: ${b.status} ${b.melding ?? ""}`).join("; ") || "geen @fem- of @kern-blok";
        break;
      }
      const verzoeken = [...femBlokken(nodes).flatMap((b) => b.verzoeken ?? []), ...kernBlokken(nodes).flatMap((b) => (b.verzoek ? [b.verzoek] : []))];
      if (!verzoeken.length) break;
      if (ronde === MAX_RONDES) mis = `na ${MAX_RONDES} rondes is er nog iets te vragen`;
      for (const verzoek of verzoeken) {
        const t0 = Date.now();
        try {
          if (verzoek.bewaar) {
            const ruw = await roepTool(verzoek.tool, kern.femArgumenten(verzoek.bewaar));
            const uitkomst = kern.femBewaar(verzoek.bewaar, ruw);
            toetsingen[verzoek.hash] = { tool: verzoek.tool, verzoek: verzoek.bewaar, uitkomst, datum: new Date().toISOString(), herkomst: herkomstVan(verzoek.tool) };
            console.log(`  ·  ${id}/${v.naam}, geval ${verzoek.bewaar.geval}: ${verzoek.bewaar.x.length} knopen, ${Date.now() - t0} ms, Σ last ${uitkomst.som.last.toFixed(2)} kN, Σ R ${uitkomst.som.reactie.toFixed(2)} kN`);
          } else {
            const uitkomst = await kern.kernAanroepen(verzoek, roepTool);
            toetsingen[verzoek.hash] = { tool: verzoek.tool, verzoek: kern.kernVerzoekBewaard(verzoek), uitkomst, datum: new Date().toISOString(), herkomst: herkomstVan(verzoek.tool) };
            const aantal = verzoek.reeks ? verzoek.reeks.filter(Boolean).length : 1;
            console.log(`  ·  ${id}/${v.naam}, ${verzoek.tool} ${JSON.stringify((verzoek.reeks?.find(Boolean) ?? verzoek.argumenten)?.inputs?.kind ?? "")}: ${aantal} ${aantal === 1 ? "aanroep" : "aanroepen"}, ${Date.now() - t0} ms`);
          }
          gevraagd++;
        } catch (e) {
          mis = `${verzoek.tool}: ${e.message}`;
          break;
        }
      }
    }
    if (mis) {
      console.log(`  ✗  ${id}/${v.naam}: ${mis}`);
      fouten++;
      continue;
    }
    // Alleen wat het blad nu gebruikt, gaat mee.
    const gebruikt = new Set([...femBlokken(nodes).flatMap((b) => b.hashes ?? []), ...kernBlokken(nodes).map((b) => b.hash).filter(Boolean)]);
    const bewaard = Object.fromEntries(Object.entries(toetsingen).filter(([h]) => gebruikt.has(h)));
    schrijfAntwoorden(pad, { versie, toetsingen: bewaard });
    console.log(`  ✓  ${id}/${v.naam}: ${Object.keys(bewaard).length} antwoorden in ${pad} (${gevraagd} nieuw gevraagd)`);
  }
}
fem.stop();
process.exit(fouten ? 1 : 0);
