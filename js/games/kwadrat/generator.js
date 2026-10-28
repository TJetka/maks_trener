import { int, shuffle } from "../../engine/rng.js?v=1.1.0";
import { total, equal, usesPalette } from "../../engine/math.js?v=1.1.0";
import { ladder } from "../shared.js?v=1.1.0";
import { gameRules } from "../../i18n/pl.js?v=1.1.0";
export const difficulty = (l) =>
  ladder({
    size: l >= 17 ? 4 : 3,
    blanks: l <= 5 ? 1 : l <= 12 ? 2 : l <= 16 ? 3 : 4,
    max: l <= 5 ? 9 : l <= 12 ? 20 : 30,
    totals: "both",
    diagonals: false,
  });
export function check(i, answer) {
  if (
    !Array.isArray(answer) ||
    answer.length !== i.blanks.length ||
    !usesPalette(answer, i.palette)
  )
    return { correct: false };
  const board = [...i.board];
  i.blanks.forEach((j, k) => {
    board[j] = answer[k];
  });
  const rows = Array.from({ length: i.size }, (_, r) =>
    total(board.slice(r * i.size, (r + 1) * i.size)),
  );
  const cols = Array.from({ length: i.size }, (_, c) =>
    total(board.filter((_, j) => j % i.size === c)),
  );
  const diagonals = [
    total(board.filter((_, j) => Math.floor(j / i.size) === j % i.size)),
    total(
      board.filter(
        (_, j) => Math.floor(j / i.size) + (j % i.size) === i.size - 1,
      ),
    ),
  ];
  return {
    correct:
      (i.totals === "columns" || equal(rows, i.rowTotals)) &&
      (i.totals === "rows" || equal(cols, i.colTotals)) &&
      (!i.diagonals || equal(diagonals, i.diagonalTotals)),
  };
}
export function solutions(i) {
  const found = new Map();
  function visit(answer, rest) {
    if (answer.length === i.blanks.length) {
      if (check(i, answer).correct) found.set(answer.join(","), answer);
      return;
    }
    for (const n of new Set(rest)) {
      const next = [...rest];
      next.splice(next.indexOf(n), 1);
      visit([...answer, n], next);
    }
  }
  visit([], i.palette);
  return [...found.values()];
}
export function generate(level, params, rng) {
  const p = { ...difficulty(level), ...params };
  const board = Array.from({ length: p.size ** 2 }, () => int(rng, 1, p.max));
  const indices = shuffle(
    rng,
    Array.from({ length: p.size }, (_, i) => i),
  ).slice(0, Math.min(p.size, p.blanks));
  const blanks = indices
    .map((j) =>
      p.totals === "columns"
        ? int(rng, 0, p.size - 1) * p.size + j
        : j * p.size + int(rng, 0, p.size - 1),
    )
    .sort((a, b) => a - b);
  const solution = blanks.map((j) => board[j]);
  const rowTotals = Array.from({ length: p.size }, (_, r) =>
    total(board.slice(r * p.size, (r + 1) * p.size)),
  );
  const colTotals = Array.from({ length: p.size }, (_, c) =>
    total(board.filter((_, j) => j % p.size === c)),
  );
  const diagonalTotals = [
    total(board.filter((_, j) => Math.floor(j / p.size) === j % p.size)),
    total(
      board.filter(
        (_, j) => Math.floor(j / p.size) + (j % p.size) === p.size - 1,
      ),
    ),
  ];
  blanks.forEach((j) => {
    board[j] = null;
  });
  return {
    board,
    size: p.size,
    blanks,
    solution,
    rowTotals,
    colTotals,
    diagonalTotals,
    totals: p.totals,
    diagonals: p.diagonals,
    palette: shuffle(rng, [
      ...solution,
      int(rng, 1, p.max),
      int(rng, 1, p.max),
    ]),
    itemSignature: "grid:missing-sum",
  };
}
export const rulesCard = (p) => gameRules("kwadrat", p);
