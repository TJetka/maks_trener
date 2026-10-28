import {int, pick, shuffle} from '../../engine/rng.js';
import {streak} from '../shared.js';
import {gameRules} from '../../i18n/pl.js';
export const difficulty = level => streak({points: 7, seconds: 15, cells: 20, min: 10, max: level <= 20 ? 99 : level <= 50 ? 199 : 299, divisors: [3, 6, 9], find: 2});
export function generate(level, params, rng) {
  const p = {...difficulty(level), ...params};
  const divisors = p.divisors.filter(d => d !== p.previousDivisor);
  const divisor = pick(rng, divisors.length ? divisors : p.divisors);
  const range = Array.from({length: p.max - p.min + 1}, (_, i) => p.min + i);
  const valid = shuffle(rng, range.filter(n => n % divisor === 0));
  const invalid = shuffle(rng, range.filter(n => n % divisor !== 0));
  if (valid.length < p.find || !invalid.length) throw new RangeError('Divisor range cannot form a board');
  const k = Math.min(valid.length, int(rng, p.find, Math.max(p.find, 4)), p.cells - 1);
  const near = invalid.find(n => divisor === 6 ? n % 3 === 0 || n % 2 === 0 : n % divisor === 1 || n % divisor === divisor - 1) ?? invalid[0];
  const cells = [...valid.slice(0, k), near];
  while (cells.length < p.cells) cells.push(invalid[(cells.length - k) % invalid.length]);
  const board = shuffle(rng, cells);
  return {board, divisor, find: p.find, solution: board.flatMap((n, i) => n % divisor === 0 ? [i] : []), itemSignature: `div${divisor}:${board.find(n => n % divisor === 0)}`};
}
export function check(instance, answer) { return {correct: Number.isInteger(answer) && answer >= 0 && answer < instance.board.length && instance.board[answer] % instance.divisor === 0}; }
export const rulesCard = p => gameRules('dzielnik', p);
