import { mulberry32, int, pick } from "./rng.js?v=1.0.1";
import { Clock } from "./clock.js?v=1.0.1";
import { facts, emptySummary, addEvent } from "./stats.js?v=1.0.1";
import { APP_VERSION } from "./run.js?v=1.0.1";
import { evaluate } from "./math.js?v=1.0.1";
import { recordDifficulty } from "./difficulty.js";
const DIVISORS = [2, 3, 4, 5, 6, 9, 10];
export function weightedPick(rng, items, weight) {
  const weights = items.map(weight);
  let remaining = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    remaining -= weights[i];
    if (remaining <= 0) return items[i];
  }
  return items.at(-1);
}
export function drillItems(
  type,
  runs,
  seed,
  max = 10,
  focus = null,
  difficulty = "legacy",
) {
  const rng = mulberry32(seed),
    weak = facts(runs.filter((r) => recordDifficulty(r) === difficulty)),
    lookup = new Map(weak.map((f) => [f.signature, f]));
  const weight = (signature) => {
    const f = lookup.get(signature);
    return (
      (1 + (f?.errors ?? 0)) *
      Math.max(1, (f?.medianMs ?? 2000) / 2000) *
      (signature === focus ? 8 : 1)
    );
  };
  return Array.from({ length: 20 }, () => {
    if (type === "facts") {
      const min = difficulty === "expert" ? Math.min(6, max) : 1;
      const span = max - min + 1;
      const pool = Array.from({ length: span * span }, (_, j) => [
        Math.floor(j / span) + min,
        (j % span) + min,
      ]);
      const [a, b] = weightedPick(
        rng,
        pool,
        ([a, b]) => weight(`mul:${a}x${b}`) + weight(`div:${a}x${b}`),
      );
      const division = rng() < 0.4;
      return {
        kind: "number",
        prompt: division ? `${a * b} : ${a} = ?` : `${a} × ${b} = ?`,
        solution: division ? b : a * b,
        itemSignature: `${division ? "div" : "mul"}:${a}x${b}`,
      };
    }
    if (type === "divisibility") {
      const divisors = difficulty === "intermediate" ? [2, 3, 5, 10] : DIVISORS;
      const limit =
        difficulty === "expert"
          ? 500
          : difficulty === "intermediate"
            ? 100
            : 200;
      const d = weightedPick(
        rng,
        divisors,
        (d) =>
          1 +
          weak
            .filter((f) => f.signature.startsWith(`div${d}:`))
            .reduce((n, f) => n + f.errors / f.count, 0),
      );
      const n =
        int(rng, 2, Math.floor((limit - 1) / d)) * d + (rng() < 0.2 ? 1 : 0);
      return {
        kind: "divisors",
        n,
        divisors,
        solution: divisors.filter((d) => n % d === 0),
        itemSignature: `div${d}:${n}`,
      };
    }
    let a = int(rng, 2, max),
      b = int(rng, 2, max);
    const operator = pick(rng, ["+", "-", "*"]);
    if (operator === "-" && a < b) [a, b] = [b, a];
    const c = difficulty === "expert" ? int(rng, 2, max) : 0;
    const suffix = c ? ` + ${c}` : "";
    const target = evaluate([a, operator, b]) + c;
    if (rng() < 0.5)
      return {
        kind: "operator",
        prompt: `${a} ? ${b}${suffix} = ${target}`,
        solution: operator,
        accepted: ["+", "-", "*"].filter(
          (op) =>
            evaluate([a, op, b]) !== null &&
            evaluate([a, op, b]) + c === target,
        ),
        options: ["+", "-", "*"],
        itemSignature: "target:operator",
      };
    return {
      kind: "number",
      prompt: `${a} × ?${suffix} = ${a * b + c}`,
      solution: b,
      itemSignature: `mul:${a}x${b}`,
    };
  });
}
export function checkDrill(item, answer) {
  if (item.kind === "divisors")
    return (
      Array.isArray(answer) &&
      answer.length === item.solution.length &&
      new Set(answer).size === answer.length &&
      answer.every((d) => item.solution.includes(d))
    );
  return item.accepted
    ? item.accepted.includes(answer)
    : answer === item.solution;
}
export class Drill {
  constructor(
    type,
    runs,
    seed,
    {
      now,
      wallNow = () => Date.now(),
      max = 10,
      focus = null,
      difficulty = "legacy",
    } = {},
  ) {
    Object.assign(this, { type, seed, wallNow, difficulty });
    this.items = drillItems(type, runs, seed, max, focus, difficulty);
    this.index = 0;
    this.events = [];
    this.summary = emptySummary();
    this.clock = new Clock(now);
    this.startedAt = wallNow();
    this.clock.start();
    this.last = 0;
  }
  answer(answer) {
    if (this.index >= 20) return null;
    const item = this.items[this.index],
      t = this.clock.elapsed(),
      correct = checkDrill(item, answer);
    const event = {
      t,
      level: this.index + 1,
      correct,
      responseMs: t - this.last,
      itemSignature: item.itemSignature,
      answer,
    };
    this.events.push(event);
    addEvent(this.summary, event);
    this.index++;
    this.last = t;
    return { correct, item, done: this.index === 20 };
  }
  next() {
    this.last = this.clock.elapsed();
  }
  record() {
    return {
      id: `d_${this.startedAt}_${this.seed}`,
      gameId: "drill",
      variantId: `drill:${this.type}${this.difficulty === "legacy" ? "" : `:${this.difficulty}`}`,
      difficulty: this.difficulty,
      mode: "drill",
      sessionId: null,
      seed: this.seed,
      startedAt: this.startedAt,
      durationMs: this.clock.elapsed(),
      score: this.summary.correct,
      levelsReached: this.index,
      strikes: 0,
      endReason: "levels",
      events: this.events,
      summary: this.summary,
      provenance: { appVersion: APP_VERSION, seed: this.seed },
    };
  }
}
