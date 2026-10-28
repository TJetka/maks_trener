import { Clock } from "./clock.js?v=1.0.1";
import { total } from "./math.js?v=1.0.1";
export const SESSION_MS = 45 * 60 * 1000;
export class Session {
  constructor(
    gameIds,
    { now, wallNow = () => Date.now(), durationMs = SESSION_MS } = {},
  ) {
    if (gameIds.length !== 2 || new Set(gameIds).size !== 2)
      throw new Error("Select two different games");
    this.clock = new Clock(now);
    this.clock.start();
    this.durationMs = durationMs;
    this.wallNow = wallNow;
    const startedAt = wallNow();
    this.data = {
      id: `s_${startedAt}`,
      startedAt,
      games: gameIds,
      bests: {},
      bestAt: {},
      runsPerGame: {},
      minutesPerGame: {},
      windowUsedMs: 0,
      visibilityEvents: [],
    };
    for (const id of gameIds) {
      this.data.bests[id] = 0;
      this.data.bestAt[id] = null;
      this.data.runsPerGame[id] = 0;
      this.data.minutesPerGame[id] = 0;
    }
  }
  remaining() {
    return Math.max(0, this.durationMs - this.clock.elapsed());
  }
  addRun(run) {
    const d = this.data,
      id = run.gameId;
    if (run.sessionId !== d.id || !d.games.includes(id))
      throw new Error("Run belongs to another session");
    d.runsPerGame[id]++;
    d.minutesPerGame[id] += run.durationMs / 60000;
    if (run.score > d.bests[id]) {
      d.bests[id] = run.score;
      d.bestAt[id] = run.bestAt ?? run.startedAt + run.durationMs;
    }
    d.windowUsedMs = Math.min(
      this.durationMs,
      total(Object.values(d.minutesPerGame)) * 60000,
    );
  }
  finish() {
    this.data.endedAt = this.wallNow();
    this.data.elapsedMs = Math.min(this.durationMs, this.clock.elapsed());
    this.data.durationMs = this.durationMs;
    this.clock.pause();
    return this.data;
  }
}
export function sessionSummary(data) {
  const sum = total(Object.values(data.bests));
  const bestGame = [...data.games].sort(
    (a, b) =>
      data.bests[b] - data.bests[a] ||
      (data.bestAt[a] ?? Infinity) - (data.bestAt[b] ?? Infinity),
  )[0];
  return {
    sum,
    component: data.bests[bestGame],
    timeToBest:
      data.bestAt[bestGame] === null
        ? null
        : data.bestAt[bestGame] - data.startedAt,
    used: data.windowUsedMs / (data.durationMs ?? SESSION_MS),
  };
}
