import { int, pick } from "../../engine/rng.js?v=1.0.1";
import { streak } from "../shared.js?v=1.0.1";
import { gameRules } from "../../i18n/pl.js?v=1.0.1";
export const difficulty = (l) =>
  streak({
    seconds: 15,
    divisors: [2, 3, 4, 5, 6, 7, 8, 9],
    remainder: l > 30,
    max: l <= 60 ? 100 : 999,
  });
export function generate(level, params, rng) {
  const p = { ...difficulty(level), ...params },
    d = pick(rng, p.divisors);
  const maxQuotient = p.remainder
    ? Math.max(1, Math.floor((p.max - d + 1) / d))
    : Math.min(10, Math.floor(p.max / d));
  const q = int(rng, Math.min(p.minQuotient ?? 1, maxQuotient), maxQuotient);
  const r = p.remainder ? int(rng, p.requireRemainder ? 1 : 0, d - 1) : 0;
  return {
    n: d * q + r,
    d,
    remainder: p.remainder,
    solution: { quotient: q, remainder: r },
    itemSignature: p.remainder ? `remainder:${d}` : `div:${d}x${q}`,
  };
}
export const check = (i, a) => ({
  correct:
    a?.quotient === i.solution.quotient &&
    (!i.remainder || a.remainder === i.solution.remainder),
});
export const rulesCard = (p) => gameRules("podziel", p);
