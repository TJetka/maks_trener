# PRD: MaksTrener

Training app for the Maks Matematyczny contest (5 Nov 2026), grade 4 preset.
Status: draft v1, 2026-10-28. Owner: Tomasz. Hosting: GitHub Pages (static).

---

## 1. Background and problem

Maks Matematyczny is not a test. It is two timed browser "optimisation games" played within a 45-minute window; each game may be restarted any number of times and only the best score per game counts; the final result is the sum of the two bests; ties are broken by the larger single component, then by the time at which the best score was reached. No calculator, no help. Age categories by grade.

Historical games (2015–2021, organiser Mogalo) and what is known about them:

| # | Game | Year | Rules known? | Skill family |
|---|------|------|--------------|--------------|
| 1 | Podziel to | 2015 | name + "division training" only | division, remainder |
| 2 | Schody | 2015 | name only | sequences/patterns (assumed) |
| 3 | Działanie | 2016 | yes (scoring + mechanic) | build expression to hit target |
| 4 | Dzielnik | 2016 | yes (scoring + mechanic) | divisibility, grid scan |
| 5 | Sumuj | 2017 | yes (scoring + mechanic) | grid search by sum |
| 6 | Wybierz | 2017 | yes (scoring + mechanic) | products, row selection |
| 7 | Kwadrat | 2017 | name only | grid sums (assumed) |
| 8 | Karuzela | 2017 | name only | chained operations (assumed) |
| 9 | Plus i minus | 2018 | name only | sign placement (assumed) |
| 10 | Tak czy Nie | 2018 | name only | true/false verification (assumed) |
| 11 | Suwak | 2019 | name only | number line / estimation (assumed) |
| 12 | Słupek | 2020 | name only | column arithmetic (assumed) |

The 2026 edition is run by a new company; its two public demo games are Dzielnik and Działanie with the 2016 rules. Descriptions of the contest games have historically been published the evening before the contest. The games on contest day will most likely be ones the child has never seen.

Therefore the product trains three transferable things, in this priority order:
1. Fluency in the skill families above, at grade-4 number ranges, under time pressure.
2. Behaviour under the two scoring archetypes used by every documented Maks game (Ladder and Streak, section 6.1).
3. Fast rule acquisition: read a new Polish rules card, start playing within a minute, reach a sensible score on the first run.

## 2. Goals and success metrics

Primary user outcome: a measurable improvement in the child's performance between the baseline on 28 Oct and the second simulation on 3 Nov, plus confidence on contest day.

Measurable targets (initial values, tune after baseline):

| Metric | Target by 3 Nov |
|--------|-----------------|
| Działanie: levels completed in one 300 s run | 20 (full ladder), score ≥ 380 of 430 |
| Dzielnik: boards cleared before run end | ≥ 25 (≥ 175 pts) with ≤ 2 strikes |
| Sumuj: levels completed in 300 s | ≥ 16 |
| Wybierz: levels cleared | ≥ 30 |
| Mystery mode: time from "Start" to first correct answer on an unseen variant | ≤ 45 s |
| Mystery mode: first-run score as % of the child's best on that variant | ≥ 60% |
| Multiplication facts 2–10: median response | ≤ 2.0 s, accuracy ≥ 95% |
| Divisibility by 3/6/9 (numbers to 200): accuracy | ≥ 90% at ≤ 4 s |
| 45-min simulation: % of window used | ≥ 90%, with at least 3 runs per game |

Product metrics (for the build): all generators produce solvable, non-ambiguous levels in 10,000 seeded trials; scoring reproduces the historical tables exactly; a full 45-min session runs on an iPad/Android tablet without reload.

## 3. Non-goals

- Pixel or UI fidelity to the original games. Mechanics and scoring matter; visuals do not.
- Accounts, backend, multiplayer, leaderboards across users.
- Curriculum coverage beyond what the skill families need (no fractions, decimals, geometry).
- Sound design. Sounds off by default; schools may forbid audio.
- Native apps. Responsive web only.

## 4. Users and contexts

- Player: a 4th grader (about 10 years old), Polish-speaking, reads independently, plays 15–25 minutes a day, sometimes alone. Needs: zero friction start, obvious timer and score, immediate feedback, no shaming on errors.
- Coach: parent. Needs: per-session stats, weak-fact detection, a drill that targets them, export of data, ability to approximate a newly described game via parameters on 4 Nov evening.
- Devices: Windows/Chrome or Edge with mouse at home; the school may use a PC, tablet or phone. Must work on all three input modes, portrait and landscape, down to 360 px width.

## 5. Constraints

- Static site on GitHub Pages: no server, no build step required (plain ES modules), no external services. CDN dependencies avoided; if any, pinned versions.
- Persistence: localStorage (with JSON export/import). No cookies, no analytics, no tracking.
- Language: UI in Polish. Strings in one table (Appendix A) with English keys for maintainability.
- Accessibility: tap targets ≥ 56 px on boards, ≥ 44 px elsewhere; colour never the only signal (icons/text accompany red/green); font ≥ 18 px on boards.
- Time budget: M0 usable today (28 Oct), full scope by 31 Oct (section 13).

## 6. Shared engine

### 6.1 Scoring archetypes

Every game declares one archetype. Parameters are per game (section 7) and overridable by Mystery mode (section 8.3).

Ladder (L), modelled on Działanie/Sumuj:
- 20 levels. Points for clearing level i: `11 + i` (12, 13, ..., 31). Maximum 430.
- Wrong answer: −3 points, level is not advanced; a fresh instance of the same level number is generated (configurable: `retrySameInstance: false`).
- Run time: 300 s total, counting down from the first interaction.
- Run ends when level 20 is cleared, the 300 s expire, or the session clock expires.
- Final run score: `max(0, total)`.
- Points per level must be visible on screen before answering (child learns late levels are worth more).

Streak (S), modelled on Dzielnik/Wybierz:
- Fixed points per cleared level `c` (Dzielnik 7, Wybierz 8).
- Per-level timer `t` seconds (Dzielnik 15, Wybierz 20); it resets each level.
- Mistakes: a wrong action is a strike; 3 strikes end the run. No point deduction.
- Timeout on a level ends the run (as in both documented games).
- Level cap 90 (documented for Wybierz; assumed for Dzielnik). Maximum = `90 × c`.
- Run ends on 3 strikes, level timeout, level cap, or session clock.

Both: run score is recorded immediately at run end; the game's best is updated with the timestamp of the moment the best was achieved (needed for the tie-break display).

### 6.2 Timers

- Single monotonic clock based on `performance.now()`; UI updated via `requestAnimationFrame`. No `setInterval` accumulation.
- Drift tolerance: ≤ 100 ms over 300 s.
- Timers pause only on tab visibility loss in Free play; never in Session mode (the real contest clock does not pause). Visibility loss in Session mode is logged as an event.

### 6.3 Level generator contract

Each game ships a pure module `games/<id>/generator.js` exporting:

```
generate(level: number, params: Params, rng: Rng): LevelInstance
check(instance: LevelInstance, answer: Answer): { correct: boolean, detail?: object }
rulesCard(params: Params): string   // Polish text shown under "?"
difficulty(level): Params             // the grade preset ramp
```

Requirements:
- Deterministic given `(seed, level, params)`; seeded RNG (mulberry32) so a run can be replayed and bugs reproduced.
- Every instance is solvable by construction and passes a uniqueness check where the mechanic needs one (Sumuj, Wybierz, Słupek, Kwadrat). Generators loop up to 200 attempts, then relax the hardest constraint and log it.
- No DOM access in generators. Rendering lives in `games/<id>/view.js`.
- Each instance carries an `itemSignature` (e.g. `mul:7x8`, `div3:117`, `col:add-carry`) used by the drill's weakness model.

### 6.4 Input model

- Mouse, touch and keyboard all supported. On boards: tap/click. For numeric answers: on-screen keypad (0–9, backspace, OK) plus physical keyboard; Enter = OK.
- Selections show a pending state; an explicit "Zatwierdź" button is used only where the original mechanic implies confirmation (Wybierz, Działanie slot mode, Słupek, Kwadrat). Single-tap games (Dzielnik, Sumuj, Tak czy Nie, Karuzela) check immediately.
- Accidental double-tap guard: 150 ms.

### 6.5 Feedback

- Correct: brief green flash, points animate into the score, next level within 300 ms.
- Wrong: red flash on the chosen element, strike/−3 shown, and (Free play only) the correct answer highlighted for 1.2 s. In Session mode no answer reveal, as in the contest.
- Run end screen: score, levels reached, accuracy, median time per level, best so far, buttons "Jeszcze raz" (restart same game, one tap) and "Zmień grę".

### 6.6 Result recording

Each run appends to `runs[]` (section 10). Each level attempt appends an event `{t, level, correct, responseMs, itemSignature, answer}`.

## 7. Game specifications

Fidelity tier: A = rules documented from past editions, B = reconstructed from the name and known skill target. The "Variant knobs" column lists what Mystery mode may randomise.

Grade-4 number ranges used throughout the presets: addition/subtraction to 1000, multiplication table to 10×10 (12×12 optional), division within the table and with remainder for dividends to 100 (to 999 at late levels), divisibility by 2, 3, 4, 5, 6, 9, 10, order of operations with brackets, no fractions/decimals.

### G1 Dzielnik (tier A, Streak)

- Goal: on a board of numbers, tap two numbers divisible by the requested divisor.
- Board: 4×5 = 20 cells (knob: 12–30), values 10–199 (knob), divisor `d` drawn per board from the set {3, 6, 9} (preset), shown large above the board.
- Generator: exactly `k ∈ [2, 4]` cells divisible by `d`; distractors include near misses: for 3/9 a digit sum off by ±1, for 6 numbers divisible by 3 but odd and even numbers not divisible by 3. At least one near miss per board.
- Input: tapping a valid cell marks it; two valid cells clear the board (+7). Tapping an invalid cell is a strike; the cell turns red and stays marked.
- Timer: 15 s per board; timeout ends the run. 3 strikes end the run. Cap 90 boards.
- Ramp: levels 1–20 values 10–99; 21–50 values 10–199; 51–90 values 10–299.
- Variant knobs: divisor set ({2,5,10}, {3,4,6}, {3,6,9}, {4,8}, {7,9}), board size, value range, per-board time (10–20 s), cells to find (2 or 3).
- Rules card (PL): see Appendix B.
- Acceptance: 10,000 seeded boards all contain ≥ 2 valid cells and ≥ 1 near miss; strike/timeout logic matches 6.1; the divisor changes between boards.

### G2 Działanie (tier A, Ladder)

- Goal: reconstruct an expression that equals the shown target by choosing numbers and operators.
- Default UI ("slot mode"): a template with blank number slots and blank operator slots, e.g. `[ ] + [ ] × [ ] = 46`, filled by tapping tokens from a number palette (solution numbers plus 1–2 distractors) and an operator palette. "Zatwierdź" checks. Alternative "free mode" (build any expression left to right, brackets allowed) is a setting; off by default.
- Evaluation: standard precedence; brackets allowed from level 13 (template includes them); division must be exact; all intermediate results are non-negative integers.
- Ramp:
  - L1–6: 2 numbers, ops {+, −}, results ≤ 200.
  - L7–12: 2 numbers, ops {+, −, ×, ÷} with table facts; or 3 numbers {+, −}.
  - L13–17: 3 numbers with one × or ÷ and precedence mattering.
  - L18–20: 3–4 numbers, brackets present in the template.
- Scoring: Ladder (12→31, −3, 300 s). On a wrong check the slots clear and a new instance of the same level appears.
- Variant knobs: operator set, number of slots, distractor count, whether operators are pre-filled (then only numbers are chosen) or numbers are pre-filled (then only operators), time per run.
- Acceptance: every instance has at least one solution with the given template and palette; the checker accepts any valid filling, not just the generated one.

### G3 Sumuj (tier A, Ladder)

- Goal: find the placement of the shown shape on the number grid such that the covered numbers add up to the target; tap the cell corresponding to the shape's marked ("characteristic") cell.
- Grid: 6×6 (knob 5–8), values 1–15 (preset, ramping to 1–30). Shape shown beside the grid in fixed orientation with one cell marked by a dot.
- Shape library: domino (2 cells, horizontal/vertical), straight 3, L-tromino, 2×2 square, T-tetromino, straight 4. Ramp: L1–5 two cells, L6–12 three cells, L13–20 four cells; grid grows 5×5 → 7×7 across the ladder.
- Uniqueness: regenerate until exactly one placement of the shape (in the shown orientation) yields the target sum.
- Input: single tap on the grid. Correct: +points. Wrong: −3, tapped cell flashes red, same level regenerated.
- Scoring: Ladder.
- Variant knobs: shape set, grid size, value range, whether rotations are allowed (then any placement in any rotation counts, uniqueness computed over all rotations), target = sum (default) or product (hard variant).
- Acceptance: uniqueness verified by brute force for every generated instance.

### G4 Wybierz (tier A, Streak)

- Goal: select rows of a table so that, in every column, the product of the selected numbers equals the target printed in the last row.
- Table: `r` rows × `c` columns of single digits 1–9 plus a target row. Preset: L1–30 `c = 2, r = 3–4`, L31–60 `c = 3, r = 4`, L61–90 `c = 3, r = 5`. Subset size 2–3.
- Uniqueness: only one subset of rows satisfies all columns (brute force over subsets).
- Input: tap rows to toggle highlight; "Zatwierdź" checks. Wrong = strike (selection cleared). 20 s per level, timeout ends run. 8 points per level. Cap 90.
- Variant knobs: operation (product default, sum variant), columns 2–4, rows 3–6, digits 1–9 or numbers 1–20 (sum variant), per-level time.
- Acceptance: targets never exceed 729 for product variant (9×9×9); uniqueness holds.

### G5 Podziel to (tier B, Streak)

- Reconstruction: a division trainer (the 2015 public "trening dzielenia" used this game).
- Goal: compute `n ÷ d`; enter the quotient, and the remainder when the level requires it.
- Ramp: L1–30 exact division within the table (`d ∈ 2–9`, `n = d × q`, `q ≤ 10`); L31–60 division with remainder, `n ≤ 100`; L61–90 `n ≤ 999`, `d ∈ 2–9`, remainder allowed.
- Input: keypad; fields "iloraz" and (when applicable) "reszta"; OK or Enter. 15 s per item. 8 points. 3 strikes.
- Variant knobs: remainder on/off, dividend range, divisor set, time.
- Acceptance: remainder field is hidden when the level is exact-only; the check requires both fields to be correct.

### G6 Plus i minus (tier B, Ladder)

- Reconstruction: insert + or − between given numbers to obtain the target.
- Goal: `8 _ 3 _ 5 _ 2 = 8`; set each blank to + or − so the equation holds.
- Ramp: L1–7 two blanks, numbers 1–20; L8–14 three blanks, numbers 1–30; L15–20 four blanks, numbers 1–50; optional `×` as a third sign from L17 (setting, off by default).
- Correctness: any sign assignment that makes the equation true is accepted (checked by evaluating all `2^k` or `3^k` assignments). Generator rejects instances with more than 2 valid assignments to keep the search non-trivial.
- Input: tap a blank to cycle + / −; "Zatwierdź". Wrong: −3, same level regenerated.
- Variant knobs: number of blanks, number range, sign set, fixed first sign.

### G7 Tak czy Nie (tier B, Streak)

- Reconstruction: judge statements true/false as fast as possible.
- Item types (mix configurable): equality `7 × 8 = 54`; inequality `34 + 29 < 60`; divisibility `48 jest podzielne przez 6`; comparison of two expressions `6 × 7 ? 5 × 9` with a stated relation; remainder claim `29 : 4 daje resztę 1`.
- Near-miss generation for false items: ±1 or ±10 on the result, digit swap, neighbouring table fact (`a × (b ± 1)`), off-by-one divisibility.
- Input: two big buttons TAK / NIE (keyboard: ← / → or T / N). 7 s per item (knob 4–10). 8 points. 3 strikes. Cap 90.
- Ramp: L1–30 single-operation facts; L31–60 two-step expressions; L61–90 divisibility and remainder claims, numbers to 300.
- Acceptance: exactly 50% ± 5% of items true over 1,000 generated items; no item is trivially decidable by parity alone more than 20% of the time.

### G8 Słupek (tier B, Ladder)

- Reconstruction: column (written) arithmetic with missing digits.
- Goal: a vertical addition or subtraction with 1–3 digits hidden (in the operands or the result); fill them in.
- Ramp: L1–6 two-digit addition, one blank; L7–12 three-digit addition/subtraction with carries/borrows, two blanks; L13–17 three blanks, mixed; L18–20 multiplication of a 2–3 digit number by a single digit with blanks.
- Uniqueness: the blanks must be uniquely determined (solver enumerates 10^blanks fillings).
- Input: tap a blank, choose a digit from a 0–9 strip; "Zatwierdź". Wrong: −3, same level regenerated.
- Variant knobs: operation set, digit count, blanks count, blanks allowed in result only.

### G9 Kwadrat (tier B, Ladder)

- Reconstruction: a grid whose rows and columns must sum to given totals.
- Goal: 3×3 grid with row totals on the right and column totals below; 1–4 cells blank; fill from a palette of candidate numbers (solution numbers plus 1–2 distractors).
- Ramp: L1–5 one blank, values 1–9; L6–12 two blanks, values 1–20; L13–20 three to four blanks, values 1–30; 4×4 grid from L17.
- Uniqueness: solver verifies a single filling from the palette satisfies all totals.
- Input: tap a blank, tap a palette number; "Zatwierdź". Wrong: −3.
- Variant knobs: grid size, blanks count, totals shown for rows only / columns only / both, diagonal totals (hard).

### G10 Karuzela (tier B, Streak)

- Reconstruction: a chain of operations applied to a start number; pick the result from a ring of options.
- Goal: `12 → +9 → ×2 → −7 = ?`; six options arranged in a ring; tap the correct one.
- Ramp: L1–30 chain of 2 ops {+, −}; L31–60 chain of 3 ops incl. × and ÷ within the table; L61–90 chain of 4 ops, intermediate values to 500.
- Distractors: results of skipping one op, applying ops in the wrong order, off-by-one.
- Input: single tap. 12 s per item (knob 8–20). 8 points. 3 strikes. Cap 90.
- Variant knobs: chain length, operator set, options count (4–8), whether ops are revealed one by one (timed reveal, harder) or all at once.

### Backlog (not in v1)

- Schody (sequence/pattern stairs): pick the next step of an arithmetic or alternating sequence; Streak.
- Suwak (number line): place a slider at the value of an expression on a 0–100 / 0–1000 line with shrinking tolerance; Ladder.

## 8. Modes

### 8.1 Free play (Trening)

Pick a game, play runs, see the end screen, repeat. Rules card available under a "?" icon on every board (mirrors the original UI). Answer reveal on errors is on.

### 8.2 Session (Symulacja 45 min)

Replicates the contest frame:
- Two game slots. Coach picks them or presses "Losuj" (random; can be restricted to tier A, tier B, or all). Games are revealed only when the session starts, with their rules cards.
- A 45:00 countdown starts on the first "Start" and never pauses. Runs may be started in any order and any number of times; a run in progress is cut when the clock hits zero and scored as it stands.
- Live panel: best per game, sum, time at which each best was set.
- End screen: final sum, per-game bests, number of runs per game, % of window used, minutes spent per game, time-to-best, and the tie-break line ("wyższy składnik: X, osiągnięty po MM:SS").
- No answer reveal on errors; no rules card after the first 2 minutes (setting, default on, to simulate having to remember the rules).

### 8.3 Mystery (Tajemnicza gra)

Trains rule acquisition:
- Picks a game (random or chosen) and randomises a variant profile from the game's knobs (section 7). Generates the Polish rules card from the profile.
- Flow: rules card shown with a "Przeczytałem, start" button; the reading time is logged; then a normal run.
- Logs: reading time, time to first correct answer, first-run score, and later best on the same variant (variant id is stable so the child can replay it).
- Coach view lists variants with first-run vs. best ratio, to see whether the child adapts faster over the week.

### 8.4 Drill (Ćwiczenia celowane)

Targets weaknesses from the error/slowness log:
- Multiplication/division facts: a 10×10 heatmap from all `mul:` and `div:` signatures (accuracy and median response); the drill draws 20 flash items weighted by `(errors + 1) × max(1, medianMs / 2000)`.
- Divisibility flash: a number appears, the child taps all applicable divisors from {2, 3, 4, 5, 6, 9, 10}; weighted by divisor error rate.
- Make-the-target flash: 2–3 numbers, one target, type the missing operator or number.
- Each drill set is 20 items, untimed per item but total time shown; ends with the three slowest facts.

### 8.5 Stats (Statystyki)

Per game: best (all-time and last 7 days), runs, accuracy, median seconds per level, levels-reached histogram (Ladder) or boards-cleared histogram (Streak), error taxonomy (e.g. "podzielność przez 6: 7 błędów", "7×8: 3 błędy").
Sessions: list with final sums, per-game bests, runs per game, time-to-best, % window used.
Mystery: table of variants with reading time, time-to-first-correct, first-run score, best.
Coach summary card: top three weaknesses with a one-tap "Ćwicz to" that opens the matching drill.
Export/import: JSON file (whole store). Reset with confirmation.

## 9. UI and UX requirements

- Home: six large tiles (Trening, Symulacja, Tajemnicza gra, Ćwiczenia, Statystyki, Ustawienia).
- Game screen layout (portrait and landscape): top bar with score (left), timer bar and digits (centre), level and points-for-this-level or strikes (right); board centred; palettes/keypad at the bottom within thumb reach; "?" icon top-right opens the rules card as an overlay.
- Timer: numeric plus a shrinking bar; last 5 s of a per-level timer pulse the bar (no sound).
- Error display: strikes as three empty circles that fill; Ladder deductions as a red "−3" toast.
- No modal dialogs during a run except the rules card.
- Keyboard shortcuts: Enter = confirm, Backspace = undo, R = restart on the end screen, Esc = close rules card.
- Minimum width 360 px; boards scale with `min(vw, vh)`; cells never below 44 px (board density is reduced instead).
- Theme: high contrast, large type, light background; dark mode optional via `prefers-color-scheme`.
- Settings: grade preset (3 / 4 / 5: shifts number ranges), left/right keypad placement, sounds (off), answer reveal in Free play (on), 12×12 table (off), free-mode Działanie (off), rules-card timeout in Session (on).

## 10. Data and persistence

localStorage key `makstrener.v1`, JSON:

```
{
  "version": 1,
  "settings": { "grade": 4, "keypadSide": "right", "sounds": false, ... },
  "runs": [
    {
      "id": "r_…", "gameId": "dzielnik", "variantId": "dzielnik:preset" | "dzielnik:v_ab12",
      "mode": "free" | "session" | "mystery", "sessionId": "s_…" | null,
      "seed": 123456, "startedAt": 1730100000000, "durationMs": 300000,
      "score": 175, "levelsReached": 25, "strikes": 2, "endReason": "strikes" | "timeout" | "cap" | "session" | "levels",
      "events": [ { "t": 1200, "level": 1, "correct": true, "responseMs": 2800, "itemSignature": "div3:117", "answer": "..." } ]
    }
  ],
  "sessions": [ { "id": "s_…", "startedAt": ..., "games": ["dzielnik","sumuj"], "bests": {...}, "bestAt": {...}, "windowUsedMs": ..., "runsPerGame": {...} } ],
  "variants": { "dzielnik:v_ab12": { "params": {...}, "rulesText": "..." } }
}
```

- Events are capped at 400 per run; older events are summarised (counts, medians) if the cap is hit.
- Store size guard: if over 4 MB, oldest free-play runs are compacted to summaries.
- Export: download `makstrener-YYYY-MM-DD.json`. Import: merge by run id.

## 11. Technical design

- Stack: HTML + CSS + vanilla JavaScript (ES2020 modules). No framework, no bundler, no npm runtime dependencies. Optional dev dependency: a tiny test runner (node `node --test`) for generators.
- Layout:

```
/index.html
/css/app.css
/js/app.js                 router, home, settings
/js/engine/clock.js        timers
/js/engine/scoring.js      Ladder/Streak state machines
/js/engine/rng.js          mulberry32, seed helpers
/js/engine/store.js        localStorage, export/import
/js/engine/session.js      45-min session controller
/js/engine/mystery.js      variant profiles and rules-card builder
/js/engine/drill.js        weakness model, drill sets
/js/engine/stats.js        aggregations
/js/games/<id>/generator.js, view.js, params.js
/js/i18n/pl.js             string table
/tests/*.test.js           generator and scoring tests
```

- GitHub Pages: deploy from `main` root (or `/docs`). Asset URLs carry a version query (`app.js?v=…`) to defeat Pages caching after each deploy.
- Offline: optional service worker caching the shell; if included, show an "update available" toast rather than silently serving stale code.
- Performance: first paint < 1 s on a mid-range tablet; no layout shifts during a run.
- Browser support: current Chrome, Edge, Safari (iOS 16+), Firefox.

## 12. Coach analytics definitions

- Accuracy = correct events / all events in a run.
- Median response = median `responseMs` over correct events.
- Ladder completion = share of runs reaching level 20.
- Time-to-best = `bestAt − sessionStart`.
- Weakness score per item signature = `errors × 2 + slowCount`, where slow = responseMs above the 75th percentile for that family.
- Adaptation index (Mystery) = first-run score / best score on the same variant; track its 7-day trend.

## 13. Milestones

| Milestone | Date | Scope | Done when |
|-----------|------|-------|-----------|
| M0 | 28 Oct | engine (clock, scoring, rng, store), Dzielnik, Działanie, Free play, minimal stats | child completes a baseline run of both on a tablet and a PC |
| M1 | 29 Oct | Sumuj, Wybierz, Session mode, end screens, rules cards | one full 45-min session recorded end to end |
| M2 | 30–31 Oct | Podziel to, Plus i minus, Tak czy Nie, Słupek, Kwadrat, Karuzela, Drill, Mystery | all generators pass tests; mystery variants produce valid rules cards |
| M3 | 1 Nov | Stats dashboard, export/import, polish, cross-device check | coach summary card shows real weaknesses |
| M4 | 4 Nov evening | "Szybki wariant": a form to set knobs manually so an official description can be approximated in minutes | a new variant can be created and played within 5 minutes |

Build approach: implement with Claude Code; generators first (test-driven), views second. Keep each game under 300 lines of view code.

## 14. Acceptance checklist

- [ ] Scoring tables reproduce: Ladder 12…31 with −3 and clamp at 0, max 430; Streak 7 or 8 per level, 3 strikes, per-level timeout ends run, cap 90.
- [ ] 10,000 seeded instances per game: solvable; uniqueness where required; parameter ramps respected; no negative or non-integer intermediates.
- [ ] Timer drift ≤ 100 ms over 300 s; session clock does not pause on tab switch.
- [ ] All boards usable at 360 px width with ≥ 44 px cells; keypad reachable with one thumb on a phone.
- [ ] Rules card available on every board; Polish strings only in the child-facing UI.
- [ ] Session end screen shows bests, sum, runs per game, time-to-best, tie-break line.
- [ ] Export/import round-trips the store.
- [ ] Works on iPad Safari, Android Chrome, Windows Chrome/Edge; no console errors.
- [ ] Lighthouse accessibility ≥ 90.

## 15. Risks and open questions

- Fidelity: six of ten games are reconstructions. Mitigation: Mystery mode and M4 "Szybki wariant" so the official descriptions on 4 Nov can be approximated quickly; prioritise skill families over mechanics.
- New organiser may change scoring regimes. Mitigation: both archetypes are parameterised (points, time, strikes, levels); a third archetype can be added in `scoring.js` without touching games.
- Number ranges of the originals are unknown. Mitigation: ranges are knobs; the grade preset is a guess to be tuned after the baseline.
- Over-training: a 10-year-old may burn out. Mitigation: sessions capped at 25 minutes except the two simulations; the app shows a "koniec na dziś" nudge after 25 minutes of play.
- GitHub Pages caching serving stale JS. Mitigation: versioned asset URLs.
- Open: should Działanie default to slot mode or free mode? Decision for M0: slot mode; revisit after the baseline if the official demo clearly uses free construction.
- Open: does the real Dzielnik have a level cap? Unknown; 90 assumed.

---

## Appendix A: Polish string table (starter)

```
home.train = Trening
home.session = Symulacja 45 min
home.mystery = Tajemnicza gra
home.drill = Ćwiczenia celowane
home.stats = Statystyki
home.settings = Ustawienia
game.score = Punkty
game.level = Poziom
game.time = Czas
game.strikes = Pomyłki
game.points_for_level = za ten poziom
game.confirm = Zatwierdź
game.undo = Cofnij
game.restart = Jeszcze raz
game.change = Zmień grę
game.rules = Zasady
game.read_start = Przeczytałem, start
game.wrong = Źle, −3
game.timeout = Koniec czasu
game.strikeout = Trzecia pomyłka, koniec gry
game.cap = Brawo, maksymalny poziom!
end.levels = Poziomy
end.accuracy = Skuteczność
end.median = Mediana czasu na poziom
end.best = Najlepszy wynik
session.left = Do końca
session.best_sum = Suma najlepszych
session.tiebreak = Wyższy składnik: {x}, osiągnięty po {t}
session.start = Start
drill.weakest = Najsłabsze fakty
drill.go = Ćwicz to
stats.export = Eksportuj
stats.import = Importuj
stats.reset = Wyczyść dane
nudge.enough = Dobra robota. Na dziś wystarczy!
```

## Appendix B: Rules cards (Polish, shown under "?")

Dzielnik: "Na planszy wskaż 2 liczby podzielne przez podany dzielnik. Masz 15 sekund na każdą planszę. Za każdą dobrą planszę 7 punktów. Trzy pomyłki albo przekroczenie czasu kończą grę."

Działanie: "Ułóż działanie, które daje podany wynik: wybierz liczby i znaki. Masz 300 sekund na 20 poziomów. Poziomy są warte 12, 13, 14 … 31 punktów. Błąd to −3 punkty. Wynik ujemny na końcu liczy się jako 0."

Sumuj: "Znajdź na planszy pokazany kształt tak, aby liczby w nim sumowały się do podanej liczby. Kliknij pole oznaczone kropką. 20 poziomów, 300 sekund, punkty 12…31, błąd −3."

Wybierz: "Zaznacz wiersze tak, aby w każdej kolumnie iloczyn zaznaczonych liczb był równy liczbie w ostatnim wierszu. 20 sekund na poziom, 8 punktów za poziom. Trzy pomyłki, koniec czasu lub poziom 90 kończą grę."

Podziel to: "Oblicz iloraz (i resztę, jeśli jest). 15 sekund na przykład, 8 punktów. Trzy pomyłki kończą grę."

Plus i minus: "Wstaw znaki + i − tak, aby równość była prawdziwa. 20 poziomów, 300 sekund, punkty 12…31, błąd −3."

Tak czy Nie: "Czy zdanie jest prawdziwe? Naciśnij TAK albo NIE. 7 sekund, 8 punktów, trzy pomyłki kończą grę."

Słupek: "Uzupełnij brakujące cyfry w działaniu pisemnym. 20 poziomów, 300 sekund, punkty 12…31, błąd −3."

Kwadrat: "Wstaw liczby tak, aby sumy w wierszach i kolumnach zgadzały się z podanymi. 20 poziomów, 300 sekund, punkty 12…31, błąd −3."

Karuzela: "Wykonaj po kolei podane działania i wskaż wynik na karuzeli. 12 sekund, 8 punktów, trzy pomyłki kończą grę."

Mystery mode composes these from templates: `{goal}. {timing}. {scoring}. {ending}.` with the knob values substituted.

## Appendix C: Generator notes

Sumuj uniqueness: for the chosen shape and orientation, enumerate all placements on the grid, compute sums, require exactly one placement equals the target; if more than one, re-roll only the cells of the colliding placements (not the whole grid) to converge quickly.

Wybierz uniqueness: enumerate all row subsets of size 2–3; require exactly one subset matches all column targets; otherwise perturb one digit in a non-solution row.

Działanie solvability: build the expression first (numbers and operators chosen to keep intermediates integer and non-negative), compute the target, then add distractor numbers that do not create a second trivial solution with fewer slots; the checker evaluates any filling, so additional solutions are allowed but the template length is fixed.

Słupek uniqueness: choose blank positions; enumerate all digit fillings (≤ 1,000 for three blanks); require one solution; prefer blanks that force carry reasoning (e.g. a blank in the tens column where a carry occurs).

Kwadrat uniqueness: with a palette of `n` candidates and `k` blanks, enumerate `n!/(n−k)!` assignments; require exactly one satisfying all totals.

Tak czy Nie balance: draw truth value first (50/50), then generate the statement to match; near-miss false items must differ from a true fact by a single plausible error.
