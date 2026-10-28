import { games, parameters } from "../games/registry.js?v=1.1.0";
import { mulberry32, pick, hash } from "./rng.js?v=1.1.0";
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
    max: number(2, 50),
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
    operation: choice(["add", "subtract", "mixed", "multiply"]),
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
export function validateParams(gameId, overrides, settings = {}) {
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
  const p = parameters(gameId, 1, settings, result);
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
  settings = { ...settings, difficulty: settings.difficulty ?? "intermediate" };
  const params = validateParams(gameId, overrides, settings);
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
    settings: structuredClone(settings),
    rulesText: games[gameId].rulesCard(parameters(gameId, 1, settings, params)),
    createdAt,
  };
}
export function randomVariant(seed, gameId, settings = {}) {
  const rng = mulberry32(seed),
    id = gameId ?? pick(rng, Object.keys(games));
  const expert = settings.difficulty === "expert";
  const variants = {
    dzielnik: () => ({
      divisors: pick(
        rng,
        expert
          ? [
              [3, 4, 6],
              [3, 6, 9],
              [4, 8],
              [7, 9],
            ]
          : [
              [2, 5, 10],
              [3, 5, 6],
            ],
      ),
      cells: pick(rng, expert ? [24, 30] : [12, 16]),
      find: expert ? 3 : 2,
      seconds: pick(rng, expert ? [12, 15] : [20, 22]),
      max: expert ? 499 : 99,
    }),
    dzialanie: () => ({
      numberSlots: pick(rng, expert ? [3, 4] : [2, 3]),
      prefill: expert ? "none" : "operators",
      operators: expert ? ["+", "-", "*", "/"] : ["+", "-"],
      distractors: expert ? 2 : 1,
      max: 10,
    }),
    sumuj: () => ({
      size: expert ? pick(rng, [6, 7]) : 5,
      shapeSize: pick(rng, expert ? [3, 4] : [2, 3]),
      operation: "sum",
      max: pick(rng, expert ? [15, 30] : [9, 15]),
      rotations: expert && rng() < 0.5,
    }),
    wybierz: () => ({
      rows: pick(rng, expert ? [4, 5, 6] : [3, 4]),
      cols: expert ? 3 : 2,
      max: expert ? 9 : 6,
      operation: pick(rng, ["sum", "product"]),
      seconds: expert ? 18 : 25,
    }),
    podziel: () => ({
      remainder: expert,
      max: expert ? pick(rng, [199, 499, 999]) : 100,
      seconds: expert ? 15 : 20,
    }),
    plusminus: () => ({
      blanks: expert ? pick(rng, [3, 4]) : 2,
      max: pick(rng, expert ? [20, 30, 50] : [10, 20]),
      operators: expert ? ["+", "-", "*"] : ["+", "-"],
    }),
    taknie: () => ({
      seconds: expert ? pick(rng, [6, 7]) : 10,
      max: pick(rng, expert ? [100, 300] : [10, 20]),
    }),
    slupek: () => ({
      digits: expert ? 3 : 2,
      blanks: pick(rng, expert ? [2, 3] : [1, 2]),
      operation: pick(rng, expert ? ["mixed", "multiply"] : ["add", "mixed"]),
      resultOnly: false,
    }),
    kwadrat: () => ({
      size: expert ? 4 : 3,
      blanks: pick(rng, expert ? [3, 4] : [1, 2]),
      max: pick(rng, expert ? [20, 30] : [9, 15]),
      totals: "both",
    }),
    karuzela: () => ({
      chainLength: pick(rng, expert ? [3, 4] : [2, 3]),
      options: expert ? pick(rng, [6, 8]) : 4,
      operators: expert ? ["+", "-", "*", "/"] : ["+", "-"],
      timedReveal: false,
      seconds: pick(rng, expert ? [12, 15] : [18, 20]),
    }),
  };
  return createVariant(id, variants[id](), settings);
}
