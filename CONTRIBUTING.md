# Een module bijdragen

*Contributing a module: fork this repository, add a folder under `modules/`
with `module.json`, the sheet (`.cpd`), an image (`.webp`, max. 200 kB) and a
README, run `node scripts/controleer.mjs --schrijf`, and open a pull request.
Names and descriptions are bilingual (Dutch and English).*

1. **Fork** deze repository en maak een branch.
2. **Maak een map** `modules/<id>/`. Het id bestaat uit kleine letters, cijfers
   en streepjes en is gelijk aan de mapnaam, bijvoorbeeld `kolom-staal`.
3. **Schrijf het rekenblad** `<id>.cpd` in de app (Open CalcSheet Studio): maak het blad, controleer de uitwerking en de afdruk, en sla de
   tekst op. Houd de uitdraai beknopt — uitleg die alleen op het scherm hoort,
   krijgt de klasse `alleen-scherm`.
4. **Vul `module.json` in** (zie [modules/balklaag/module.json](modules/balklaag/module.json)):

   | veld | betekenis |
   |---|---|
   | `id` | gelijk aan de mapnaam |
   | `versie` | jaar.week.nummer, bijv. `2026.44.0`; verhoog bij elke wijziging |
   | `naam`, `omschrijving` | tweetalig: `{ "nl": …, "en": … }` |
   | `categorie` | `algemeen`, `hout`, `staal`, `beton`, `metselwerk`, `fundering`, `belastingen` of `overig` |
   | `status` | `gereed` (nagerekend op referentiebladen), `controleren`, `raming` of `concept` |
   | `gepubliceerd` | `true` als de module is nagekeken en vrijgegeven |
   | `normen` | de normen waarop de toetsing steunt |
   | `blad`, `beeld` | bestandsnamen in de map |
   | `minimaleAppVersie` | de oudste app-versie waarin het blad goed doorrekent |
   | `auteurs`, `licentie` | wie de module maakte; licentie LGPL-3.0-or-later |

5. **Beeld:** een rustige technische tekening van het constructiedeel, 640×370
   px, WebP, hooguit 200 kB. Geen foto's of gegenereerde renders.
6. **README.md** in de map: wat de module toetst, de aannames, en waarop ze is
   nagerekend.
7. **Controleer** met `node scripts/controleer.mjs --schrijf` en neem de
   bijgewerkte `index.json` mee in je pull request. Rekent het blad met een
   `@fem`-blok door Open FEM Studio, beschrijf dan in `test/varianten.json` de
   varianten met hun verwachte uitkomsten (zie
   [modules/vloer-op-palen/test](modules/vloer-op-palen/test)) en leg de
   antwoorden vast met `node scripts/fem-antwoorden.mjs --app <pad>`.
8. **Open een pull request.** De controle op GitHub rekent het blad door; een
   beheerder kijkt de toetsing na voordat de module `gepubliceerd` wordt.

## Wat we niet opnemen

- Bladen die niet foutloos doorrekenen of waarvan de bron van de formules
  onduidelijk is.
- Namen van commerciële rekensoftware in bladen of documentatie: verwijs naar
  een referentieberekening of een normartikel.
- Persoons-, klant- of projectgegevens.
