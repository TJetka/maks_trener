import { int, pick, shuffle } from "../../engine/rng.js?v=1.0.1";
import { evaluate } from "../../engine/math.js?v=1.0.1";
import { streak } from "../shared.js?v=1.0.1";
import { gameRules } from "../../i18n/pl.js?v=1.0.1";
export const difficulty = (l) =>
  streak({
    seconds: 12,
    chainLength: l <= 30 ? 2 : l <= 60 ? 3 : 4,
    operators: l <= 30 ? ["+", "-"] : ["+", "-", "*", "/"],
    options: 6,
    max: l <= 30 ? 100 : 500,
    timedReveal: false,
  });
export function generate(level, params, rng) {
  const p = { ...difficulty(level), ...params },
    start = int(rng, 2, Math.min(30, p.max));
  let value = start;
  const steps = [],
    intermediates = [start];
  for (let s = 0; s < p.chainLength; s++) {
    const op = pick(rng, p.operators);
    let n;
    if (op === "/")
      n = pick(
        rng,
        Array.from({ length: 10 }, (_, j) => j + 1).filter(
          (d) => value % d === 0,
        ),
      );
    else if (op === "-") n = int(rng, 0, Math.min(20, value));
    else if (op === "*")
      n = int(rng, 1, Math.min(10, Math.floor(p.max / Math.max(1, value))));
    else n = int(rng, 0, Math.min(20, p.max - value));
    value = evaluate([value, op, n]);
    steps.push({ op, n });
    intermediates.push(value);
  }
  const candidates = new Set([value]);
  for (const n of [
    value + 1,
    Math.max(0, value - 1),
    ...intermediates.slice(0, -1),
    value + 10,
  ])
    if (candidates.size < p.options) candidates.add(n);
  while (candidates.size < p.options)
    candidates.add(int(rng, 0, Math.max(p.max, p.options)));
  return {
    start,
    steps,
    intermediates,
    options: shuffle(rng, [...candidates]),
    timedReveal: p.timedReveal,
    solution: value,
    itemSignature: "chain:operations",
  };
}
export const check = (i, a) => ({ correct: a === i.solution });
export const rulesCard = (p) => gameRules("karuzela", p);
