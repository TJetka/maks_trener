import * as dzielnik from "./dzielnik/generator.js?v=1.0.1";
import * as dzialanie from "./dzialanie/generator.js?v=1.0.1";
import * as sumuj from "./sumuj/generator.js?v=1.0.1";
import * as wybierz from "./wybierz/generator.js?v=1.0.1";
import * as podziel from "./podziel/generator.js?v=1.0.1";
import * as plusminus from "./plusminus/generator.js?v=1.0.1";
import * as taknie from "./taknie/generator.js?v=1.0.1";
import * as slupek from "./slupek/generator.js?v=1.0.1";
import * as kwadrat from "./kwadrat/generator.js?v=1.0.1";
import * as karuzela from "./karuzela/generator.js?v=1.0.1";
import { pl } from "../i18n/pl.js?v=1.0.1";
import { tierParameters } from "../engine/difficulty.js";
const modules = {
  dzielnik,
  dzialanie,
  sumuj,
  wybierz,
  podziel,
  plusminus,
  taknie,
  slupek,
  kwadrat,
  karuzela,
};
export const games = Object.fromEntries(
  Object.entries(modules).map(([id, module], i) => [
    id,
    {
      id,
      ...module,
      name: pl.games[id][0],
      description: pl.games[id][1],
      skill: pl.games[id][2],
      icon: pl.games[id][3],
      tier: i < 4 ? "A" : "B",
      color: ["mint", "blue", "peach", "purple"][i % 4],
    },
  ]),
);
export function parameters(id, level, settings = {}, overrides = {}) {
  const p = tierParameters(
    id,
    level,
    games[id].difficulty(level),
    settings.difficulty,
  );
  if (settings.grade === 3 && p.max)
    p.max = Math.max(9, Math.floor(p.max * 0.75));
  if (settings.grade === 5 && p.max) p.max = Math.floor(p.max * 1.2);
  if (id === "taknie") p.max = Math.max(10, p.max);
  if (id === "wybierz" && p.operation === "product") p.max = Math.min(9, p.max);
  if (settings.table12 && id === "dzialanie" && level > 6) p.max = 12;
  return { ...p, ...overrides };
}
