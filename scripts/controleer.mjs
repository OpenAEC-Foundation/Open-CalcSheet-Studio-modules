// Controle van alle modules: metadata, bestanden, beeld en catalogus.
//
//   node scripts/controleer.mjs              controleren (ook index.json)
//   node scripts/controleer.mjs --schrijf    index.json opnieuw schrijven
//   node scripts/controleer.mjs --app <pad naar de app-repository>
//                                            ook elk blad doorrekenen met de
//                                            rekenkern van Open Structural
//                                            Calculation Studio (kern eerst
//                                            bouwen), met de standaard-
//                                            projectgegevens als startwaarden
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MAP = "modules";
const CATEGORIEEN = ["algemeen", "hout", "staal", "beton", "metselwerk", "fundering", "belastingen", "overig"];
const STATUSSEN = ["gereed", "controleren", "raming", "concept"];
const MAX_BEELD = 200_000;
const VERSIE = /^\d{4}\.\d{1,2}\.\d+$/;

const args = process.argv.slice(2);
const schrijf = args.includes("--schrijf");
const appPad = args.includes("--app") ? args[args.indexOf("--app") + 1] : null;

const fouten = [];
const fout = (id, tekst) => fouten.push(`${id}: ${tekst}`);
const tweetalig = (w) => w && typeof w.nl === "string" && w.nl.trim() && typeof w.en === "string" && w.en.trim();

const modules = [];
for (const id of readdirSync(MAP).sort()) {
  const map = join(MAP, id);
  if (!statSync(map).isDirectory()) continue;
  const metaPad = join(map, "module.json");
  if (!existsSync(metaPad)) { fout(id, "module.json ontbreekt"); continue; }
  let m;
  try { m = JSON.parse(readFileSync(metaPad, "utf8")); } catch (e) { fout(id, `module.json is geen geldige JSON (${e.message})`); continue; }

  if (m.id !== id) fout(id, `id "${m.id}" moet gelijk zijn aan de mapnaam`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fout(id, "mapnaam/id: kleine letters, cijfers en streepjes");
  if (!VERSIE.test(m.versie ?? "")) fout(id, "versie in de vorm jaar.week.nummer, bijv. 2026.44.0");
  if (!tweetalig(m.naam)) fout(id, "naam.nl en naam.en zijn verplicht");
  if (!tweetalig(m.omschrijving)) fout(id, "omschrijving.nl en omschrijving.en zijn verplicht");
  if (!CATEGORIEEN.includes(m.categorie)) fout(id, `categorie moet een van ${CATEGORIEEN.join(", ")} zijn`);
  if (!STATUSSEN.includes(m.status)) fout(id, `status moet een van ${STATUSSEN.join(", ")} zijn`);
  if (!Array.isArray(m.normen)) fout(id, "normen is een lijst");
  if (!VERSIE.test(m.minimaleAppVersie ?? "")) fout(id, "minimaleAppVersie in de vorm jaar.week.nummer");
  if (!Array.isArray(m.auteurs) || m.auteurs.length === 0) fout(id, "auteurs is verplicht");
  if (typeof m.licentie !== "string") fout(id, "licentie is verplicht");

  const blad = m.blad && join(map, m.blad);
  if (!blad || !m.blad.endsWith(".cpd") || !existsSync(blad)) fout(id, "blad (een .cpd-bestand in de map) ontbreekt");
  const beeld = m.beeld && join(map, m.beeld);
  if (!beeld || !m.beeld.endsWith(".webp") || !existsSync(beeld)) fout(id, "beeld (een .webp-bestand in de map) ontbreekt");
  else if (statSync(beeld).size > MAX_BEELD) fout(id, `beeld is groter dan ${MAX_BEELD / 1000} kB`);

  modules.push({
    id, versie: m.versie, naam: m.naam, omschrijving: m.omschrijving, categorie: m.categorie,
    status: m.status, gepubliceerd: m.gepubliceerd === true, normen: m.normen,
    map: `${MAP}/${id}`, blad: m.blad, beeld: m.beeld, minimaleAppVersie: m.minimaleAppVersie,
  });
}

// Elk blad doorrekenen: geen fouten in de uitwerking.
if (appPad && fouten.length === 0) {
  const { parse, evaluate } = await import(pathToFileURL(resolve(appPad, "packages/core/dist/index.js")).href);
  // Een blad krijgt in de app de projectgegevens (gevolgklasse, rekenwijze, …)
  // vóór zijn eerste regel; hier de standaardwaarden daarvan.
  const { PROJECT_VELDEN, projectScope } = await import(
    pathToFileURL(resolve(appPad, "packages/desktop/src/store/projectGegevens.ts")).href
  );
  const scope = projectScope(Object.fromEntries(PROJECT_VELDEN.map((v) => [v.naam, v.standaard])));
  // De kern zet een rekenfout in de uitkomst ("Error: …") of, bij een
  // voorwaarde, als tekst in de tak.
  const zoekFout = (knopen) => {
    for (const k of knopen) {
      if (typeof k.result === "string" && k.result.startsWith("Error")) return `${k.name ?? ""} ${k.result}`.trim();
      if (k.type === "text" && typeof k.text === "string" && k.text.startsWith("Error evaluating")) return k.text;
      if (k.children) { const f = zoekFout(k.children); if (f) return f; }
    }
    return null;
  };
  for (const m of modules) {
    try {
      const uit = evaluate(parse(readFileSync(join(m.map, m.blad), "utf8")), {}, scope);
      const f = zoekFout(uit);
      if (f) fout(m.id, `blad rekent niet foutloos door: ${f}`);
      else console.log(`  ✓  ${m.id}: blad rekent door (${uit.length} regels)`);
    } catch (e) {
      fout(m.id, `blad rekent niet door: ${e.message}`);
    }
  }
}

const index = JSON.stringify({ formaat: 1, modules }, null, 2) + "\n";
if (schrijf) {
  writeFileSync("index.json", index);
  console.log(`index.json geschreven (${modules.length} modules)`);
} else if (!existsSync("index.json") || readFileSync("index.json", "utf8").replace(/\r\n/g, "\n") !== index) {
  fout("index.json", "verouderd — draai `node scripts/controleer.mjs --schrijf` en neem index.json mee in je pull request");
}

if (fouten.length) {
  console.error("Fouten:\n" + fouten.map((f) => `  ✗  ${f}`).join("\n"));
  process.exit(1);
}
console.log(`${modules.length} module(s) in orde.`);
