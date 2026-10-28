import test from "node:test";
import assert from "node:assert/strict";
import { games, parameters } from "../js/games/registry.js";
import {
  DIFFICULTIES,
  presetId,
  selectedDifficulty,
  recordDifficulty,
} from "../js/engine/difficulty.js";
import { mulberry32 } from "../js/engine/rng.js";
import { placements } from "../js/games/sumuj/generator.js";
import { solutions as rowSolutions } from "../js/games/wybierz/generator.js";
import { solutions as columnSolutions } from "../js/games/slupek/generator.js";
import { solutions as squareSolutions } from "../js/games/kwadrat/generator.js";
import { Run } from "../js/engine/run.js";
import { Session } from "../js/engine/session.js";
import {
  freshStore,
  loadStore,
  parseImport,
  serializeStore,
  validateStore,
} from "../js/engine/store.js";
import {
  randomVariant,
  createVariant,
  validateParams,
  knobSchema,
} from "../js/engine/mystery.js";
import { summarizeRuns } from "../js/engine/stats.js";
import { Drill, drillItems, checkDrill } from "../js/engine/drill.js";

for (const difficulty of DIFFICULTIES) {
  for (const g of Object.values(games)) {
    test(`${g.id}/${difficulty}: 10,000 seeded puzzles across grades and levels`, () => {
      for (let seed = 0; seed < 10000; seed++) {
        const level = 1 + (seed % g.difficulty(1).levels);
        const settings = { difficulty, grade: 3 + (Math.floor(seed / 10) % 3) };
        const p = parameters(g.id, level, settings);
        const i = g.generate(level, p, mulberry32(seed));
        assert.equal(p.difficulty, difficulty);
        assert.equal(typeof i.itemSignature, "string");
        const answer = g.id === "dzielnik" ? i.solution[0] : i.solution;
        assert.ok(g.check(i, answer).correct, `seed ${seed}`);
        if (seed < 10)
          assert.deepEqual(i, g.generate(level, p, mulberry32(seed)));
        if (g.id === "dzielnik") {
          assert.equal(i.find, p.find);
          assert.ok(i.solution.length >= p.find && i.solution.length <= 4);
          assert.equal(i.board.length, p.cells);
          assert.ok(i.board.every((n) => n >= p.min && n <= p.max));
        }
        if (g.id === "sumuj")
          assert.equal(
            placements(i).filter((x) => x.value === i.target).length,
            1,
          );
        if (g.id === "wybierz") {
          assert.equal(rowSolutions(i).length, 1);
          assert.equal(i.solution.length, difficulty === "expert" ? 3 : 2);
          assert.ok(i.targets.every((n) => n <= 729));
        }
        if (g.id === "slupek") {
          assert.equal(i.blanks.length, p.blanks);
          if (seed < 300) assert.equal(columnSolutions(i).length, 1);
        }
        if (g.id === "kwadrat") {
          assert.equal(i.blanks.length, p.blanks);
          if (seed < 300) assert.equal(squareSolutions(i).length, 1);
        }
        if (g.id === "podziel") {
          assert.ok(i.n <= p.max);
          assert.equal(i.solution.quotient * i.d + i.solution.remainder, i.n);
          assert.ok(i.solution.remainder < i.d);
          assert.equal(i.solution.remainder > 0, difficulty === "expert");
          if (difficulty === "intermediate")
            assert.ok(i.solution.quotient <= 10);
        }
        if (g.id === "karuzela") {
          assert.ok(
            i.intermediates.every(
              (n) => Number.isInteger(n) && n >= 0 && n <= p.max,
            ),
          );
          assert.equal(new Set(i.options).size, p.options);
        }
        if (g.id === "dzialanie") assert.equal(i.numbers.length, p.numberSlots);
        if (g.id === "plusminus" && difficulty === "expert") {
          assert.ok(i.target <= 1000);
          assert.ok(i.solution.includes("*"));
        }
      }
    });
  }
}

test("tier structures remain distinct from the first level to the last", () => {
  for (const g of Object.values(games)) {
    for (const level of [1, g.difficulty(1).levels]) {
      const a = parameters(g.id, level, { difficulty: "intermediate" });
      const b = parameters(g.id, level, { difficulty: "expert" });
      assert.ok(a.seconds > b.seconds, g.id);
      const key = {
        dzielnik: "cells",
        dzialanie: "distractors",
        sumuj: "size",
        wybierz: "cols",
        podziel: "max",
        plusminus: "blanks",
        taknie: "max",
        slupek: "digits",
        kwadrat: "blanks",
        karuzela: "options",
      }[g.id];
      assert.ok(b[key] > a[key], `${g.id} ${key}`);
      assert.deepEqual(parameters(g.id, level), g.difficulty(level));
    }
  }
});

test("preferences persist while older scores stay in their original category", () => {
  const old = freshStore();
  delete old.settings.difficulty;
  delete old.settings.gameDifficulties;
  const legacy = new Run({
    gameId: "dzialanie",
    seed: 1,
    now: () => 0,
    wallNow: () => 100,
  });
  legacy.end("quit");
  const oldRecord = legacy.record();
  delete oldRecord.difficulty;
  old.runs.push(oldRecord);
  const loaded = loadStore({ getItem: () => JSON.stringify(old) });
  assert.equal(loaded.error, null);
  assert.equal(loaded.data.settings.difficulty, "intermediate");
  assert.equal(recordDifficulty(loaded.data.runs[0]), "legacy");
  assert.deepEqual(loaded.data.runs, old.runs);
  loaded.data.settings.gameDifficulties.karuzela = "expert";
  assert.equal(selectedDifficulty(loaded.data.settings, "karuzela"), "expert");
  assert.equal(
    selectedDifficulty(loaded.data.settings, "dzielnik"),
    "intermediate",
  );
  const imported = parseImport(serializeStore(loaded.data));
  assert.equal(selectedDifficulty(imported.settings, "karuzela"), "expert");
  imported.settings.difficulty = "impossible";
  assert.throws(() => validateStore(imported));
});

test("complete runs persist separate scores and tier provenance", () => {
  const store = freshStore();
  for (const difficulty of DIFFICULTIES) {
    let now = 0;
    const run = new Run({
      gameId: "dzialanie",
      seed: 7,
      settings: { difficulty },
      now: () => now,
      wallNow: () => 100 + now,
    });
    assert.equal(
      run.remaining(),
      difficulty === "intermediate" ? 360000 : 300000,
    );
    for (let n = 0; n < 20; n++) {
      now += 1000;
      assert.ok(run.answer(run.instance.solution).correct);
      if (!run.state.ended) run.next();
    }
    const record = run.record();
    assert.equal(record.variantId, presetId("dzialanie", difficulty));
    assert.equal(recordDifficulty(record), difficulty);
    assert.equal(record.provenance.settings.difficulty, difficulty);
    store.runs.push(record);
  }
  const restored = parseImport(serializeStore(store));
  for (const tier of DIFFICULTIES) {
    const summary = summarizeRuns(
      restored.runs.filter((r) => recordDifficulty(r) === tier),
    );
    assert.equal(summary.runs, 1);
    assert.equal(summary.accuracy, 1);
  }
});

test("session freezes each chosen tier and rejects a mismatched run", () => {
  const settings = {
    difficulty: "intermediate",
    gameDifficulties: { dzialanie: "expert" },
  };
  const difficulties = { dzialanie: "expert", podziel: "intermediate" };
  const session = new Session(["dzialanie", "podziel"], {
    settings,
    difficulties,
    now: () => 0,
    wallNow: () => 100,
  });
  settings.difficulty = "expert";
  settings.gameDifficulties.dzialanie = "intermediate";
  difficulties.dzialanie = "intermediate";
  assert.equal(session.data.settings.difficulty, "intermediate");
  assert.equal(session.data.settings.gameDifficulties.dzialanie, "expert");
  assert.equal(session.data.difficulties.dzialanie, "expert");
  const run = new Run({
    gameId: "dzialanie",
    seed: 1,
    mode: "session",
    sessionId: session.data.id,
    settings: { difficulty: "expert" },
    now: () => 0,
    wallNow: () => 100,
  });
  run.end("quit");
  session.addRun(run.record());
  assert.throws(() =>
    session.addRun({ ...run.record(), difficulty: "intermediate" }),
  );
  assert.equal(session.data.runsPerGame.dzialanie, 1);
  const store = freshStore();
  store.sessions.push(session.finish());
  assert.doesNotThrow(() => parseImport(serializeStore(store)));
});

test("mystery profiles retain the selected tier through every ramp boundary", () => {
  for (const difficulty of DIFFICULTIES) {
    for (let seed = 0; seed < 1000; seed++) {
      const v = randomVariant(seed, undefined, { difficulty });
      const g = games[v.gameId];
      assert.equal(v.settings.difficulty, difficulty);
      assert.doesNotThrow(() => validateParams(v.gameId, v.params, v.settings));
      for (const level of [1, 7, 13, 18, 20, 31, 61, 90].filter(
        (n) => n <= g.difficulty(1).levels,
      )) {
        const p = parameters(v.gameId, level, v.settings, v.params);
        const i = g.generate(level, p, mulberry32(seed + level));
        assert.ok(
          g.check(i, g.id === "dzielnik" ? i.solution[0] : i.solution).correct,
          `${g.id}/${difficulty}/${seed}/${level}`,
        );
      }
    }
  }
  for (const g of Object.values(games)) {
    const a = createVariant(g.id, {}, { difficulty: "intermediate" });
    const b = createVariant(g.id, {}, { difficulty: "expert" });
    assert.notEqual(a.id, b.id);
    for (const difficulty of DIFFICULTIES)
      for (const grade of [3, 4, 5]) {
        const settings = { difficulty, grade };
        const p = parameters(g.id, 1, settings);
        const overrides = Object.fromEntries(
          Object.keys(knobSchema(g.id)).map((k) => [k, p[k]]),
        );
        assert.doesNotThrow(
          () => validateParams(g.id, overrides, settings),
          `${g.id}/${difficulty}/${grade}`,
        );
      }
  }
});

test("drills scale fact ranges, divisibility and expression length; accept equivalent answers", () => {
  for (const difficulty of DIFFICULTIES)
    for (const type of ["facts", "divisibility", "target"]) {
      const items = drillItems(type, [], 123, 10, null, difficulty);
      assert.equal(items.length, 20);
      assert.deepEqual(items, drillItems(type, [], 123, 10, null, difficulty));
      assert.ok(items.every((i) => checkDrill(i, i.solution)));
      if (type === "facts" && difficulty === "expert")
        for (const i of items)
          assert.ok(
            i.itemSignature
              .match(/:(\d+)x(\d+)/)
              .slice(1)
              .every((n) => Number(n) >= 6),
          );
      if (type === "divisibility")
        assert.ok(
          items.every((i) => i.n <= (difficulty === "expert" ? 500 : 100)),
        );
      if (type === "target" && difficulty === "expert")
        assert.ok(items.every((i) => i.prompt.includes(" + ")));
      const drill = new Drill(type, [], 123, {
        difficulty,
        now: () => 0,
        wallNow: () => 100,
      });
      for (const item of drill.items) drill.answer(item.solution);
      const record = drill.record();
      assert.equal(record.score, 20);
      assert.equal(recordDifficulty(record), difficulty);
      assert.equal(record.variantId, `drill:${type}:${difficulty}`);
    }
  const ambiguous = Array.from({ length: 100 }, (_, seed) =>
    drillItems("target", [], seed, 2),
  )
    .flat()
    .find((i) => i.accepted?.length > 1);
  assert.ok(ambiguous);
  assert.ok(checkDrill(ambiguous, "+"));
  assert.ok(checkDrill(ambiguous, "*"));
  assert.equal(checkDrill(ambiguous, "-"), false);
});
