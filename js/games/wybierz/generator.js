import {int, pick} from '../../engine/rng.js';
import {subsets, total, product, equal} from '../../engine/math.js';
import {streak, relaxed} from '../shared.js';
import {gameRules} from '../../i18n/pl.js';
export const difficulty = l => streak({seconds: 20, rows: l <= 15 ? 3 : l <= 60 ? 4 : 5, cols: l <= 30 ? 2 : 3, operation: 'product', max: 9});
export function targets(board, selection, operation) { return board[0].map((_, c) => (operation === 'product' ? product : total)(selection.map(r => board[r][c]))); }
export function solutions(i) { return subsets(i.board.length).filter(s => equal(targets(i.board, s, i.operation), i.targets)); }
export function generate(level, params, rng) {
  const p = {...difficulty(level), ...params};
  for (let attempt = 0; ; attempt++) {
    if (attempt === 200) relaxed('wybierz', p);
    const board = Array.from({length: p.rows}, () => Array.from({length: p.cols}, () => int(rng, 1, p.operation === 'product' ? Math.min(9, p.max) : p.max)));
    const solution = pick(rng, subsets(p.rows, 2, Math.min(3, p.rows)));
    const i = {board, operation: p.operation, targets: targets(board, solution, p.operation), solution, itemSignature: `rows:${p.operation}`};
    if (solutions(i).length === 1) return i;
  }
}
export function check(i, a) { return {correct: Array.isArray(a) && a.length > 0 && new Set(a).size === a.length && a.every(r => Number.isInteger(r) && r >= 0 && r < i.board.length) && equal(targets(i.board, a, i.operation), i.targets)}; }
export const rulesCard = p => gameRules('wybierz', p);
