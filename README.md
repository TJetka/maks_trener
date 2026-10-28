# MaksTrener

Polish mathematical contest practice for primary-school children. This implements
the app described in [prd.md](prd.md), with ten games, both scoring systems, a
45-minute simulation, mystery variants, targeted drills, parent statistics and
JSON import/export.

The app is plain HTML, CSS and ES modules. It has **no runtime dependencies, build
step, backend, accounts, analytics, external fonts or CDN requests**. Results stay
in this browser under `localStorage["makstrener.v1"]`.

## Run locally

With Node 20.11 or newer:

```sh
npm start
```

Open <http://127.0.0.1:4173>. No `npm install` is needed. `PORT=8080 npm start`
changes the port. Alternatively, serve the repository with a static HTTP server:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open through HTTP, not by double-clicking `index.html`: browsers restrict ES
modules loaded from `file://` URLs.

## GitHub Pages

In this repository's **Settings → Pages**, select **Deploy from a branch**,
**main**, **/(root)**. The app's relative asset paths work under the repository
subpath. No custom GitHub Actions workflow is required or included. `.nojekyll`
keeps the files static. After Pages finishes publishing, the default URL is
<https://tjetka.github.io/maks_trener/>.

Assets use release query strings, including every imported application module.
Run `npm run release:version -- 1.0.2` with the next version to update those queries,
package metadata and run provenance together. There is deliberately no service
worker, so it cannot serve an old cached shell. Reload after a deploy. Initial
loading requires the site to be reachable; once loaded, gameplay uses no network.

## Features

- **Trening:** Dzielnik, Działanie, Sumuj, Wybierz, Podziel to, Plus i minus,
  Tak czy Nie, Słupek, Kwadrat and Karuzela. The first four use documented game
  mechanics; the remaining six are marked as training reconstructions.
- **Symulacja:** two chosen or hidden randomized games, a continuous 45-minute
  clock, unlimited runs, per-game bests, active play time and tie-break timestamps.
  Switching tabs does not pause it. Rules lock after two minutes by default.
- **Tajemnicza gra:** reproducible parameter profiles, Polish rules generated
  from those parameters, reading time, first-correct latency and first/best ratio.
- **Ćwiczenia:** 20-item weighted multiplication/division sets, divisibility
  selection and missing-number/operator exercises. A drill is untimed per item.
- **Statystyki:** records, accuracy, median response time, recent bests,
  completion rates, fact heatmap, weaknesses, sessions and variant history.
- **Ustawienia:** grades 3–5, keypad side, optional sound, answer reveal, 12×12
  facts, free expression mode, and a form for manually creating new variants.
- **Data:** validated JSON export/import merging by run/session ID; explicit
  confirmation for reset; bounded attempt details with retained aggregate counts.

Input works by mouse, touch or keyboard. Tab navigates controls; Enter confirms;
Backspace undoes numeric/expression input; T/← and N/→ answer Tak czy Nie; R retries
from a game result; Esc closes rules. Countdown clocks start on the first board
interaction; first-answer analytics also include the thinking time before that
interaction. Free and mystery runs pause when the tab becomes hidden.

At narrow widths Sumuj reduces board density to keep cells at least 44 px wide.
The effective maximum grid size is included in each run's provenance; a saved
variant can therefore have a smaller board on a phone than on a desktop.

## Tests

```sh
npm run check
npm test
```

The native Node test runner covers 10,000 seeded instances for **each of the ten
games**, uniqueness solvers, score tables, monotonic clocks, suspended-tab
deadlines, bounded event logs, validation, import merging, drill sampling, mystery
profiles across difficulty boundaries, and a full tiny training pipeline.

If you use pytest, the same checks are available through:

```sh
uv run --with pytest pytest -q
uv run --with pytest pytest -q tests/test_app.py -k engine
```

No test makes network calls. The 45-minute deadline is tested with an injected
clock, rather than a slow wall-clock wait. See [QA.md](QA.md) for manual verification
and outstanding device checks.

## Code map

`js/engine/` contains pure arithmetic/scoring, clocks, run/session controllers,
storage and statistics. `js/games/<id>/generator.js` exports `generate`, `check`,
`difficulty` and `rulesCard`; each `view.js` only renders/input-binds that game.
Parameter ramps live beside their generators, and the manual-variant allowlist
lives in `js/engine/mystery.js`. `js/i18n/pl.js` owns application copy. `js/ui/`
contains shared DOM primitives and page layouts; `js/app.js` coordinates them.

Runs store seeds, generator/app versions, effective settings and override
snapshots. There are no datasets or model artifacts. To reproduce a board, create
the same `Run` using the recorded seed/settings/overrides, then replay recorded
answers and level transitions. Compacted runs retain statistics but cannot fully
replay their discarded attempt history. Git commits identify source revisions;
the static browser runtime does not have access to the repository's Git metadata.

The two future games Schody and Suwak remain outside v1, as specified in the PRD.
