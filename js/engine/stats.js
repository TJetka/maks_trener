import { median, total } from "./math.js?v=1.1.0";
export const emptySummary = () => ({
  count: 0,
  correct: 0,
  responses: {},
  facts: {},
});
export function histogramMedian(histogram) {
  const entries = Object.entries(histogram)
    .map(([k, v]) => [Number(k), v])
    .sort((a, b) => a[0] - b[0]);
  const count = total(entries.map((x) => x[1]));
  if (!count) return 0;
  const middle = [Math.floor((count - 1) / 2), Math.floor(count / 2)];
  let n = 0;
  const values = [];
  for (const [value, freq] of entries) {
    for (const m of middle) if (m >= n && m < n + freq) values.push(value);
    n += freq;
  }
  return total(values) / 2;
}
function increment(histogram, value, count = 1) {
  histogram[value] = (histogram[value] ?? 0) + count;
}
/** Aggregate all attempts, independently of the 400-event detail retention limit. */
export function addEvent(summary, event) {
  summary.count++;
  summary.correct += Number(event.correct);
  const ms = Math.round(event.responseMs);
  if (event.correct) increment(summary.responses, ms);
  const fact = (summary.facts[event.itemSignature] ??= {
    count: 0,
    errors: 0,
    responses: {},
  });
  fact.count++;
  fact.errors += Number(!event.correct);
  increment(fact.responses, ms);
}
export function runSummary(run) {
  if (run.summary) return run.summary;
  const summary = emptySummary();
  for (const e of run.events ?? []) addEvent(summary, e);
  return summary;
}
export function summarizeRuns(runs) {
  const count = total(runs.map((r) => runSummary(r).count));
  const correct = total(runs.map((r) => runSummary(r).correct));
  const responses = {};
  for (const r of runs)
    for (const [ms, n] of Object.entries(runSummary(r).responses))
      increment(responses, ms, n);
  return {
    runs: runs.length,
    best: Math.max(0, ...runs.map((r) => r.score)),
    accuracy: count ? correct / count : 0,
    medianMs: histogramMedian(responses),
    durationMs: total(runs.map((r) => r.durationMs)),
    count,
  };
}
export function facts(runs) {
  const result = {};
  for (const r of runs)
    for (const [key, fact] of Object.entries(runSummary(r).facts)) {
      const f = (result[key] ??= { count: 0, errors: 0, responses: {} });
      f.count += fact.count;
      f.errors += fact.errors;
      for (const [ms, n] of Object.entries(fact.responses))
        increment(f.responses, ms, n);
    }
  const families = {};
  for (const [key, f] of Object.entries(result)) {
    const family = key.split(":")[0],
      h = (families[family] ??= {});
    for (const [ms, n] of Object.entries(f.responses)) increment(h, ms, n);
  }
  const thresholds = {};
  for (const [family, h] of Object.entries(families)) {
    const target = total(Object.values(h)) * 0.75;
    let n = 0;
    for (const [ms, count] of Object.entries(h).sort(
      (a, b) => Number(a[0]) - Number(b[0]),
    )) {
      n += count;
      if (n >= target) {
        thresholds[family] = Number(ms);
        break;
      }
    }
  }
  return Object.entries(result)
    .map(([signature, f]) => {
      const slowCount = total(
        Object.entries(f.responses)
          .filter(([ms]) => Number(ms) > thresholds[signature.split(":")[0]])
          .map(([, n]) => n),
      );
      return {
        signature,
        ...f,
        medianMs: histogramMedian(f.responses),
        accuracy: 1 - f.errors / f.count,
        slowCount,
        weakness: f.errors * 2 + slowCount,
      };
    })
    .sort((a, b) => b.weakness - a.weakness || b.medianMs - a.medianMs);
}
export function heatmap(runs, max = 10) {
  const all = facts(runs);
  return Array.from({ length: max }, (_, a) =>
    Array.from({ length: max }, (_, b) => {
      const matched = all.filter(
        (f) =>
          f.signature === `mul:${a + 1}x${b + 1}` ||
          f.signature === `div:${a + 1}x${b + 1}`,
      );
      const count = total(matched.map((f) => f.count)),
        errors = total(matched.map((f) => f.errors));
      const hist = {};
      for (const f of matched)
        for (const [ms, n] of Object.entries(f.responses))
          increment(hist, ms, n);
      return {
        a: a + 1,
        b: b + 1,
        count,
        accuracy: count ? 1 - errors / count : null,
        medianMs: histogramMedian(hist),
      };
    }),
  );
}
export function mysteryStats(store) {
  return Object.entries(store.variants).map(([id, v]) => {
    const runs = store.runs
        .filter((r) => r.variantId === id)
        .sort((a, b) => a.startedAt - b.startedAt),
      first = runs[0];
    const best = Math.max(0, ...runs.map((r) => r.score));
    return {
      id,
      ...v,
      runs: runs.length,
      firstScore: first?.score ?? null,
      best,
      readingMs: first?.readingMs ?? null,
      firstCorrectMs: first?.firstCorrectMs ?? null,
      ratio: best ? (first?.score ?? 0) / best : null,
    };
  });
}
/** Frequency distribution, not a time series of the last attempts. */
export function levelHistogram(runs) {
  const counts = new Map();
  for (const run of runs)
    counts.set(run.levelsReached, (counts.get(run.levelsReached) ?? 0) + 1);
  return [...counts]
    .sort(([a], [b]) => a - b)
    .map(([level, count]) => ({ level, count }));
}
export { median };
