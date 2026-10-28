# Verification

## Automated

- Native Node suite through `npm test`; static module checks through `npm run check`.
- Pytest entry points run those same checks without network calls.
- 300,000 deterministic generated puzzles: 100,000 original-ramp instances and
  100,000 per new tier across grades 3–5. Plus 1,000 mystery profiles per tier at
  initial and later difficulty boundaries.
- Brute-force uniqueness for Sumuj placements, Wybierz subsets, Słupek digits and
  Kwadrat palette assignments.
- Ladder 12…31 = 430, penalties, final zero clamp; Streak partial answers, three
  strikes, timeout and 90-level cap.
- Injected monotonic clock: five-minute drift, free-play visibility pause,
  uninterrupted sessions, 45-minute cutoff and correct earliest deadline after
  browser suspension.
- Import/export round trip, duplicate merging, invalid imports, storage failure,
  400-event retention with complete summary counts, deterministic drill sets.
- Tier preferences and legacy storage migration without rewriting old records;
  separate score identifiers, full runs with tier provenance, frozen session
  settings, rejection of a mismatched session tier, and manual profile defaults.
- Tiered drills and acceptance of equivalent operators (e.g. both + and × for
  `2 ? 2 = 4`). Expert sign puzzles require multiplication and cap targets at 1,000.

## Browser checks during implementation

Chrome on macOS, desktop and an actual 360 px wide iframe viewport:

- Home, navigation, game selection and rules dialog.
- Dzielnik partial selections, board completion, changing divisor and +7 score.
- Działanie token entry, valid alternative filling, +12 score and next level.
- Wybierz row selection, +8 score and next board.
- Podziel to keypad input, Plus i minus sign cycling, Tak czy Nie decisions,
  Słupek digit entry, Kwadrat palette assignment and Karuzela result selection;
  correct scoring and next-level transitions in each.
- Full 20-item multiplication/division drill through visible controls: 20/20,
  100% accuracy and slowest-facts summary.
- Session start, continuous timer, best-score recording, result and tie-break.
- Manual Sumuj variant, persistence across reload and replay.
- Phone board density: 6×6 board, cells approximately 48 px wide, page width and
  scroll width both 360 px. No horizontal page overflow.
- Browser console checked for errors.
- JSON export downloaded successfully. Browser import automation was blocked by
  the Chrome extension's file-upload permission; no extension permissions were
  changed. Import validation and merge behavior are covered by automated tests.

## Difficulty release 1.1.0 — live verification

Verified on GitHub Pages in Chrome on 28 October 2026:

- All ten game cards show Intermediate/Expert controls and matching descriptions;
  a changed choice survives reload. Rules and active-run badges match the tier.
- Expert Dzielnik uses 24 cells, three required selections and a 12-second clock.
  Intermediate Działanie has supplied operators and a six-minute clock; a correct
  visible-control answer awarded 12 points and advanced the level.
- A session with one game in each tier retained its original tiers after changing
  the training preference. Results display both tiers and the correct combined best.
- Existing five legacy runs remained under Wcześniejsze wyniki; new Expert and
  Intermediate statistics and card records were separated.
- Expert target drill generated a three-number expression and graded it correctly.
  Expert mystery division displayed quotient/remainder fields and awarded eight
  points for a correct answer.
- At a 360×800 viewport, page and scroll widths both measured 360 px, and all tier
  buttons were 44 px high. Desktop and phone screenshots inspected; viewport reset.
- No browser console errors. Default difficulty restored to Intermediate.

The environment blocked binding a local preview server for this release, so the
browser checks used the published site after automated tests passed.

## Release checks that require real devices

Not certified by the automated tests: iPad Safari, Android Chrome, Windows
Chrome/Edge, an uninterrupted real 45-minute tablet session, and a Lighthouse
accessibility score of at least 90. Check portrait/landscape rotation while playing,
OS backgrounding/foregrounding, physical keyboard navigation and browser storage
availability on those devices before contest use.

No service worker/offline installation is included (optional in the PRD).
