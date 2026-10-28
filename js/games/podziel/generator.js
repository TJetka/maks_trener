import {int, pick} from '../../engine/rng.js';
import {streak} from '../shared.js';
import {gameRules} from '../../i18n/pl.js';
export const difficulty = l => streak({seconds: 15, divisors: [2,3,4,5,6,7,8,9], remainder: l > 30, max: l <= 60 ? 100 : 999});
export function generate(level, params, rng) {
  const p = {...difficulty(level), ...params}, d = pick(rng, p.divisors);
  const q = int(rng, 1, p.remainder ? Math.max(1, Math.floor((p.max - d + 1) / d)) : Math.min(10, Math.floor(p.max / d)));
  const r = p.remainder ? int(rng, 0, d - 1) : 0;
  return {n: d * q + r, d, remainder: p.remainder, solution: {quotient: q, remainder: r}, itemSignature: p.remainder ? `remainder:${d}` : `div:${d}x${q}`};
}
export const check = (i, a) => ({correct: a?.quotient === i.solution.quotient && (!i.remainder || a.remainder === i.solution.remainder)});
export const rulesCard = p => gameRules('podziel', p);
