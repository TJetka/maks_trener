import { LADDER, STREAK } from "../engine/scoring.js?v=1.0.1";
export const ladder = (overrides) => ({ ...LADDER, ...overrides });
export const streak = (overrides) => ({ ...STREAK, ...overrides });
export const validNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);
export function relaxed(id, params) {
  console.warn(
    `Generator ${id}: relaxed constraints after 200 attempts`,
    params,
  );
}
export function positions(size, shape) {
  const result = [];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      if (
        shape.every(
          ([dy, dx]) =>
            y + dy >= 0 && y + dy < size && x + dx >= 0 && x + dx < size,
        )
      ) {
        result.push({
          anchor: y * size + x,
          cells: shape.map(([dy, dx]) => (y + dy) * size + x + dx),
        });
      }
    }
  return result;
}
export function orientations(shape, rotations) {
  const result = [shape];
  if (rotations)
    for (let i = 1; i < 4; i++)
      result.push(result[i - 1].map(([y, x]) => [x, -y]));
  return result.filter(
    (s, i) =>
      result.findIndex(
        (t) => JSON.stringify([...t].sort()) === JSON.stringify([...s].sort()),
      ) === i,
  );
}
