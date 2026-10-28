import { pl, tr } from "../i18n/pl.js?v=1.0.1";
import {
  el,
  button,
  heading,
  stat,
  select,
  field,
  percent,
  seconds,
  date,
  metricName,
} from "./dom.js?v=1.0.1";
import { icon, iconBox } from "./icons.js?v=1.0.1";
import { games, parameters } from "../games/registry.js?v=1.0.1";
import {
  summarizeRuns,
  facts,
  heatmap,
  mysteryStats,
  levelHistogram,
} from "../engine/stats.js?v=1.0.1";
import { sessionSummary } from "../engine/session.js?v=1.0.1";
import { formatTime } from "../engine/clock.js?v=1.0.1";
import { knobSchema } from "../engine/mystery.js?v=1.0.1";

export function shell(content, ctx, route) {
  const brand = button(
    [
      el("span", { className: "brand-mark" }, "m", el("i")),
      el("span", {}, "Maks", el("b", {}, "Trener")),
    ],
    () => ctx.go("home"),
    "brand",
    { "aria-label": pl.brand },
  );
  const nav = el(
    "nav",
    { "aria-label": pl.home },
    Object.entries(pl.nav).map(([id, label]) =>
      button(
        [icon(id, 18), el("span", {}, label)],
        () => ctx.go(id),
        `nav-link ${route === id ? "current" : ""}`,
        route === id ? { "aria-current": "page" } : {},
      ),
    ),
  );
  return el(
    "div",
    { className: "app-shell" },
    el(
      "header",
      { className: "site-header" },
      el(
        "div",
        { className: "header-inner" },
        brand,
        nav,
        el(
          "span",
          { className: "grade-badge" },
          tr(pl.grade, { n: ctx.store.settings.grade }),
        ),
      ),
    ),
    el("main", { id: "main", tabindex: "-1" }, content),
    el(
      "footer",
      { className: "site-footer" },
      el("span", {}, pl.footer),
      el("span", { className: "privacy" }, icon("shield", 16), pl.local),
    ),
  );
}
export function home(ctx) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daily = ctx.store.runs.filter((r) => r.startedAt >= today.getTime());
  const summary = summarizeRuns(daily);
  const heroArt = el(
    "div",
    { className: "hero-art", "aria-hidden": "true" },
    el("span", { className: "art-orbit orbit-one" }),
    el("span", { className: "art-orbit orbit-two" }),
    el("div", { className: "art-card art-add" }, "7", el("span", {}, "+"), "8"),
    el("div", { className: "art-card art-multiply" }, "×"),
    el("div", { className: "art-card art-equals" }, "="),
    el("div", { className: "art-star" }, "✦"),
    el(
      "div",
      { className: "art-character" },
      el("div", { className: "eyes" }, el("i"), el("i")),
      el("div", { className: "smile" }),
    ),
    el("span", { className: "art-dot dot-one" }),
    el("span", { className: "art-dot dot-two" }),
    el("span", { className: "art-spark" }, "✧"),
  );
  const modes = Object.entries(pl.tiles).map(
    ([id, [title, description, cta]], i) =>
      button(
        [
          el(
            "div",
            { className: "tile-top" },
            iconBox(
              id,
              ["mint", "blue", "purple", "peach", "yellow", "stone"][i],
            ),
            el(
              "span",
              { className: "tile-number" },
              String(i + 1).padStart(2, "0"),
            ),
          ),
          el("h3", {}, title),
          el("p", {}, description),
          el("span", { className: "tile-cta" }, cta, icon("arrow", 18)),
        ],
        () => ctx.go(id),
        "mode-tile",
      ),
  );
  return el(
    "div",
    { className: "home-page" },
    el(
      "div",
      { className: "welcome-line" },
      el(
        "span",
        {},
        pl.hello,
        " ",
        el("span", { "aria-hidden": "true" }, "☀"),
      ),
      el("span", { className: "contest-pill" }, el("i"), pl.contest),
    ),
    el(
      "section",
      { className: "hero" },
      el(
        "div",
        { className: "hero-copy" },
        el("p", { className: "eyebrow" }, pl.daily),
        el(
          "h1",
          {},
          pl.heroTitle
            .split("\n")
            .map((line, i) => [i ? el("br") : null, line]),
        ),
        el("p", { className: "hero-text" }, pl.heroText),
        button(
          [pl.startTraining, icon("arrow", 21)],
          () => ctx.go("train"),
          "button hero-button",
        ),
        el("p", { className: "hero-note" }, icon("shield", 16), pl.offline),
      ),
      heroArt,
    ),
    el(
      "div",
      { className: "daily-strip" },
      el(
        "div",
        { className: "daily-label" },
        el("span", { className: "sun-icon" }, "☼"),
        el(
          "div",
          {},
          el("strong", {}, pl.dayTraining),
          el("span", {}, pl.smallStep),
        ),
      ),
      stat(pl.dayRuns, summary.runs),
      stat(
        pl.totalTime,
        `${Math.round(summary.durationMs / 60000)} ${pl.minutesUnit}`,
      ),
      stat(pl.accuracy, summary.count ? percent(summary.accuracy) : "–"),
    ),
    el(
      "section",
      { className: "mode-section" },
      el(
        "div",
        { className: "section-heading" },
        el(
          "div",
          {},
          el("h2", {}, pl.chooseMode),
          el("p", { className: "subtle" }, pl.chooseModeText),
        ),
        el(
          "span",
          { className: "tiny-decoration", "aria-hidden": "true" },
          "↗",
        ),
      ),
      el("div", { className: "mode-grid" }, modes),
    ),
    el(
      "aside",
      { className: "tip-card" },
      icon("drill", 26),
      el("div", {}, el("strong", {}, pl.tip), el("p", {}, pl.tipText)),
    ),
  );
}
function gameCard(g, ctx, action) {
  const p = parameters(g.id, 1, ctx.store.settings),
    best = summarizeRuns(ctx.store.runs.filter((r) => r.gameId === g.id)).best;
  return el(
    "article",
    { className: "game-card" },
    el(
      "div",
      { className: `game-card-art ${g.color}` },
      el("span", {}, g.icon),
      el("span", { className: "skill-pill" }, g.skill),
    ),
    el(
      "div",
      { className: "game-card-body" },
      el(
        "div",
        { className: "game-title" },
        el("h2", {}, g.name),
        el(
          "span",
          { className: "tier-label" },
          g.tier === "A" ? pl.tierA : pl.tierB,
        ),
      ),
      el("p", { className: "subtle" }, g.description),
      el(
        "p",
        { className: "game-meta" },
        p.archetype === "ladder" ? pl.ladder : tr(pl.streak, { s: p.seconds }),
      ),
      el(
        "div",
        { className: "game-card-bottom" },
        el(
          "span",
          {},
          best ? [icon("trophy", 17), ` ${pl.best}: ${best}`] : pl.noBest,
        ),
        button(
          [pl.play, icon("arrow", 17)],
          () => action(g.id),
          "button small",
        ),
      ),
    ),
  );
}
export function training(ctx) {
  const list = el("div", { className: "game-grid" }),
    tabs = el("div", { className: "tabs" });
  const options = [
    ["all", pl.all],
    ["A", pl.documented],
    ["B", pl.reconstructed],
  ];
  function show(tier) {
    list.replaceChildren(
      ...Object.values(games)
        .filter((g) => tier === "all" || g.tier === tier)
        .map((g) => gameCard(g, ctx, ctx.prepare)),
    );
    [...tabs.children].forEach((n, j) => {
      n.classList.toggle("active", options[j][0] === tier);
      n.setAttribute("aria-pressed", String(options[j][0] === tier));
    });
  }
  for (const [key, text] of options)
    tabs.append(button(text, () => show(key), "tab"));
  show("all");
  return el(
    "div",
    {},
    heading(pl.training, pl.trainingText, pl.nav.train),
    tabs,
    list,
  );
}
export function sessionPage(ctx) {
  if (ctx.session) {
    const d = ctx.session.data,
      summary = sessionSummary(d);
    return el(
      "div",
      {},
      heading(pl.sessionReady, pl.sessionText, pl.nav.session),
      el(
        "div",
        { className: "session-banner" },
        stat(pl.sessionLeft, formatTime(ctx.session.remaining())),
        stat(pl.bestSum, summary.sum),
      ),
      el(
        "div",
        { className: "session-game-grid" },
        d.games.map((id) =>
          el(
            "article",
            { className: "panel session-game" },
            el(
              "div",
              { className: `game-symbol ${games[id].color}` },
              games[id].icon,
            ),
            el("h2", {}, games[id].name),
            el(
              "p",
              { className: "rules-copy" },
              ctx.store.settings.rulesTimeout &&
                ctx.session.clock.elapsed() >= 120000
                ? pl.rulesLocked
                : games[id].rulesCard(parameters(id, 1, ctx.store.settings)),
            ),
            el(
              "div",
              { className: "stat-row" },
              stat(pl.best, d.bests[id]),
              stat(pl.runs, d.runsPerGame[id]),
            ),
            button([pl.play, icon("arrow")], () =>
              ctx.startGame(id, { mode: "session" }),
            ),
          ),
        ),
      ),
      button(pl.sessionFinish, ctx.endSession, "button secondary"),
    );
  }
  let chosen = ["dzielnik", "dzialanie"],
    filter = "all",
    hidden = false;
  const selections = el("div", { className: "session-game-grid" }),
    notice = el("p", { className: "subtle", role: "status" });
  function paint() {
    const available = Object.values(games).filter(
      (g) => filter === "all" || g.tier === filter,
    );
    selections.replaceChildren(
      ...chosen.map((id, index) =>
        el(
          "div",
          { className: "panel session-choice" },
          el("div", { className: "mystery-symbol" }, "?"),
          el("h2", {}, tr(pl.slot, { n: index + 1 })),
          hidden
            ? el("p", {}, pl.hiddenGame)
            : field(
                tr(pl.slot, { n: index + 1 }),
                select(
                  available.map((g) => [g.id, g.name]),
                  id,
                  (value) => {
                    const other = chosen[1 - index];
                    chosen[index] = value;
                    if (value === other)
                      chosen[1 - index] = available.find(
                        (g) => g.id !== value,
                      ).id;
                    paint();
                  },
                ),
              ),
        ),
      ),
    );
  }
  paint();
  return el(
    "div",
    {},
    heading(pl.sessionTitle, pl.sessionText, pl.nav.session),
    el(
      "div",
      { className: "session-intro" },
      icon("session", 40),
      el("span", {}, "45:00"),
      el("p", {}, pl.sessionRules),
    ),
    field(
      pl.choose,
      select(
        [
          ["all", pl.all],
          ["A", pl.documented],
          ["B", pl.reconstructed],
        ],
        filter,
        (v) => {
          filter = v;
          chosen = Object.values(games)
            .filter((g) => v === "all" || g.tier === v)
            .slice(0, 2)
            .map((g) => g.id);
          hidden = false;
          paint();
        },
      ),
    ),
    selections,
    notice,
    el(
      "div",
      { className: "actions" },
      button(
        pl.random,
        () => {
          chosen = ctx.randomGames(filter);
          hidden = true;
          notice.textContent = pl.randomReady;
          paint();
        },
        "button secondary",
      ),
      button([pl.startSession, icon("arrow")], () => ctx.startSession(chosen)),
    ),
  );
}
export function sessionResult(data, ctx) {
  const s = sessionSummary(data);
  return el(
    "div",
    {},
    heading(pl.endTitles.session, pl.endText, pl.nav.session),
    el(
      "section",
      { className: "panel result-hero" },
      icon("trophy", 48),
      el("div", { className: "result-score" }, s.sum),
      el("p", {}, pl.bestSum),
      el(
        "p",
        { className: "tiebreak" },
        tr(pl.tiebreak, {
          x: s.component,
          t: s.timeToBest === null ? "–" : formatTime(s.timeToBest),
        }),
      ),
    ),
    el(
      "div",
      { className: "stat-row" },
      stat(pl.used, percent(s.used)),
      stat(pl.totalTime, formatTime(data.windowUsedMs)),
    ),
    el(
      "div",
      { className: "session-game-grid" },
      data.games.map((id) =>
        el(
          "article",
          { className: "panel" },
          el("h2", {}, games[id].name),
          el(
            "div",
            { className: "stat-row" },
            stat(pl.best, data.bests[id]),
            stat(pl.runs, data.runsPerGame[id]),
          ),
          el(
            "p",
            {},
            `${pl.minutes}: ${(data.minutesPerGame?.[id] ?? 0).toFixed(1)} ${pl.minutesUnit}`,
          ),
          el(
            "p",
            {},
            `${pl.timeToBest}: ${data.bestAt[id] === null ? "–" : formatTime(data.bestAt[id] - data.startedAt)}`,
          ),
        ),
      ),
    ),
    el(
      "div",
      { className: "actions" },
      button(pl.nav.stats, () => ctx.go("stats")),
      button(pl.home, () => ctx.go("home"), "button secondary"),
    ),
  );
}
export function mysteryPage(ctx) {
  let chosen = "random";
  const variants = mysteryStats(ctx.store);
  return el(
    "div",
    {},
    heading(pl.mysteryTitle, pl.mysteryText, pl.nav.mystery),
    el(
      "section",
      { className: "panel mystery-hero" },
      el("div", { className: "mystery-symbol large" }, "?"),
      field(
        pl.choose,
        select(
          [
            ["random", pl.mysteryRandom],
            ...Object.values(games).map((g) => [g.id, g.name]),
          ],
          chosen,
          (v) => (chosen = v),
        ),
      ),
      button([pl.mysteryDiscover, icon("arrow")], () =>
        ctx.discover(chosen === "random" ? null : chosen),
      ),
    ),
    variants.length
      ? el(
          "section",
          {},
          el("h2", {}, pl.variants),
          el(
            "div",
            { className: "variant-grid" },
            variants.map((v, j) =>
              el(
                "article",
                { className: "panel" },
                el("p", { className: "eyebrow" }, tr(pl.variant, { n: j + 1 })),
                el("h3", {}, games[v.gameId].name),
                el("p", { className: "subtle" }, v.rulesText),
                el(
                  "div",
                  { className: "stat-row" },
                  stat(pl.firstScore, v.firstScore ?? "–"),
                  stat(pl.best, v.best),
                ),
                button(
                  pl.replay,
                  () => ctx.prepare(v.gameId, { mode: "mystery", variant: v }),
                  "button secondary",
                ),
              ),
            ),
          ),
        )
      : null,
  );
}
export function drillsPage(ctx) {
  return el(
    "div",
    {},
    heading(pl.drillTitle, pl.drillText, pl.nav.drill),
    el(
      "div",
      { className: "drill-grid" },
      Object.entries(pl.drillTypes).map(([id, [title, description]], j) =>
        el(
          "article",
          { className: "panel drill-card" },
          iconBox("drill", ["yellow", "mint", "purple"][j]),
          el("h2", {}, title),
          el("p", { className: "subtle" }, description),
          button([pl.play, icon("arrow")], () => ctx.startDrill(id)),
        ),
      ),
    ),
  );
}
function table(headers, rows) {
  return el(
    "div",
    { className: "table-scroll" },
    el(
      "table",
      {},
      el(
        "thead",
        {},
        el(
          "tr",
          {},
          headers.map((h) => el("th", { scope: "col" }, h)),
        ),
      ),
      el(
        "tbody",
        {},
        rows.map((row) =>
          el(
            "tr",
            {},
            row.map((c) => el("td", {}, c)),
          ),
        ),
      ),
    ),
  );
}
export function statsPage(ctx) {
  const all = summarizeRuns(ctx.store.runs),
    weak = facts(ctx.store.runs)
      .filter((f) => f.weakness > 0)
      .slice(0, 3),
    variants = mysteryStats(ctx.store),
    week = Date.now() - 7 * 86400000;
  const heat = heatmap(ctx.store.runs, ctx.store.settings.table12 ? 12 : 10);
  const matrix = el(
    "div",
    { className: "heatmap", style: { "--cols": heat.length + 1 } },
    el("span", { className: "heat-label" }, "×"),
    heat.map((_, j) => el("span", { className: "heat-label" }, j + 1)),
    heat.flatMap((row) => [
      el("span", { className: "heat-label" }, row[0].a),
      ...row.map((f) =>
        button(
          el(
            "span",
            {},
            el("strong", {}, f.count ? percent(f.accuracy) : "–"),
            f.count ? el("small", {}, seconds(f.medianMs)) : null,
          ),
          () => ctx.startDrill("facts", `mul:${f.a}x${f.b}`),
          `heat-cell ${f.count ? (f.accuracy < 0.8 ? "heat-weak" : "heat-good") : ""}`,
          {
            "aria-label": `${f.a} × ${f.b}: ${f.count ? `${percent(f.accuracy)}, ${seconds(f.medianMs)}` : pl.noAttempts}. ${pl.practice}`,
          },
        ),
      ),
    ]),
  );
  const gameStats = Object.values(games).map((g) => {
    const runs = ctx.store.runs.filter((r) => r.gameId === g.id),
      s = summarizeRuns(runs),
      recent = summarizeRuns(runs.filter((r) => r.startedAt >= week));
    const histogram = levelHistogram(runs);
    const maxFrequency = Math.max(1, ...histogram.map((bin) => bin.count));
    const errors = facts(runs).filter((f) => f.errors > 0);
    return el(
      "article",
      { className: "panel game-stats" },
      el(
        "div",
        { className: "section-heading" },
        el("h3", {}, g.name),
        el(
          "span",
          { className: "badge" },
          `${s.runs} ${pl.runs.toLowerCase()}`,
        ),
      ),
      el(
        "div",
        { className: "stat-row" },
        stat(pl.best, s.best),
        stat(pl.last7, recent.best),
        stat(pl.accuracy, s.count ? percent(s.accuracy) : "–"),
        stat(pl.median, s.count ? seconds(s.medianMs) : "–"),
      ),
      g.difficulty(1).archetype === "ladder"
        ? el(
            "p",
            { className: "subtle" },
            `${pl.completion}: ${runs.length ? percent(runs.filter((r) => r.levelsReached >= (r.provenance?.overrides?.levels ?? 20)).length / runs.length) : "–"}`,
          )
        : null,
      el("p", { className: "subtle small-text" }, pl.distribution),
      el(
        "div",
        {
          className: "histogram",
          role: "img",
          "aria-label": histogram.length
            ? histogram
                .map(
                  (bin) =>
                    `${pl.levels}: ${bin.level}, ${pl.runs}: ${bin.count}`,
                )
                .join("; ")
            : pl.noAttempts,
        },
        histogram.map((bin) =>
          el(
            "div",
            {
              className: "hist-bar",
              style: {
                height: `${Math.max(8, (bin.count / maxFrequency) * 85)}%`,
              },
              title: `${pl.levels}: ${bin.level}, ${pl.runs}: ${bin.count}`,
            },
            el("span", {}, `${bin.level}: ${bin.count}`),
          ),
        ),
      ),
      errors.length
        ? el(
            "details",
            { className: "error-details" },
            el("summary", {}, pl.errorDetails),
            errors.map((f) =>
              el(
                "p",
                {},
                `${metricName(f.signature)} · ${tr(pl.errors, { n: f.errors })}`,
              ),
            ),
          )
        : null,
    );
  });
  const trend = variants.filter((v) => v.createdAt >= week && v.ratio !== null);
  return el(
    "div",
    {},
    heading(pl.statsTitle, pl.statsText, pl.nav.stats),
    el(
      "div",
      { className: "overview-stats" },
      stat(pl.totalRuns, all.runs),
      stat(
        pl.totalTime,
        `${Math.round(all.durationMs / 60000)} ${pl.minutesUnit}`,
      ),
      stat(pl.accuracy, all.count ? percent(all.accuracy) : "–"),
      stat(pl.median, all.count ? seconds(all.medianMs) : "–"),
    ),
    el(
      "section",
      { className: "panel weakness-panel" },
      el("h2", {}, pl.weaknesses),
      weak.length
        ? el(
            "div",
            { className: "weakness-list" },
            weak.map((f) =>
              el(
                "div",
                {},
                el(
                  "div",
                  {},
                  el("strong", {}, metricName(f.signature)),
                  el(
                    "p",
                    { className: "subtle" },
                    tr(pl.errors, { n: f.errors }),
                    ` · ${seconds(f.medianMs)}`,
                  ),
                ),
                button(
                  pl.practice,
                  () =>
                    ctx.startDrill(
                      /^div\d+:/.test(f.signature)
                        ? "divisibility"
                        : /^(mul|div):/.test(f.signature)
                          ? "facts"
                          : "target",
                      f.signature,
                    ),
                  "button secondary small",
                ),
              ),
            ),
          )
        : el("p", { className: "subtle" }, pl.noWeakness),
    ),
    !all.runs ? el("p", { className: "empty-state" }, pl.noResults) : null,
    el("div", { className: "stats-grid" }, gameStats),
    el(
      "section",
      { className: "panel" },
      el("h2", {}, pl.heatmap),
      el("p", { className: "subtle" }, pl.heatHint),
      el("div", { className: "table-scroll" }, matrix),
    ),
    el(
      "section",
      { className: "panel" },
      el("h2", {}, pl.sessionHistory),
      ctx.store.sessions.length
        ? table(
            [pl.dayTraining, pl.bestSum, pl.used, pl.runs, pl.timeToBest],
            ctx.store.sessions.map((s) => {
              const sum = sessionSummary(s);
              return [
                date(s.startedAt),
                button(sum.sum, () => ctx.showSessionResult(s), "text-button"),
                percent(sum.used),
                s.games
                  .map((id) => `${games[id].name}: ${s.runsPerGame[id]}`)
                  .join(" · "),
                sum.timeToBest === null ? "–" : formatTime(sum.timeToBest),
              ];
            }),
          )
        : el("p", { className: "subtle" }, pl.noSessions),
    ),
    el(
      "section",
      { className: "panel" },
      el("h2", {}, pl.variants),
      variants.length
        ? table(
            [
              pl.nav.train,
              pl.readingTime,
              pl.firstCorrect,
              pl.firstScore,
              pl.best,
              pl.adaptation,
            ],
            variants.map((v) => [
              games[v.gameId].name,
              v.readingMs === null ? "–" : seconds(v.readingMs),
              v.firstCorrectMs === null ? "–" : seconds(v.firstCorrectMs),
              v.firstScore ?? "–",
              v.best,
              v.ratio === null ? "–" : percent(v.ratio),
            ]),
          )
        : el("p", { className: "subtle" }, pl.none),
      trend.length
        ? el(
            "p",
            {},
            `${pl.adaptationTrend}: ${trend.map((v) => `${date(v.createdAt)}: ${percent(v.ratio)}`).join(" → ")}`,
          )
        : null,
    ),
    el(
      "section",
      { className: "panel data-panel" },
      el("h2", {}, pl.data),
      el("p", { className: "subtle" }, pl.local),
      el(
        "div",
        { className: "actions" },
        button(pl.export, ctx.exportData, "button secondary"),
        button(pl.import, ctx.importData, "button secondary"),
        button(pl.reset, ctx.resetData, "button danger"),
      ),
    ),
  );
}
export function settingsPage(ctx) {
  const settings = ctx.store.settings;
  const toggles = [
    "sounds",
    "reveal",
    "table12",
    "freeExpression",
    "rulesTimeout",
  ].map((key) =>
    el(
      "label",
      { className: "setting-toggle" },
      el("span", {}, pl[key]),
      el("input", {
        type: "checkbox",
        checked: settings[key],
        onChange: (e) => ctx.setting(key, e.target.checked),
      }),
    ),
  );
  const form = el("form", { className: "variant-form" }),
    fields = el("div", { className: "form-grid" });
  let gameId = "dzielnik";
  function paint() {
    const p = parameters(gameId, 1, settings);
    fields.replaceChildren(
      ...Object.entries(knobSchema(gameId)).map(([key, schema]) => {
        let input;
        if (schema.type === "choice")
          input = select(
            schema.options.map((v) => [v, pl.choices[v] ?? v]),
            p[key],
            null,
            { name: key },
          );
        else if (schema.type === "boolean")
          input = el("input", { type: "checkbox", name: key, checked: p[key] });
        else
          input = el("input", {
            type: schema.type === "number" ? "number" : "text",
            name: key,
            value: Array.isArray(p[key])
              ? p[key].join(schema.type === "operators" ? " " : ", ")
              : p[key],
            min: schema.min,
            max: schema.max,
            step: schema.type === "number" ? 1 : null,
            required: true,
          });
        return field(pl.fields[key] ?? key, input);
      }),
    );
  }
  paint();
  form.append(
    field(
      pl.fields.gameId,
      select(
        Object.values(games).map((g) => [g.id, g.name]),
        gameId,
        (value) => {
          gameId = value;
          paint();
        },
      ),
    ),
    fields,
    el("button", { type: "submit", className: "button" }, pl.createVariant),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form),
      params = {};
    for (const [key, s] of Object.entries(knobSchema(gameId))) {
      const value = data.get(key);
      params[key] =
        s.type === "number"
          ? Number(value)
          : s.type === "boolean"
            ? value === "on"
            : s.type === "divisors"
              ? String(value)
                  .split(/[\s,]+/)
                  .filter(Boolean)
                  .map(Number)
              : s.type === "operators"
                ? String(value)
                    .split(/[\s,]+/)
                    .filter(Boolean)
                : value;
    }
    ctx.manualVariant(gameId, params);
  });
  return el(
    "div",
    {},
    heading(pl.settingsTitle, pl.settingsText, pl.nav.settings),
    el(
      "section",
      { className: "panel settings-panel" },
      el(
        "div",
        { className: "form-grid" },
        field(
          pl.preset,
          select(
            [3, 4, 5].map((n) => [n, tr(pl.grade, { n })]),
            settings.grade,
            (v) => ctx.setting("grade", Number(v)),
          ),
        ),
        field(
          pl.keypadSide,
          select(
            [
              ["right", pl.right],
              ["left", pl.left],
            ],
            settings.keypadSide,
            (v) => ctx.setting("keypadSide", v),
          ),
        ),
      ),
      toggles,
    ),
    el(
      "section",
      { className: "panel" },
      el("h2", {}, pl.quickVariant),
      el("p", { className: "subtle" }, pl.quickText),
      form,
    ),
  );
}
