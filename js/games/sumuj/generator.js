import { int, pick } from "../../engine/rng.js?v=1.1.0";
import { total, product } from "../../engine/math.js?v=1.1.0";
import { ladder, positions, orientations, relaxed } from "../shared.js?v=1.1.0";
import { gameRules } from "../../i18n/pl.js?v=1.1.0";
export const SHAPES = {
  2: [
    [
      [0, 0],
      [0, 1],
    ],
    [
      [0, 0],
      [1, 0],
    ],
  ],
  3: [
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
  ],
  4: [
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ],
  ],
};
export const difficulty = (l) =>
  ladder({
    size: l <= 5 ? 5 : l <= 12 ? 6 : 7,
    min: 1,
    max: l <= 12 ? 15 : 30,
    shapeSize: l <= 5 ? 2 : l <= 12 ? 3 : 4,
    rotations: false,
    operation: "sum",
  });
export function placements(i) {
  const seen = new Set();
  return orientations(i.shape, i.rotations)
    .flatMap((shape, rotation) =>
      positions(i.size, shape).map((p) => ({ ...p, rotation })),
    )
    .filter((p) => {
      const key = [...p.cells].sort((a, b) => a - b).join(",");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((p) => ({
      ...p,
      value: (i.operation === "product" ? product : total)(
        p.cells.map((j) => i.board[j]),
      ),
    }));
}
export function generate(level, params, rng) {
  const p = { ...difficulty(level), ...params };
  for (let attempt = 0; ; attempt++) {
    if (attempt === 200) relaxed("sumuj", p);
    const instance = {
      size: p.size,
      board: Array.from({ length: p.size ** 2 }, () => int(rng, p.min, p.max)),
      shape: pick(rng, SHAPES[p.shapeSize]),
      rotations: p.rotations,
      operation: p.operation,
    };
    if (attempt === 200) {
      // Relax board variety, retaining the range and exactly one covered cell set.
      instance.board.fill(Math.max(p.min + 1, p.max));
      const chosen = positions(p.size, instance.shape)[0];
      chosen.cells.forEach((j) => {
        instance.board[j] = p.min;
      });
      return {
        ...instance,
        target: (p.operation === "product" ? product : total)(
          chosen.cells.map((j) => instance.board[j]),
        ),
        solution: { anchor: chosen.anchor, rotation: 0 },
        itemSignature: `grid:${p.operation}${p.shapeSize}`,
      };
    }
    const all = placements(instance),
      counts = new Map();
    for (const x of all) counts.set(x.value, (counts.get(x.value) ?? 0) + 1);
    const unique = all.filter((x) => counts.get(x.value) === 1);
    if (unique.length) {
      const chosen = pick(rng, unique);
      return {
        ...instance,
        target: chosen.value,
        solution: { anchor: chosen.anchor, rotation: chosen.rotation },
        itemSignature: `grid:${p.operation}${p.shapeSize}`,
      };
    }
  }
}
export function check(i, answer) {
  const a =
    typeof answer === "number" ? { anchor: answer, rotation: 0 } : answer;
  const shape = orientations(i.shape, i.rotations)[a?.rotation];
  if (!shape) return { correct: false };
  const p = positions(i.size, shape).find((p) => p.anchor === a.anchor);
  return {
    correct:
      !!p &&
      (i.operation === "product" ? product : total)(
        p.cells.map((j) => i.board[j]),
      ) === i.target,
  };
}
export const rulesCard = (p) => gameRules("sumuj", p);
