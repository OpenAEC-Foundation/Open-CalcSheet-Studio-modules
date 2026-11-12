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
//
// Een module met een @fem- of @kern-blok heeft varianten in test/varianten.json, met de
// antwoorden van Open FEM Studio vastgelegd in test/<naam>.json.gz (zie
// scripts/fem-antwoorden.mjs). Met --app rekent de controle elke variant met die
// antwoorden door, zonder FEM Studio: geen fouten, elk @fem-blok gerekend en in
// evenwicht, elk @kern-blok gerekend, en de verwachte uitkomsten. Zonder antwoord moet
// het blad foutloos "niet gerekend" melden; dat is het gewone doorrekenen hieronder.
//
// Een variant met "antwoordenVan" rekent met de antwoorden van een andere variant: zijn
// invoer verandert niets aan wat het blad aan FEM Studio vraagt (een keuze voor het
// scherm). Een variant met "nietGerekend" (een lijst namen) hoort juist geen uitkomst te
// geven, ook niet met die antwoorden: geen blok is gerekend, geen van die namen heeft
// een waarde, en het blad geeft geen maatgevende UC.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { alsGetal, antwoordenPad, drieDMeldingen, femBlokken, heeftKern, kernBlokken, laadApp, leesAntwoorden, leesVarianten } from "./fem-varianten.mjs";

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
/** De varianten van de modules met een @fem-blok (niet in index.json). */
const variantenVan = new Map();
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

  const varianten = leesVarianten(map);
  for (const v of varianten ?? []) {
    if (typeof v.naam !== "string" || !/^[a-z0-9-]+$/.test(v.naam)) fout(id, `test/varianten.json: variant zonder geldige naam`);
    else if (v.nietGerekend && (!Array.isArray(v.nietGerekend) || !v.nietGerekend.length)) fout(id, `test/varianten.json: ${v.naam}.nietGerekend is een lijst namen`);
    else if (v.antwoordenVan) {
      if (!existsSync(antwoordenPad(map, v.antwoordenVan))) fout(id, `test/${v.antwoordenVan}.json.gz ontbreekt (antwoordenVan van ${v.naam})`);
    } else if (!v.nietGerekend && !existsSync(antwoordenPad(map, v.naam))) fout(id, `test/${v.naam}.json.gz ontbreekt (node scripts/fem-antwoorden.mjs --app <pad>)`);
  }

  modules.push({
    id, versie: m.versie, naam: m.naam, omschrijving: m.omschrijving, categorie: m.categorie,
    status: m.status, gepubliceerd: m.gepubliceerd === true, normen: m.normen,
    map: `${MAP}/${id}`, blad: m.blad, beeld: m.beeld, minimaleAppVersie: m.minimaleAppVersie,
  });
  if (varianten) variantenVan.set(id, varianten);
}

// Elk blad doorrekenen: geen fouten in de uitwerking.
if (appPad && fouten.length === 0) {
  // Een blad krijgt in de app de projectgegevens (gevolgklasse, rekenwijze, …)
  // vóór zijn eerste regel; hier de standaardwaarden daarvan.
  const { kern, scope, kentFem, kentKern } = await laadApp(appPad);
  const { parse, evaluate } = kern;
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

  // De varianten met de vastgelegde antwoorden van Open FEM Studio.
  for (const m of modules.filter((x) => variantenVan.has(x.id))) {
    if (!kentFem) { fout(m.id, "deze app kent het @fem-blok niet (minimaleAppVersie " + m.minimaleAppVersie + ")"); continue; }
    const bron = readFileSync(join(m.map, m.blad), "utf8");
    if (heeftKern(bron) && !kentKern) { fout(m.id, "deze app kent het @kern-blok niet (minimaleAppVersie " + m.minimaleAppVersie + ")"); continue; }
    for (const v of variantenVan.get(m.id)) {
      const wat = `${m.id}/${v.naam}`;
      try {
        const bronVan = v.antwoordenVan ?? (v.nietGerekend ? null : v.naam);
        const { toetsingen } = bronVan ? leesAntwoorden(antwoordenPad(m.map, bronVan)) : { toetsingen: {} };
        const records = kern.leesVastgelegdeToetsingen(toetsingen) ?? {};
        const opties = { toetsingen: Object.fromEntries(Object.entries(records).map(([h, r]) => [h, kern.alsAntwoord(r)])), toetsModus: "lezen" };
        const { nodes, scope: uit } = kern.evaluateMetScope(parse(bron), v.invoer ?? {}, scope, opties);
        const f = zoekFout(nodes) ?? drieDMeldingen(nodes)[0];
        if (f) { fout(wat, `rekent niet foutloos door: ${f}`); continue; }
        if (v.nietGerekend) {
          // Het omgekeerde: met deze invoer mag er niets gerekend zijn en nergens een uitkomst staan.
          const klaar = [...femBlokken(nodes), ...kernBlokken(nodes)].filter((b) => b.status === "klaar");
          const metWaarde = v.nietGerekend.filter((naam) => {
            try { return Number.isFinite(alsGetal(uit[naam], "")) || (uit[naam] && typeof uit[naam].toNumber === "function"); } catch { return true; }
          });
          const tekst = kern.render(nodes).replace(/<[^>]+>/g, " ");
          const meldingen = [...femBlokken(nodes), ...kernBlokken(nodes)].map((b) => b.melding ?? "").join(" ");
          if (klaar.length) fout(wat, `hoort niet gerekend te zijn, maar ${klaar.map((b) => `${b.type} ${b.naam}`).join(", ")} is gerekend`);
          else if (metWaarde.length) fout(wat, `hoort geen uitkomst te geven, maar heeft ${metWaarde.join(", ")}`);
          else if (/Maatgevende UC/.test(tekst)) fout(wat, "hoort geen maatgevende UC te geven");
          else if (v.melding && !meldingen.includes(v.melding)) fout(wat, `de melding bevat niet "${v.melding}": ${meldingen}`);
          else console.log(`  ✓  ${wat}: niet gerekend en zonder uitkomst, zoals het hoort${v.melding ? ` ("${v.melding}")` : ""}`);
          continue;
        }
        const blokken = femBlokken(nodes);
        const open = blokken.filter((b) => b.status !== "klaar");
        if (!blokken.length || open.length) { fout(wat, `@fem niet gerekend: ${open.map((b) => `${b.status} ${b.melding ?? ""}`).join("; ") || "geen blok"}`); continue; }
        const kernOpen = kernBlokken(nodes).filter((b) => b.status !== "klaar");
        if (kernOpen.length) { fout(wat, `@kern niet gerekend: ${kernOpen.map((b) => `${b.naam} ${b.status} ${b.melding ?? ""}`).join("; ")}`); continue; }
        const scheef = blokken.flatMap((b) => b.gevallen).filter((g) => !(Math.abs(g.somR - g.somLast) <= 1e-6 * Math.max(1, Math.abs(g.somLast))));
        if (scheef.length) { fout(wat, `geen evenwicht in ${scheef.map((g) => g.naam).join(", ")}`); continue; }
        const afwijkend = [];
        for (const [naam, [waarde, eenheid = "", tolerantie = 0.002]] of Object.entries(v.verwacht ?? {})) {
          let w;
          try { w = alsGetal(uit[naam], eenheid); } catch (e) { afwijkend.push(`${naam}: ${e.message}`); continue; }
          if (!(Math.abs(w - waarde) <= tolerantie * Math.max(Math.abs(waarde), 1e-9))) afwijkend.push(`${naam} = ${w.toPrecision(5)} ${eenheid}, verwacht ${waarde}`);
        }
        if (afwijkend.length) fout(wat, afwijkend.join("; "));
        else console.log(`  ✓  ${wat}: gerekend met de antwoorden van FEM Studio, ${Object.keys(v.verwacht ?? {}).length} uitkomsten zoals verwacht`);
      } catch (e) {
        fout(wat, `rekent niet door: ${e.message}`);
      }
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
