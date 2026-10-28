import {int, pick} from '../../engine/rng.js';
import {assignments, evaluate, expressionTokens} from '../../engine/math.js';
import {ladder, relaxed} from '../shared.js';
import {gameRules} from '../../i18n/pl.js';
export const difficulty = l => ladder({blanks: l <= 7 ? 2 : l <= 14 ? 3 : 4, max: l <= 7 ? 20 : l <= 14 ? 30 : 50, operators: ['+', '-']});
export function generate(level, params, rng) {
  const p = {...difficulty(level), ...params};
  for (let attempt = 0; ; attempt++) {
    if (attempt === 200) relaxed('plusminus', p);
    const numbers = Array.from({length: p.blanks + 1}, () => int(rng, 1, p.max));
    const candidates = assignments(p.operators, p.blanks).map(ops => ({ops, value: evaluate(expressionTokens(numbers, ops))})).filter(x => x.value !== null);
    const valid = candidates.filter(x => candidates.filter(y => y.value === x.value).length <= 2);
    if (valid.length) { const chosen = pick(rng, valid); return {numbers, target: chosen.value, allowed: p.operators, solution: chosen.ops, itemSignature: 'signs:plusminus'}; }
  }
}
export const check = (i, a) => ({correct: Array.isArray(a) && a.length === i.numbers.length - 1 && a.every(o => i.allowed.includes(o)) && evaluate(expressionTokens(i.numbers, a)) === i.target});
export const rulesCard = p => gameRules('plusminus', p);
