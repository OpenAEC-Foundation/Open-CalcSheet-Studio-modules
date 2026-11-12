**English** · [Nederlands](README.nl.md)

# Open CalcSheet Studio — modules

Calculation modules for [Open CalcSheet Studio](https://github.com/OpenAEC-Foundation/Open-CalcSheet-Studio):
calculation sheets you add to a project as a sheet in the app. The app fetches
the catalogue (`index.json`) and installs modules through its extension manager.

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Modules

| Module | Standard | Status |
|---|---|---|
| [Timber joist floor](modules/balklaag) | NEN-EN 1995-1-1 + NB | ready |

## Structure

```
modules/<id>/
  module.json   metadata: name and description (nl + en), category, status, standards, version
  <id>.cpd      the calculation sheet, in the calculation language of the app
  beeld.webp    catalogue image for the "Add module" window (max. 200 kB)
  README.md     what the module checks and which assumptions it makes
index.json      catalogue of all modules, generated with scripts/controleer.mjs
```

A calculation sheet with a parametric view built into the app (such as the
timber joist floor) gets that view automatically: the app recognises the sheet
by its content.

## Checking

```
node scripts/controleer.mjs              # metadata, files and index.json
node scripts/controleer.mjs --schrijf    # regenerate index.json
node scripts/controleer.mjs --app <path to the app repository>
                                         # also calculate every sheet (Node 24)
```

The same check runs on GitHub for every pull request, including calculating
every sheet with the calculation core of the app.

## Licence

LGPL-3.0, like the rest of the OpenAEC family. By contributing you agree that
your module is published under this licence.
