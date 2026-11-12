# Open CalcSheet Studio — modules

Rekenmodules voor [Open CalcSheet Studio](https://github.com/OpenAEC-Foundation/Open-CalcSheet-Studio):
rekenbladen die je in de app als blad aan een project toevoegt. De app haalt de
catalogus (`index.json`) op en installeert modules via het extensiebeheer.

*Calculation modules for Open CalcSheet Studio. Each module is a
calculation sheet you add to a project; the app reads `index.json` and installs
modules through its extension manager. Contributions are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md).*

## Modules

| Module | Norm | Status |
|---|---|---|
| [Balklaag (houten vloerbalken)](modules/balklaag) | NEN-EN 1995-1-1 + NB | gereed |
| [Bedrijfsvloer op grondslag (puntlasten)](modules/vloer-op-grondslag) | CUR-Aanbeveling 36, NEN-EN 1992-1-1 + NB | concept |
| [Pons (plaat op kolom of paal)](modules/pons) | NEN-EN 1992-1-1 + NB | concept |
| [Bedrijfsvloer op palen (FEM, ponskop, stroken, krimp)](modules/vloer-op-palen) | NEN-EN 1992-1-1 + NB, NEN-EN 1992-3 | concept |

## Opbouw

```
modules/<id>/
  module.json   metadata: naam en omschrijving (nl + en), categorie, status, normen, versie
  <id>.cpd      het rekenblad, in de rekentaal van de app
  beeld.webp    catalogusbeeld voor het venster "Module toevoegen" (max. 200 kB)
  README.md     wat de module toetst en welke aannames ze doet
index.json      catalogus van alle modules, gemaakt met scripts/controleer.mjs
```

Een rekenblad met een parametrisch beeld dat in de app is ingebouwd (zoals de
balklaag), krijgt dat beeld vanzelf: de app herkent het blad aan zijn inhoud.

## Controleren

```
node scripts/controleer.mjs              # metadata, bestanden en index.json
node scripts/controleer.mjs --schrijf    # index.json opnieuw maken
node scripts/controleer.mjs --app <pad naar de app-repository>
                                         # ook elk blad doorrekenen (Node 24)
node scripts/fem-antwoorden.mjs --app <pad naar de app-repository>
                                         # de antwoorden van Open FEM Studio
                                         # vastleggen (modules met @fem of @kern)
```

Een blad met een `@fem`-blok laat de plaat door Open FEM Studio rekenen, een
`@kern`-blok een rekentool daarvan (het drielagenmodel, de scheurwijdte). Zo'n
module heeft varianten in `test/varianten.json` met hun verwachte uitkomsten, en
per variant de antwoorden van FEM Studio in `test/<naam>.json.gz`: de controle
rekent de varianten daarmee door, zonder FEM Studio.

Bij elke pull request draait dezelfde controle op GitHub, inclusief het
doorrekenen van elk blad met de rekenkern van de app.

## Licentie

LGPL-3.0, net als de rest van de OpenAEC-familie. Door bij te dragen ga je
akkoord dat je module onder deze licentie wordt gepubliceerd.
