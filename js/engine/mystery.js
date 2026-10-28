import { games, parameters } from "../games/registry.js?v=1.0.1";
import { mulberry32, pick, hash } from "./rng.js?v=1.0.1";
const number = (min, max) => ({ type: "number", min, max });
const choice = (options) => ({ type: "choice", options });
const toggle = { type: "boolean" };
export const KNOBS = {
  dzielnik: {
    cells: number(12, 30),
    min: number(1, 500),
    max: number(10, 999),
    find: number(2, 3),
    divisors: { type: "divisors" },
  },
  dzialanie: {
    numberSlots: number(2, 4),
    max: number(2, 99),
    operators: { type: "operators" },
    distractors: number(0, 2),
    prefill: choice(["none", "numbers", "operators"]),
  },
  sumuj: {
    size: number(5, 8),
    min: number(1, 10),
    max: number(10, 50),
    shapeSize: number(2, 4),
    rotations: toggle,
    operation: choice(["sum", "product"]),
  },
  wybierz: {
    rows: number(3, 6),
    cols: number(2, 4),
    max: number(2, 20),
    operation: choice(["product", "sum"]),
  },
  podziel: {
    max: number(20, 999),
    remainder: toggle,
    divisors: { type: "divisors" },
  },
  plusminus: {
    blanks: number(2, 4),
    max: number(5, 50),
    operators: { type: "operators", allowed: ["+", "-", "*"] },
  },
  taknie: { max: number(10, 300) },
  slupek: {
    digits: number(2, 3),
    blanks: number(1, 3),
    operation: choice(["add", "subtract", "multiply"]),
    resultOnly: toggle,
  },
  kwadrat: {
    size: number(3, 4),
    blanks: number(1, 4),
    max: number(5, 30),
    totals: choice(["both", "rows", "columns"]),
    diagonals: toggle,
  },
  karuzela: {
    chainLength: number(2, 4),
    max: number(30, 500),
    options: number(4, 8),
    operators: { type: "operators" },
    timedReveal: toggle,
  },
};
export function knobSchema(gameId) {
  const p = games[gameId].difficulty(1);
  return {
    ...KNOBS[gameId],
    seconds: number(4, 600),
    levels: number(1, p.archetype === "ladder" ? 20 : 90),
    ...(p.archetype === "ladder"
      ? { penalty: number(0, 10), basePoints: number(0, 50) }
      : { points: number(1, 30), maxStrikes: number(1, 5) }),
  };
}
/** Restrict imported/manual profiles to the generator's tested input space. */
export function validateParams(gameId, overrides) {
  if (!games[gameId] || !overrides || typeof overrides !== "object")
    throw new Error("Unknown game");
  const schema = knobSchema(gameId),
    result = {};
  for (const [key, value] of Object.entries(overrides)) {
    const s = schema[key];
    if (!s) throw new Error(`Unknown parameter: ${key}`);
    if (
      s.type === "number" &&
      (!Number.isInteger(value) || value < s.min || value > s.max)
    )
      throw new Error(`Invalid ${key}`);
    if (s.type === "boolean" && typeof value !== "boolean")
      throw new Error(`Invalid ${key}`);
    if (s.type === "choice" && !s.options.includes(value))
      throw new Error(`Invalid ${key}`);
    if (
      s.type === "divisors" &&
      (!Array.isArray(value) ||
        !value.length ||
        value.length > 9 ||
        new Set(value).size !== value.length ||
        !value.every((n) => Number.isInteger(n) && n >= 2 && n <= 10))
    )
      throw new Error("Invalid divisors");
    if (
      s.type === "operators" &&
      (!Array.isArray(value) ||
        !value.length ||
        value.length > 4 ||
        new Set(value).size !== value.length ||
        !value.every((o) => (s.allowed ?? ["+", "-", "*", "/"]).includes(o)))
    )
      throw new Error("Invalid operators");
    result[key] = value;
  }
  const p = parameters(gameId, 1, {}, result);
  if (
    p.min >= p.max ||
    (gameId === "kwadrat" && p.blanks > p.size) ||
    (gameId === "slupek" && p.blanks > p.digits)
  )
    throw new Error("Incompatible ranges");
  if (
    gameId === "dzielnik" &&
    p.divisors.some(
      (d) => Math.floor(p.max / d) - Math.ceil(p.min / d) + 1 < p.find,
    )
  )
    throw new Error("Not enough divisible numbers");
  if (gameId === "wybierz" && p.operation === "product" && p.max > 9)
    throw new Error("Product digits must be at most 9");
  return result;
}
export function createVariant(
  gameId,
  overrides,
  settings = {},
  createdAt = Date.now(),
) {
  const params = validateParams(gameId, overrides);
  const canonical = JSON.stringify(
    Object.fromEntries(
      Object.entries(params).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
  const id = `${gameId}:v_${hash(canonical + JSON.stringify(settings))}`;
  return {
    id,
    gameId,
    params,
    settings: { ...settings },
    rulesText: games[gameId].rulesCard(parameters(gameId, 1, settings, params)),
    createdAt,
  };
}
export function randomVariant(seed, gameId, settings = {}) {
  const rng = mulberry32(seed),
    id = gameId ?? pick(rng, Object.keys(games));
  const variants = {
    dzielnik: () => ({
      divisors: pick(rng, [
        [2, 5, 10],
        [3, 4, 6],
        [3, 6, 9],
        [4, 8],
        [7, 9],
      ]),
      cells: pick(rng, [12, 16, 20, 24]),
      find: pick(rng, [2, 3]),
      seconds: pick(rng, [12, 15, 20]),
      max: 199,
    }),
    dzialanie: () => ({
      numberSlots: pick(rng, [2, 3, 4]),
      prefill: pick(rng, ["none", "numbers", "operators"]),
      operators: pick(rng, [
        ["+", "-"],
        ["+", "*"],
        ["*", "/"],
      ]),
      max: 10,
    }),
    sumuj: () => ({
      size: pick(rng, [5, 6, 7]),
      shapeSize: pick(rng, [2, 3, 4]),
      operation: pick(rng, ["sum", "product"]),
      rotations: rng() < 0.5,
    }),
    wybierz: () => ({
      rows: pick(rng, [3, 4, 5, 6]),
      cols: pick(rng, [2, 3, 4]),
      operation: pick(rng, ["sum", "product"]),
      seconds: pick(rng, [15, 20, 25]),
    }),
    podziel: () => ({
      remainder: rng() < 0.5,
      max: pick(rng, [100, 200, 999]),
      seconds: pick(rng, [12, 15, 20]),
    }),
    plusminus: () => ({
      blanks: pick(rng, [2, 3, 4]),
      max: pick(rng, [10, 20, 30]),
      operators: pick(rng, [
        ["+", "-"],
        ["+", "-", "*"],
      ]),
    }),
    taknie: () => ({
      seconds: pick(rng, [4, 7, 10]),
      max: pick(rng, [10, 30, 100]),
    }),
    slupek: () => ({
      digits: 3,
      blanks: pick(rng, [1, 2, 3]),
      operation: pick(rng, ["add", "subtract", "multiply"]),
      resultOnly: rng() < 0.5,
    }),
    kwadrat: () => ({
      size: pick(rng, [3, 4]),
      blanks: pick(rng, [2, 3]),
      max: pick(rng, [9, 20, 30]),
      totals: pick(rng, ["both", "rows", "columns"]),
    }),
    karuzela: () => ({
      chainLength: pick(rng, [2, 3, 4]),
      options: pick(rng, [4, 6, 8]),
      timedReveal: rng() < 0.5,
      seconds: pick(rng, [10, 15, 20]),
    }),
  };
  return createVariant(id, variants[id](), settings);
}
