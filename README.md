# Open Structural Calculation Studio — modules

Rekenmodules voor [Open Structural Calculation Studio](https://github.com/OpenAEC-Foundation/Open-Structural-Calculation-Studio):
rekenbladen die je in de app als blad aan een project toevoegt. De app haalt de
catalogus (`index.json`) op en installeert modules via het extensiebeheer.

*Calculation modules for Open Structural Calculation Studio. Each module is a
calculation sheet you add to a project; the app reads `index.json` and installs
modules through its extension manager. Contributions are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md).*

## Modules

| Module | Norm | Status |
|---|---|---|
| [Balklaag (houten vloerbalken)](modules/balklaag) | NEN-EN 1995-1-1 + NB | gereed |

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
```

Bij elke pull request draait dezelfde controle op GitHub, inclusief het
doorrekenen van elk blad met de rekenkern van de app.

## Licentie

LGPL-3.0, net als de rest van de OpenAEC-familie. Door bij te dragen ga je
akkoord dat je module onder deze licentie wordt gepubliceerd.
