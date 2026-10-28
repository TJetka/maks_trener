import { runSummary } from "./stats.js?v=1.0.1";
export const STORE_KEY = "makstrener.v1";
export const DEFAULT_SETTINGS = {
  grade: 4,
  keypadSide: "right",
  sounds: false,
  reveal: true,
  table12: false,
  freeExpression: false,
  rulesTimeout: true,
};
export const freshStore = () => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  runs: [],
  sessions: [],
  variants: {},
});
const gameIds = [
  "dzielnik",
  "dzialanie",
  "sumuj",
  "wybierz",
  "podziel",
  "plusminus",
  "taknie",
  "slupek",
  "kwadrat",
  "karuzela",
  "drill",
];
const finite = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0;
function safeTree(value, depth = 0) {
  if (depth > 15) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.length < 10000;
  if (Array.isArray(value))
    return value.length <= 20000 && value.every((v) => safeTree(v, depth + 1));
  if (typeof value !== "object") return false;
  return Object.entries(value).every(
    ([k, v]) =>
      !["__proto__", "constructor", "prototype"].includes(k) &&
      safeTree(v, depth + 1),
  );
}
function validHistogram(h) {
  return (
    h &&
    typeof h === "object" &&
    Object.entries(h).every(
      ([k, v]) => finite(Number(k)) && Number.isInteger(v) && v >= 0,
    )
  );
}
function validSummary(s) {
  return (
    s &&
    finite(s.count) &&
    finite(s.correct) &&
    s.correct <= s.count &&
    validHistogram(s.responses) &&
    s.facts &&
    Object.values(s.facts).every(
      (f) =>
        finite(f.count) &&
        finite(f.errors) &&
        f.errors <= f.count &&
        validHistogram(f.responses),
    )
  );
}
function validEvent(e) {
  return (
    e &&
    finite(e.t) &&
    finite(e.level) &&
    typeof e.correct === "boolean" &&
    finite(e.responseMs) &&
    typeof e.itemSignature === "string"
  );
}
/** Validate untrusted imports before merging; never pass imported strings to HTML. */
export function validateStore(s) {
  if (
    !s ||
    s.version !== 1 ||
    !safeTree(s) ||
    !s.settings ||
    !Array.isArray(s.runs) ||
    !Array.isArray(s.sessions) ||
    !s.variants ||
    Array.isArray(s.variants)
  )
    throw new Error("Invalid store");
  if (
    ![3, 4, 5].includes(s.settings.grade) ||
    !["left", "right"].includes(s.settings.keypadSide)
  )
    throw new Error("Invalid settings");
  for (const key of [
    "sounds",
    "reveal",
    "table12",
    "freeExpression",
    "rulesTimeout",
  ])
    if (key in s.settings && typeof s.settings[key] !== "boolean")
      throw new Error("Invalid setting");
  for (const r of s.runs) {
    if (
      typeof r.id !== "string" ||
      !gameIds.includes(r.gameId) ||
      !["free", "session", "mystery", "drill"].includes(r.mode) ||
      typeof r.variantId !== "string" ||
      !finite(r.startedAt) ||
      !finite(r.durationMs) ||
      !finite(r.score) ||
      !finite(r.levelsReached) ||
      !finite(r.strikes) ||
      !Array.isArray(r.events) ||
      r.events.length > 400 ||
      !r.events.every(validEvent) ||
      (r.summary && !validSummary(r.summary))
    )
      throw new Error("Invalid run");
  }
  for (const s1 of s.sessions) {
    if (
      typeof s1.id !== "string" ||
      !finite(s1.startedAt) ||
      !Array.isArray(s1.games) ||
      s1.games.length !== 2 ||
      new Set(s1.games).size !== 2 ||
      !s1.games.every((id) => gameIds.includes(id) && id !== "drill") ||
      !s1.bests ||
      !s1.bestAt ||
      !s1.runsPerGame ||
      !finite(s1.windowUsedMs)
    )
      throw new Error("Invalid session");
    for (const id of s1.games)
      if (
        !finite(s1.bests[id]) ||
        !finite(s1.runsPerGame[id]) ||
        (s1.bestAt[id] !== null && !finite(s1.bestAt[id]))
      )
        throw new Error("Invalid best");
  }
  for (const v of Object.values(s.variants))
    if (
      !v ||
      !gameIds.includes(v.gameId) ||
      v.gameId === "drill" ||
      typeof v.rulesText !== "string" ||
      !v.params ||
      typeof v.params !== "object" ||
      Array.isArray(v.params)
    )
      throw new Error("Invalid variant");
  return s;
}
export function loadStore(storage) {
  try {
    const raw = storage.getItem(STORE_KEY);
    return {
      data: raw ? validateStore(JSON.parse(raw)) : freshStore(),
      error: null,
    };
  } catch {
    return { data: freshStore(), error: "corrupt" };
  }
}
export function mergeStores(current, incoming) {
  validateStore(incoming);
  const merge = (a, b) =>
    [...new Map([...b, ...a].map((x) => [x.id, x])).values()].sort(
      (a, b) => a.startedAt - b.startedAt,
    );
  return {
    ...current,
    runs: merge(current.runs, incoming.runs),
    sessions: merge(current.sessions, incoming.sessions),
    variants: { ...incoming.variants, ...current.variants },
  };
}
/** Keep summaries and provenance; compact details only, never remove a run. */
export function serializeStore(store, limit = 4 * 1024 * 1024) {
  const copy = structuredClone(store);
  let json = JSON.stringify(copy);
  for (const run of [...copy.runs]
    .filter((r) => r.mode === "free")
    .sort((a, b) => a.startedAt - b.startedAt)) {
    if (new TextEncoder().encode(json).length <= limit) break;
    run.summary = runSummary(run);
    run.events = [];
    run.compacted = true;
    json = JSON.stringify(copy);
  }
  if (new TextEncoder().encode(json).length > limit)
    throw new Error("Store exceeds storage budget");
  return json;
}
export function saveStore(storage, store) {
  try {
    storage.setItem(STORE_KEY, serializeStore(store));
    return true;
  } catch {
    return false;
  }
}
export function parseImport(text) {
  if (new TextEncoder().encode(text).length > 8 * 1024 * 1024)
    throw new Error("File too large");
  return validateStore(JSON.parse(text));
}
