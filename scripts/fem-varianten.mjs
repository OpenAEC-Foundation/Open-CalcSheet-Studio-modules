// Gedeeld door scripts/controleer.mjs en scripts/fem-antwoorden.mjs: de varianten van
// een module met een @fem-blok en de vastgelegde antwoorden van Open FEM Studio.
//
//   modules/<id>/test/varianten.json    de varianten: invoer (de velden en keuzes
//                                       van het blad) en verwachte uitkomsten
//   modules/<id>/test/<naam>.json.gz    per variant de antwoorden van FEM Studio,
//                                       { versie, toetsingen } zoals de app ze bij
//                                       een blad bewaart
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

/** De rekenkern van de app en de standaardprojectgegevens als startwaarden. */
export async function laadApp(appPad) {
  const kern = await import(pathToFileURL(resolve(appPad, "packages/core/dist/index.js")).href);
  const { PROJECT_VELDEN, projectScope } = await import(
    pathToFileURL(resolve(appPad, "packages/desktop/src/store/projectGegevens.ts")).href
  );
  const scope = projectScope(Object.fromEntries(PROJECT_VELDEN.map((v) => [v.naam, v.standaard])));
  const kentFem = typeof kern.alsAntwoord === "function" && typeof kern.leesVastgelegdeToetsingen === "function" && typeof kern.femBewaar === "function";
  return { kern, scope, kentFem };
}

/** De varianten van een module, of null als de module er geen heeft. */
export function leesVarianten(map) {
  const pad = join(map, "test", "varianten.json");
  if (!existsSync(pad)) return null;
  const v = JSON.parse(readFileSync(pad, "utf8"));
  return Array.isArray(v.varianten) ? v.varianten : [];
}

export const antwoordenPad = (map, naam) => join(map, "test", `${naam}.json.gz`);

export function leesAntwoorden(pad) {
  return JSON.parse(gunzipSync(readFileSync(pad)).toString("utf8"));
}

export function schrijfAntwoorden(pad, data) {
  writeFileSync(pad, gzipSync(Buffer.from(JSON.stringify(data) + "\n", "utf8"), { level: 9 }));
}

/** Alle @fem-blokken in een doorgerekend blad, ook in een #if. */
export function femBlokken(knopen, uit = []) {
  for (const k of knopen) {
    if (k.type === "fem") uit.push(k);
    if (k.children) femBlokken(k.children, uit);
  }
  return uit;
}

/** De meldingen van de 3D-blokken in een doorgerekend blad. */
export function drieDMeldingen(knopen, uit = []) {
  for (const k of knopen) {
    if (k.type === "3d" && k.meldingen?.length) uit.push(...k.meldingen);
    if (k.children) drieDMeldingen(k.children, uit);
  }
  return uit;
}

/** Een uitkomst als getal in `eenheid` (leeg: een kaal getal). */
export function alsGetal(w, eenheid) {
  if (w && typeof w.toNumber === "function") return eenheid ? w.toNumber(eenheid) : w.toNumber();
  return Number(w);
}
