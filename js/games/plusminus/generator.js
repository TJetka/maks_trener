import { int, pick } from "../../engine/rng.js?v=1.0.1";
import {
  assignments,
  evaluate,
  expressionTokens,
} from "../../engine/math.js?v=1.0.1";
import { ladder, relaxed } from "../shared.js?v=1.0.1";
import { gameRules } from "../../i18n/pl.js?v=1.0.1";
export const difficulty = (l) =>
  ladder({
    blanks: l <= 7 ? 2 : l <= 14 ? 3 : 4,
    max: l <= 7 ? 20 : l <= 14 ? 30 : 50,
    operators: ["+", "-"],
  });
export function generate(level, params, rng) {
  const p = { ...difficulty(level), ...params };
  for (let attempt = 0; ; attempt++) {
    if (attempt === 200) relaxed("plusminus", p);
    const numbers = Array.from({ length: p.blanks + 1 }, () =>
      int(rng, 1, p.max),
    );
    if (attempt === 200) {
      // Distinct powers remove repeated subset sums; a large first term permits subtraction.
      numbers[0] = 2 ** (p.blanks + 1);
      for (let j = 1; j < numbers.length; j++) numbers[j] = 2 ** j;
    }
    const candidates = assignments(p.operators, p.blanks)
      .map((ops) => ({ ops, value: evaluate(expressionTokens(numbers, ops)) }))
      .filter((x) => x.value !== null);
    const valid = candidates.filter(
      (x) =>
        x.value <= (p.maxTarget ?? Infinity) &&
        (!p.requireMultiply ||
          !p.operators.includes("*") ||
          x.ops.includes("*")) &&
        candidates.filter((y) => y.value === x.value).length <= 2,
    );
    if (valid.length) {
      const chosen = pick(rng, valid);
      return {
        numbers,
        target: chosen.value,
        allowed: p.operators,
        solution: chosen.ops,
        itemSignature: "signs:plusminus",
      };
    }
    if (attempt === 200) throw new RangeError("No valid sign configuration");
  }
}
export const check = (i, a) => ({
  correct:
    Array.isArray(a) &&
    a.length === i.numbers.length - 1 &&
    a.every((o) => i.allowed.includes(o)) &&
    evaluate(expressionTokens(i.numbers, a)) === i.target,
});
export const rulesCard = (p) => gameRules("plusminus", p);
