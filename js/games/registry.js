import * as dzielnik from './dzielnik/generator.js';
import * as dzialanie from './dzialanie/generator.js';
import * as sumuj from './sumuj/generator.js';
import * as wybierz from './wybierz/generator.js';
import * as podziel from './podziel/generator.js';
import * as plusminus from './plusminus/generator.js';
import * as taknie from './taknie/generator.js';
import * as slupek from './slupek/generator.js';
import * as kwadrat from './kwadrat/generator.js';
import * as karuzela from './karuzela/generator.js';
import {pl} from '../i18n/pl.js';
const modules = {dzielnik,dzialanie,sumuj,wybierz,podziel,plusminus,taknie,slupek,kwadrat,karuzela};
export const games = Object.fromEntries(Object.entries(modules).map(([id, module], i) => [id, {id, ...module, name: pl.games[id][0], description: pl.games[id][1], skill: pl.games[id][2], icon: pl.games[id][3], tier: i < 4 ? 'A' : 'B', color: ['mint','blue','peach','purple'][i % 4]}]));
export function parameters(id, level, settings = {}, overrides = {}) {
  const p = games[id].difficulty(level);
  if (settings.grade === 3 && p.max) p.max = Math.max(9, Math.floor(p.max * .75));
  if (settings.grade === 5 && p.max) p.max = Math.floor(p.max * 1.2);
  if (settings.table12 && id === 'dzialanie' && level > 6) p.max = 12;
  return {...p, ...overrides};
}
