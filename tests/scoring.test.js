import test from "node:test";
import assert from "node:assert/strict";
import {
  LADDER,
  STREAK,
  createScore,
  scoreAnswer,
  finish,
  levelPoints,
} from "../js/engine/scoring.js";
import { Clock } from "../js/engine/clock.js";
test("Ladder exactly 12…31 = 430 and clamps only at finish", () => {
  let s = createScore(LADDER);
  for (let i = 1; i <= 20; i++) {
    assert.equal(levelPoints(s), 11 + i);
    s = scoreAnswer(s, true);
  }
  assert.equal(s.score, 430);
  assert.equal(s.endReason, "levels");
  assert.equal(s.cleared, 20);
  const wrong = scoreAnswer(createScore(LADDER), false);
  assert.equal(wrong.score, -3);
  assert.equal(wrong.level, 1);
  assert.equal(finish(wrong, "timeout").score, 0);
  assert.deepEqual(scoreAnswer(s, false), s);
});
test("Streak: partial answers, strikes, cap and no deductions", () => {
  let s = createScore({ ...STREAK, points: 7 });
  s = scoreAnswer(s, true, false);
  assert.equal(s.score, 0);
  s = scoreAnswer(s, true);
  assert.equal(s.score, 7);
  for (let i = 0; i < 3; i++) s = scoreAnswer(s, false);
  assert.equal(s.score, 7);
  assert.equal(s.endReason, "strikes");
  s = createScore(STREAK);
  for (let i = 0; i < 90; i++) s = scoreAnswer(s, true);
  assert.equal(s.score, 720);
  assert.equal(s.endReason, "cap");
});
test("clock has zero drift over 300 seconds and excludes explicit pauses", () => {
  let now = 0;
  const c = new Clock(() => now);
  assert.equal(c.elapsed(), 0);
  c.start();
  for (let i = 1; i <= 18000; i++) {
    now = (i * 300000) / 18000;
    assert.equal(c.elapsed(), now);
  }
  c.pause();
  now += 10000;
  assert.equal(c.elapsed(), 300000);
  c.resume();
  now += 50;
  assert.equal(c.elapsed(), 300050);
});
