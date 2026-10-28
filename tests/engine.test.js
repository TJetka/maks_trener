import test from "node:test";
import assert from "node:assert/strict";
import { Run } from "../js/engine/run.js";
import { Session, SESSION_MS, sessionSummary } from "../js/engine/session.js";
import {
  freshStore,
  mergeStores,
  parseImport,
  serializeStore,
  loadStore,
  saveStore,
  validateStore,
} from "../js/engine/store.js";
import { summarizeRuns, levelHistogram } from "../js/engine/stats.js";
import { randomVariant, validateParams } from "../js/engine/mystery.js";
import { games, parameters } from "../js/games/registry.js";
import { mulberry32 } from "../js/engine/rng.js";
import { drillItems, checkDrill, Drill } from "../js/engine/drill.js";

function fixture(id = "dzialanie", overrides = {}) {
  let now = 0;
  const run = new Run({
    gameId: id,
    seed: 123,
    now: () => now,
    wallNow: () => 1000000 + now,
    ...overrides,
  });
  return {
    run,
    advance: (ms) => {
      now += ms;
    },
  };
}
test("full ladder smoke: generate → answer → score → persist → statistics", () => {
  const { run, advance } = fixture();
  run.interact();
  for (let l = 1; l <= 20; l++) {
    advance(1000);
    const result = run.answer(run.instance.solution);
    assert.equal(result.correct, true);
    if (!run.state.ended) run.next();
  }
  const record = run.record();
  assert.equal(record.score, 430);
  assert.equal(record.events.length, 20);
  assert.equal(record.firstCorrectMs, 1000);
  const store = freshStore();
  store.runs.push(record);
  const restored = parseImport(serializeStore(store));
  assert.deepEqual(restored, store);
  assert.equal(mergeStores(store, restored).runs.length, 1);
  const stats = summarizeRuns(restored.runs);
  assert.equal(stats.accuracy, 1);
  assert.equal(stats.medianMs, 1000);
  assert.equal(stats.best, 430);
});
test("150 ms duplicate guard, invalid cells, strikes and per-board timeout", () => {
  const { run, advance } = fixture("dzielnik");
  const first = run.instance.solution[0];
  assert.equal(run.answer(first).complete, false);
  assert.equal(run.answer(first).ignored, true);
  advance(151);
  assert.equal(run.answer(first).ignored, true);
  assert.equal(run.answer(run.instance.solution[1]).complete, true);
  run.next();
  advance(15001);
  run.tick();
  assert.equal(run.state.endReason, "timeout");
  assert.equal(run.record().score, 7);
});
test("free play pauses, session never pauses and cuts a live run at 45 minutes", () => {
  const f = fixture();
  f.run.interact();
  f.advance(1000);
  f.run.visibility(true);
  f.advance(900000);
  assert.equal(f.run.remaining(), 299000);
  f.run.visibility(false);
  let now = 0;
  const s = new Session(["dzielnik", "dzialanie"], {
    now: () => now,
    wallNow: () => now + 1000,
  });
  now = SESSION_MS - 1000;
  const run = new Run({
    gameId: "dzialanie",
    mode: "session",
    seed: 9,
    sessionId: s.data.id,
    now: () => now,
    wallNow: () => now + 1000,
    sessionRemaining: () => s.durationMs - s.clock.elapsed(),
  });
  run.answer(run.instance.solution);
  run.next();
  run.visibility(true);
  now = SESSION_MS;
  run.tick();
  assert.equal(run.state.endReason, "session");
  assert.equal(run.visibilityEvents.length, 1);
  s.addRun(run.record());
  const record = s.finish();
  assert.equal(sessionSummary(record).sum, 12);
  assert.equal(record.runsPerGame.dzialanie, 1);
  assert.equal(s.remaining(), 0);
});
test("a suspended session tab records the earliest deadline without inflating time played", () => {
  let now = 0;
  const session = new Session(["dzialanie", "dzielnik"], {
    now: () => now,
    wallNow: () => 1000 + now,
  });
  const run = new Run({
    gameId: "dzialanie",
    mode: "session",
    seed: 10,
    sessionId: session.data.id,
    now: () => now,
    wallNow: () => 1000 + now,
    sessionRemaining: () => session.durationMs - session.clock.elapsed(),
  });
  run.interact();
  now = SESSION_MS + 5000;
  run.tick();
  assert.equal(run.state.endReason, "timeout");
  assert.equal(run.record().durationMs, 300000);
  session.addRun(run.record());
  assert.equal(session.finish().windowUsedMs, 300000);
});
test("wrong ladder regenerates same level; streak wrong retains timer", () => {
  const a = fixture();
  a.run.interact();
  a.advance(1000);
  const old = a.run.instance;
  assert.equal(a.run.answer({}).next, true);
  a.run.next();
  assert.equal(a.run.state.level, 1);
  assert.notDeepEqual(a.run.instance, old);
  const b = fixture("podziel");
  b.run.interact();
  b.advance(5000);
  assert.equal(b.run.answer({ quotient: -1 }).next, false);
  assert.equal(b.run.remaining(), 10000);
});
test("events stay bounded and summaries retain all 450 attempts", () => {
  const { run, advance } = fixture();
  run.interact();
  for (let n = 0; n < 450; n++) {
    advance(160);
    run.answer({});
    run.next();
  }
  run.end("quit");
  const r = run.record();
  assert.equal(r.events.length, 400);
  assert.equal(r.summary.count, 450);
  assert.equal(summarizeRuns([r]).count, 450);
});
test("storage failure and corrupt data never silently overwrite", () => {
  assert.equal(loadStore({ getItem: () => "{bad" }).error, "corrupt");
  assert.equal(
    saveStore(
      {
        setItem: () => {
          throw new Error("quota");
        },
      },
      freshStore(),
    ),
    false,
  );
  assert.throws(() => parseImport('{"version":1,"__proto__":{}}'));
  assert.throws(() =>
    parseImport(JSON.stringify({ ...freshStore(), runs: [{ id: "bad" }] })),
  );
});
test("1,000 mystery profiles validate, generate and explain their scoring", () => {
  for (let seed = 0; seed < 1000; seed++) {
    const v = randomVariant(seed);
    const g = games[v.gameId],
      p = parameters(v.gameId, 1, {}, v.params),
      i = g.generate(1, p, mulberry32(seed));
    assert.ok(
      g.check(i, v.gameId === "dzielnik" ? i.solution[0] : i.solution).correct,
      `${v.gameId}:${seed}`,
    );
    assert.ok(v.rulesText.includes(String(p.seconds)));
    assert.equal(v.id, randomVariant(seed).id);
  }
  assert.throws(() => validateParams("sumuj", { size: 10000 }));
  assert.throws(() =>
    validateParams("dzielnik", { min: 10, max: 11, find: 3 }),
  );
});
test("mystery profiles remain playable across every difficulty boundary", () => {
  for (let seed = 0; seed < 1000; seed++) {
    const v = randomVariant(seed),
      g = games[v.gameId];
    for (const level of [7, 13, 18, 20, 31, 61, 90].filter(
      (l) => l <= g.difficulty(1).levels,
    )) {
      const i = g.generate(
        level,
        parameters(v.gameId, level, {}, v.params),
        mulberry32(seed + level),
      );
      assert.ok(
        g.check(i, v.gameId === "dzielnik" ? i.solution[0] : i.solution)
          .correct,
        `${v.gameId}:${seed}:${level}`,
      );
      if (v.gameId === "dzialanie")
        assert.equal(i.operators.length, i.numbers.length - 1);
    }
  }
});
test("first-answer latency includes thinking before the countdown starts", () => {
  const { run, advance } = fixture("dzielnik");
  advance(4200);
  assert.equal(run.remaining(), 15000);
  run.answer(run.instance.solution[0]);
  assert.equal(run.firstCorrectMs, 4200);
  assert.equal(run.events[0].responseMs, 4200);
});
test("tie-break timestamps refer to the final score, including penalties", () => {
  const { run, advance } = fixture();
  run.interact();
  advance(1000);
  run.answer(run.instance.solution);
  run.next();
  advance(1000);
  run.answer(run.instance.solution);
  run.next();
  advance(1000);
  run.answer({});
  run.end("quit");
  assert.equal(run.record().score, 22);
  assert.equal(run.record().bestAt, 1003000);
});
test("level histograms count all runs at each completion level", () => {
  assert.deepEqual(
    levelHistogram([
      { levelsReached: 2 },
      { levelsReached: 1 },
      { levelsReached: 2 },
    ]),
    [
      { level: 1, count: 1 },
      { level: 2, count: 2 },
    ],
  );
});
test("small-screen density is reduced before generation, preserving uniqueness", () => {
  const { run } = fixture("sumuj", {
    settings: { maxGridSize: 6 },
    overrides: { size: 8 },
  });
  assert.equal(run.instance.size, 6);
  assert.equal(run.instance.board.length, 36);
  assert.ok(run.game.check(run.instance, run.instance.solution).correct);
});
test("20-item drills have correct answers, deterministic sampling and recordable summaries", () => {
  for (const type of ["facts", "divisibility", "target"]) {
    const items = drillItems(type, [], 123);
    assert.equal(items.length, 20);
    assert.deepEqual(items, drillItems(type, [], 123));
    assert.ok(items.every((i) => checkDrill(i, i.solution)));
    let now = 0;
    const drill = new Drill(type, [], 123, {
      now: () => now,
      wallNow: () => 1,
    });
    for (const item of drill.items) {
      now += 1000;
      drill.answer(item.solution);
      drill.next();
    }
    const store = freshStore();
    store.runs.push(drill.record());
    assert.doesNotThrow(() => validateStore(store));
    assert.equal(store.runs[0].score, 20);
  }
});
