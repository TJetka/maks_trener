import { int, pick } from "../../engine/rng.js?v=1.1.0";
import { streak } from "../shared.js?v=1.1.0";
import { pl, tr, gameRules } from "../../i18n/pl.js?v=1.1.0";
export const difficulty = (l) =>
  streak({ seconds: 7, max: l <= 30 ? 10 : l <= 60 ? 100 : 300 });
export function generate(level, params, rng) {
  const p = { ...difficulty(level), ...params },
    truth = rng() < 0.5;
  const type =
    p.type ??
    (p.itemTypes
      ? pick(rng, p.itemTypes)
      : level <= 30
        ? pick(rng, ["mul", "inequality"])
        : level <= 60
          ? pick(rng, ["compare", "twoStep"])
          : pick(rng, ["div", "rem"]));
  let statement, actual, claimed, signature;
  if (type === "mul") {
    const a = int(rng, 2, Math.min(12, p.max)),
      b = int(rng, 2, Math.min(12, p.max));
    actual = a * b;
    claimed = actual + (truth ? 0 : pick(rng, [-10, 10]));
    statement = `${a} × ${b} = ${claimed}`;
    signature = `mul:${a}x${b}`;
  } else if (type === "div") {
    const d = pick(rng, [3, 6, 9]),
      base = int(rng, 1, Math.floor(p.max / d)) * d;
    const offset = pick(rng, [1, 2]),
      n = base + (truth ? 0 : base + offset <= p.max ? offset : -1);
    actual = n % d === 0;
    claimed = true;
    statement = tr(pl.statements.div, { n, d });
    signature = `div${d}:${n}`;
  } else if (type === "rem") {
    const d = int(rng, 2, 9),
      n = int(rng, 10, p.max),
      r = truth ? n % d : ((n % d) + 1) % d;
    actual = n % d;
    claimed = r;
    statement = tr(pl.statements.rem, { n, d, r });
    signature = `remainder:${d}`;
  } else if (type === "compare") {
    const a = int(rng, 2, 9),
      b = int(rng, 2, 9),
      c = int(rng, 2, 9),
      d = int(rng, 2, 9);
    const relation = truth === a * b < c * d ? "<" : "≥";
    actual = relation === "<" ? a * b < c * d : a * b >= c * d;
    claimed = true;
    statement = `${a} × ${b} ${relation} ${c} × ${d}`;
    signature = "compare:products";
  } else {
    const a = int(rng, 2, p.max),
      b = int(rng, 2, p.max),
      c = int(rng, 1, 9);
    if (type === "twoStep") {
      actual = a + b * c;
      claimed = actual + (truth ? 0 : 10);
      statement = `${a} + ${b} × ${c} = ${claimed}`;
    } else {
      const limit = a + b + (truth ? int(rng, 1, 3) : -int(rng, 0, 3));
      actual = a + b < limit;
      claimed = true;
      statement = `${a} + ${b} < ${limit}`;
    }
    signature = "compare:arithmetic";
  }
  return {
    statement,
    actual,
    claimed,
    solution: actual === claimed,
    itemSignature: signature,
  };
}
export const check = (i, a) => ({
  correct: typeof a === "boolean" && a === i.solution,
});
export const rulesCard = (p) => gameRules("taknie", p);
