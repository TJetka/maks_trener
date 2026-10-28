export const LADDER = {
  archetype: "ladder",
  levels: 20,
  seconds: 300,
  penalty: 3,
  basePoints: 11,
};
export const STREAK = {
  archetype: "streak",
  levels: 90,
  seconds: 15,
  points: 8,
  maxStrikes: 3,
};
export function createScore(config) {
  return {
    config,
    level: 1,
    cleared: 0,
    score: 0,
    strikes: 0,
    ended: false,
    endReason: null,
  };
}
export const levelPoints = (state) =>
  state.config.archetype === "ladder"
    ? state.config.basePoints + state.level
    : state.config.points;
export function finish(state, reason) {
  return state.ended
    ? state
    : {
        ...state,
        score: Math.max(0, state.score),
        ended: true,
        endReason: reason,
      };
}
/** An answer is one checked action; partial Dzielnik selections do not clear a level. */
export function scoreAnswer(state, correct, complete = true) {
  if (state.ended) return state;
  let next = { ...state };
  if (correct && complete) {
    next.score += levelPoints(state);
    next.cleared++;
    next.level++;
    if (next.cleared >= state.config.levels)
      next = finish(
        next,
        state.config.archetype === "ladder" ? "levels" : "cap",
      );
  } else if (!correct) {
    if (state.config.archetype === "ladder") next.score -= state.config.penalty;
    else if (++next.strikes >= state.config.maxStrikes)
      next = finish(next, "strikes");
  }
  return next;
}
