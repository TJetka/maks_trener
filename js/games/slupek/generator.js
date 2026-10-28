import {int, pick, shuffle} from '../../engine/rng.js';
import {ladder} from '../shared.js';
import {gameRules} from '../../i18n/pl.js';
export const difficulty = l => ladder({digits: l <= 6 ? 2 : 3, blanks: l <= 6 ? 1 : l <= 12 ? 2 : 3, operation: l <= 6 ? 'add' : l >= 18 ? 'multiply' : 'mixed', resultOnly: false});
export function fill(i, answer) {
  if (!Array.isArray(answer) || answer.length !== i.blanks.length || answer.some(n => !Number.isInteger(n) || n < 0 || n > 9)) return null;
  const rows = i.rows.map(r => [...r]);
  i.blanks.forEach(([r, c], j) => { rows[r][c] = String(answer[j]); });
  if (rows.some(row => row.length > 1 && row[0] === '0')) return null;
  return rows.map(r => Number(r.join('')));
}
export function check(i, a) {
  const v = fill(i, a);
  return {correct: !!v && (i.operation === 'add' ? v[0] + v[1] : i.operation === 'subtract' ? v[0] - v[1] : v[0] * v[1]) === v[2]};
}
export function solutions(i) {
  const found = [];
  for (let n = 0; n < 10 ** i.blanks.length; n++) {
    const answer = String(n).padStart(i.blanks.length, '0').split('').map(Number);
    if (check(i, answer).correct) found.push(answer);
  }
  return found;
}
export function generate(level, params, rng) {
  const p = {...difficulty(level), ...params}, operation = p.operation === 'mixed' ? pick(rng, ['add', 'subtract']) : p.operation;
  const min = 10 ** (p.digits - 1), max = 10 ** p.digits - 1;
  let a = int(rng, min, max), b = int(rng, min, max);
  if (operation === 'multiply') b = int(rng, 2, 9);
  else if (operation === 'subtract') {
    if (a < b) [a,b] = [b,a];
    if (level >= 7 && a >= b + 10) { a = a - a % 10; b = b - b % 10 + int(rng, 1, 9); }
  } else if (level >= 7) { a = a - a % 10 + int(rng, 5, 9); b = b - b % 10 + int(rng, 5, 9); }
  const result = operation === 'add' ? a + b : operation === 'subtract' ? a - b : a * b;
  const original = [a,b,result].map(n => String(n).split(''));
  const eligible = original.flatMap((row, r) => (!p.resultOnly || r === 2) && row.length >= p.blanks ? [r] : []);
  const row = pick(rng, eligible.length ? eligible : [2]);
  const blanks = shuffle(rng, original[row].map((_, c) => [row,c])).slice(0, p.blanks).sort((a,b) => a[1] - b[1]);
  const solution = blanks.map(([r,c]) => Number(original[r][c]));
  const rows = original.map(r => [...r]); blanks.forEach(([r,c]) => { rows[r][c] = null; });
  return {rows, operation, blanks, solution, itemSignature: `col:${operation}${operation === 'multiply' ? '' : '-carry'}`};
}
export const rulesCard = p => gameRules('slupek', p);
