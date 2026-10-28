import { pl, tr } from "./i18n/pl.js?v=1.0.1";
import {
  el,
  button,
  heading,
  stat,
  percent,
  seconds,
  metricName,
  numericEditor,
  symbol,
} from "./ui/dom.js?v=1.0.1";
import { icon } from "./ui/icons.js?v=1.0.1";
import {
  shell,
  home,
  training,
  sessionPage,
  sessionResult,
  mysteryPage,
  drillsPage,
  statsPage,
  settingsPage,
} from "./ui/pages.js?v=1.0.1";
import { games, parameters } from "./games/registry.js?v=1.0.1";
import { Run } from "./engine/run.js?v=1.0.1";
import { newSeed, mulberry32, shuffle } from "./engine/rng.js?v=1.0.1";
import { formatTime } from "./engine/clock.js?v=1.0.1";
import { levelPoints } from "./engine/scoring.js?v=1.0.1";
import { Session, sessionSummary } from "./engine/session.js?v=1.0.1";
import { Drill } from "./engine/drill.js?v=1.0.1";
import {
  loadStore,
  saveStore,
  freshStore,
  mergeStores,
  parseImport,
  STORE_KEY,
  serializeStore,
} from "./engine/store.js?v=1.0.1";
import { summarizeRuns, runSummary } from "./engine/stats.js?v=1.0.1";
import {
  randomVariant,
  createVariant,
  validateParams,
} from "./engine/mystery.js?v=1.0.1";
import { render as dzielnik } from "./games/dzielnik/view.js?v=1.0.1";
import { render as dzialanie } from "./games/dzialanie/view.js?v=1.0.1";
import { render as sumuj } from "./games/sumuj/view.js?v=1.0.1";
import { render as wybierz } from "./games/wybierz/view.js?v=1.0.1";
import { render as podziel } from "./games/podziel/view.js?v=1.0.1";
import { render as plusminus } from "./games/plusminus/view.js?v=1.0.1";
import { render as taknie } from "./games/taknie/view.js?v=1.0.1";
import { render as slupek } from "./games/slupek/view.js?v=1.0.1";
import { render as kwadrat } from "./games/kwadrat/view.js?v=1.0.1";
import { render as karuzela } from "./games/karuzela/view.js?v=1.0.1";

const views = {
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
const app = document.querySelector("#app"),
  dialog = document.querySelector("#dialog"),
  toastNode = document.querySelector("#toast");
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("Unavailable");
    },
  };
}
const loaded = loadStore(storage);
let store = loaded.data,
  saveBlocked = !!loaded.error,
  route = "home",
  run = null,
  session = null,
  drill = null,
  view = null,
  pending = null,
  record = null,
  runOptions = {},
  frame = 0,
  toastUntil = 0;
let gameNodes = null,
  drillNodes = null,
  lastSessionSecond = null,
  nudged = false,
  audioContext = null;
const ctx = {
  get store() {
    return store;
  },
  get session() {
    return session;
  },
  go,
  prepare,
  startGame,
  startSession,
  endSession,
  showSessionResult,
  discover,
  startDrill,
  manualVariant,
  setting,
  exportData,
  importData,
  resetData,
  randomGames: (filter) =>
    shuffle(
      mulberry32(newSeed()),
      Object.values(games).filter((g) => filter === "all" || g.tier === filter),
    )
      .slice(0, 2)
      .map((g) => g.id),
};
const pageRenderers = {
  home,
  train: training,
  session: sessionPage,
  mystery: mysteryPage,
  drill: drillsPage,
  stats: statsPage,
  settings: settingsPage,
};

function notice(text, duration = 3500) {
  toastNode.textContent = text;
  toastNode.hidden = false;
  toastUntil = performance.now() + duration;
}
function persist() {
  if (saveBlocked) {
    notice(pl.corruptStore, 7000);
    return;
  }
  if (!saveStore(storage, store)) notice(pl.storageError, 10000);
}
function setting(key, value) {
  store.settings[key] = value;
  persist();
  notice(pl.saved);
}
function modal(title, content, actions = []) {
  const oldFocus = document.activeElement;
  dialog.replaceChildren(
    el(
      "div",
      { className: "dialog-heading" },
      el("h2", { id: "dialog-title" }, title),
      button("×", () => dialog.close(), "icon-button", {
        "aria-label": pl.close,
      }),
    ),
    el("div", { className: "dialog-content" }, content),
    el("div", { className: "actions" }, actions),
  );
  if (!dialog.open) dialog.showModal();
  dialog.addEventListener("close", () => oldFocus?.focus(), { once: true });
}
function contentPage(content, active = route) {
  app.replaceChildren(shell(content, ctx, active));
  document.title = `${pl.nav[active] ?? pl.brand} · ${pl.brand}`;
  document.querySelector("#main")?.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}
function go(next) {
  if (run && !run.state.ended) {
    run.end("quit");
    saveRun();
    run = null;
  }
  if (drill) {
    finishDrill(false);
    drill = null;
  }
  pending = null;
  view = null;
  gameNodes = null;
  drillNodes = null;
  route = pageRenderers[next] ? next : "home";
  history.replaceState(null, "", `#${route}`);
  contentPage(pageRenderers[route](ctx));
}
function prepare(gameId, options = {}) {
  const variant = options.variant;
  if (variant) {
    try {
      validateParams(gameId, variant.params);
    } catch {
      notice(pl.invalidVariant);
      return;
    }
  }
  const params = parameters(
    gameId,
    1,
    variant?.settings ?? store.settings,
    variant?.params ?? {},
  );
  const readAt = performance.now();
  modal(
    games[gameId].name,
    el(
      "div",
      {},
      el(
        "span",
        { className: `game-symbol ${games[gameId].color}` },
        games[gameId].icon,
      ),
      el("p", { className: "rules-copy" }, games[gameId].rulesCard(params)),
      el(
        "p",
        { className: "subtle" },
        options.mode === "mystery" ? pl.timeReading : pl.firstInteraction,
      ),
    ),
    [
      button([pl.readStart, icon("arrow")], () => {
        dialog.close();
        startGame(gameId, {
          ...options,
          readingMs:
            options.mode === "mystery" ? performance.now() - readAt : null,
        });
      }),
    ],
  );
}
function startGame(gameId, options = {}) {
  if (options.mode === "session" && (!session || session.remaining() <= 0)) {
    if (session) endSession();
    return;
  }
  const variant = options.variant;
  runOptions = { ...options };
  try {
    const maxGridSize = Math.max(
      5,
      Math.min(8, Math.floor((document.documentElement.clientWidth - 56) / 47)),
    );
    run = new Run({
      gameId,
      seed: newSeed(),
      mode: options.mode ?? "free",
      settings: { ...(variant?.settings ?? store.settings), maxGridSize },
      overrides: variant?.params ?? {},
      variantId: variant?.id,
      sessionId: options.mode === "session" ? session.data.id : null,
      sessionRemaining:
        options.mode === "session"
          ? () => (session ? session.durationMs - session.clock.elapsed() : 0)
          : () => Infinity,
      readingMs: options.readingMs,
    });
    route = "play";
    pending = null;
    record = null;
    view = null;
    renderGame();
  } catch (error) {
    console.error("Cannot create game", gameId, error.name);
    run = null;
    notice(pl.appError);
    go("train");
  }
}
function rulesAllowed() {
  return (
    !run ||
    run.mode !== "session" ||
    !store.settings.rulesTimeout ||
    session.clock.elapsed() < 120000
  );
}
function showRules() {
  if (!rulesAllowed()) {
    notice(pl.rulesLocked);
    return;
  }
  modal(
    games[run.gameId].name,
    el(
      "p",
      { className: "rules-copy" },
      games[run.gameId].rulesCard(run.params),
    ),
    [button(pl.close, () => dialog.close())],
  );
}
function renderGame() {
  const g = games[run.gameId],
    isLadder = run.state.config.archetype === "ladder";
  gameNodes = {
    score: el("strong", {}, run.state.score),
    timer: el("strong", {}, formatTime(run.remaining())),
    progress: el("div", { className: "timer-fill" }),
    level: el("strong", {}, `${run.state.level} / ${run.state.config.levels}`),
    extra: el("span", { className: "level-points" }),
    feedback: el(
      "div",
      { className: "feedback", role: "status", "aria-live": "polite" },
      pl.firstInteraction,
    ),
    board: el("div", { className: "board-host" }),
    ruleButton: button("?", showRules, "icon-button", {
      "aria-label": pl.rules,
    }),
    sessionInfo: el("div", { className: "session-live" }),
  };
  const timer = el(
    "div",
    { className: "timer-panel" },
    el("span", { className: "stat-label" }, pl.time),
    gameNodes.timer,
    el("div", { className: "timer-track" }, gameNodes.progress),
  );
  const top = el(
    "div",
    { className: "game-top" },
    el(
      "div",
      {},
      el("span", { className: "stat-label" }, pl.score),
      gameNodes.score,
    ),
    timer,
    el(
      "div",
      { className: "level-info" },
      el("span", { className: "stat-label" }, isLadder ? pl.level : pl.strikes),
      gameNodes.level,
      gameNodes.extra,
    ),
  );
  const content = el(
    "div",
    { className: `play-page keypad-${store.settings.keypadSide}` },
    el(
      "div",
      { className: "play-heading" },
      button(
        ["← ", pl.change],
        () => go(run.mode === "session" ? "session" : "train"),
        "text-button",
      ),
      el("h1", {}, g.name),
      gameNodes.ruleButton,
    ),
    run.mode === "session" ? gameNodes.sessionInfo : null,
    el(
      "section",
      { className: "play-panel" },
      top,
      gameNodes.feedback,
      gameNodes.board,
    ),
    el(
      "div",
      { className: "play-footer" },
      el("span", { className: "subtle" }, pl.keyboardHint),
      button(
        pl.quit,
        () => {
          run.end("quit");
          endRun();
        },
        "text-button",
      ),
    ),
  );
  contentPage(
    content,
    run.mode === "session"
      ? "session"
      : run.mode === "mystery"
        ? "mystery"
        : "train",
  );
  renderBoard();
  updateGame();
}
function interact() {
  if (pending || !run || run.state.ended) return false;
  return run.interact();
}
function renderBoard() {
  view = views[run.gameId](run.instance, {
    submit,
    interact,
    notice,
    settings: run.settings,
  });
  gameNodes.board.replaceChildren(view.node);
  gameNodes.feedback.className = "feedback";
  gameNodes.feedback.textContent =
    run.startedAt === null ? pl.firstInteraction : "\u00a0";
}
function sound(correct) {
  if (!store.settings.sounds) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator(),
      gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = correct ? 660 : 240;
    gain.gain.setValueAtTime(0.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.12,
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
  } catch {
    /* Optional sound must never block an answer. */
  }
}
function submit(answer) {
  if (pending || !run || run.state.ended || dialog.open)
    return { ignored: true };
  const result = run.answer(answer);
  if (result.ignored) {
    if (run.state.ended) endRun();
    return result;
  }
  sound(result.correct);
  gameNodes.feedback.className = `feedback ${result.correct ? "success" : "error"}`;
  gameNodes.feedback.textContent = result.correct
    ? result.complete
      ? tr(pl.correct, { n: result.delta })
      : tr(pl.partial, { n: run.instance.find - run.selected.size })
    : run.state.config.archetype === "ladder"
      ? tr(pl.wrong, { n: run.state.config.penalty })
      : tr(pl.strike, {
          n: run.state.strikes,
          max: run.state.config.maxStrikes,
        });
  const reveal =
    !result.correct && run.mode !== "session" && store.settings.reveal;
  if (reveal) view.reveal?.();
  const delay = reveal ? 1200 : result.correct ? 220 : 300;
  pending = {
    until: run.clock.elapsed() + delay,
    next: result.next,
    end: run.state.ended,
    wallUntil: performance.now() + delay,
  };
  gameNodes.board.classList.add(
    result.correct ? "flash-correct" : "flash-wrong",
  );
  updateGame();
  return result;
}
function updateGame() {
  if (!run || !gameNodes) return;
  const remaining = run.remaining(),
    ladder = run.state.config.archetype === "ladder";
  gameNodes.score.textContent = run.state.score;
  gameNodes.timer.textContent = formatTime(remaining);
  gameNodes.timer.parentElement.classList.toggle(
    "urgent",
    remaining <= 5000 && run.startedAt !== null,
  );
  gameNodes.progress.style.transform = `scaleX(${remaining / (run.state.config.seconds * 1000)})`;
  gameNodes.level.textContent = ladder
    ? `${Math.min(run.state.level, run.state.config.levels)} / ${run.state.config.levels}`
    : `${"●".repeat(run.state.strikes)}${"○".repeat(Math.max(0, run.state.config.maxStrikes - run.state.strikes))}`;
  gameNodes.level.setAttribute(
    "aria-label",
    ladder
      ? `${pl.level} ${run.state.level}`
      : `${pl.strikes}: ${run.state.strikes} / ${run.state.config.maxStrikes}`,
  );
  gameNodes.extra.textContent = ladder
    ? tr(pl.points, { n: levelPoints(run.state) })
    : `${pl.level} ${run.state.level}`;
  gameNodes.ruleButton.disabled = !rulesAllowed();
  if (!rulesAllowed() && dialog.open) dialog.close();
  if (run.mode === "session" && session) {
    const s = sessionSummary(session.data);
    gameNodes.sessionInfo.textContent = `${pl.sessionLeft} ${formatTime(session.remaining())}  ·  ${session.data.games.map((id) => `${games[id].name}: ${session.data.bests[id]}`).join("  +  ")}  ·  ${pl.bestSum}: ${s.sum}`;
  }
  view?.update?.(run.clock.elapsed() - run.levelStarted);
}
function saveRun() {
  if (!run || record) return;
  record = run.record();
  store.runs.push(record);
  if (run.mode === "session" && session) session.addRun(record);
  persist();
}
function endRun() {
  if (!run) return;
  pending = null;
  saveRun();
  if (dialog.open) dialog.close();
  if (run.mode === "session" && session.remaining() <= 0) {
    run = null;
    endSession();
    return;
  }
  const r = record,
    s = summarizeRuns([r]),
    best = summarizeRuns(
      store.runs.filter(
        (x) => x.gameId === r.gameId && x.variantId === r.variantId,
      ),
    ).best;
  route = "result";
  view = null;
  gameNodes = null;
  const next = () => startGame(r.gameId, runOptions);
  const content = el(
    "div",
    { className: "result-page" },
    heading(
      pl.endTitles[r.endReason] ?? pl.endTitles.quit,
      pl.endText,
      games[r.gameId].name,
    ),
    el(
      "section",
      { className: "panel result-hero" },
      icon("trophy", 48),
      el("div", { className: "result-score" }, r.score),
      el("p", {}, pl.score),
      el("span", { className: "best-pill" }, `${pl.best}: ${best}`),
    ),
    el(
      "div",
      { className: "result-stats" },
      stat(pl.levels, r.levelsReached),
      stat(pl.accuracy, percent(s.accuracy)),
      stat(pl.median, seconds(s.medianMs)),
      stat(pl.totalTime, formatTime(r.durationMs)),
    ),
    r.mode === "mystery"
      ? el(
          "div",
          { className: "stat-row" },
          stat(pl.readingTime, seconds(r.readingMs ?? 0)),
          stat(
            pl.firstCorrect,
            r.firstCorrectMs === null ? "–" : seconds(r.firstCorrectMs),
          ),
        )
      : null,
    el(
      "div",
      { className: "actions" },
      button([pl.restart, icon("arrow")], next),
      button(
        r.mode === "session" ? pl.sessionReturn : pl.change,
        () => {
          run = null;
          go(r.mode === "session" ? "session" : "train");
        },
        "button secondary",
      ),
    ),
  );
  contentPage(content, r.mode === "session" ? "session" : "train");
  view = {
    key: (key) => {
      if (key.toLowerCase() === "r") {
        next();
        return true;
      }
      return false;
    },
  };
  maybeNudge();
}
function startSession(chosen) {
  session = new Session([...chosen]);
  lastSessionSecond = null;
  go("session");
}
function endSession() {
  if (!session) return;
  if (run && !record) {
    run.tick();
    if (!run.state.ended) run.end("session");
    saveRun();
  }
  run = null;
  pending = null;
  view = null;
  gameNodes = null;
  const data = session.finish();
  store.sessions.push(data);
  session = null;
  persist();
  showSessionResult(data);
}
function showSessionResult(data) {
  route = "session-result";
  contentPage(sessionResult(data, ctx), "session");
}
function discover(gameId) {
  const variant = randomVariant(newSeed(), gameId, store.settings);
  store.variants[variant.id] = variant;
  persist();
  prepare(variant.gameId, { mode: "mystery", variant });
}
function manualVariant(gameId, params) {
  try {
    const variant = createVariant(gameId, params, store.settings);
    store.variants[variant.id] = variant;
    persist();
    prepare(gameId, { mode: "mystery", variant });
  } catch {
    notice(pl.invalidVariant, 6000);
  }
}
function startDrill(type, focus = null) {
  if (run && !run.state.ended) {
    run.end("quit");
    saveRun();
  }
  run = null;
  pending = null;
  drill = new Drill(type, store.runs, newSeed(), {
    max: store.settings.table12 ? 12 : 10,
    focus,
  });
  route = "drilling";
  drillNodes = {
    board: el("div", { className: "board-host" }),
    progress: el("strong"),
    time: el("span", { className: "badge" }),
    feedback: el(
      "p",
      { className: "feedback", role: "status", "aria-live": "polite" },
      "\u00a0",
    ),
  };
  contentPage(
    el(
      "div",
      { className: `play-page keypad-${store.settings.keypadSide}` },
      heading(pl.drillTypes[type][0], pl.drillText, pl.nav.drill),
      el(
        "section",
        { className: "play-panel" },
        el(
          "div",
          { className: "drill-top" },
          drillNodes.progress,
          drillNodes.time,
        ),
        drillNodes.feedback,
        drillNodes.board,
      ),
      button(
        pl.quit,
        () => {
          finishDrill(false);
          go("drill");
        },
        "text-button",
      ),
    ),
    "drill",
  );
  renderDrillItem();
}
function renderDrillItem() {
  const i = drill.items[drill.index];
  drillNodes.progress.textContent = tr(pl.drillProgress, {
    n: drill.index + 1,
  });
  drillNodes.feedback.textContent = "\u00a0";
  if (i.kind === "number") {
    const editor = numericEditor([pl.input], (values) =>
      submitDrill(values[0]),
    );
    view = { key: editor.key };
    drillNodes.board.replaceChildren(
      el(
        "div",
        { className: "game-content" },
        el("div", { className: "big-expression" }, i.prompt),
        editor.node,
      ),
    );
  } else if (i.kind === "operator") {
    view = {
      key: (key) => {
        const op = { x: "*", "×": "*", "−": "-" }[key] ?? key;
        if (i.options.includes(op)) {
          submitDrill(op);
          return true;
        }
        return false;
      },
    };
    drillNodes.board.replaceChildren(
      el(
        "div",
        { className: "game-content" },
        el("div", { className: "big-expression" }, i.prompt),
        el(
          "div",
          { className: "palette" },
          i.options.map((op) =>
            button(symbol(op), () => submitDrill(op), "token"),
          ),
        ),
      ),
    );
  } else {
    const selected = new Set();
    const choices = i.divisors.map((d) =>
      button(
        d,
        (event) => {
          selected.has(d) ? selected.delete(d) : selected.add(d);
          event.currentTarget.classList.toggle("selected", selected.has(d));
          event.currentTarget.setAttribute(
            "aria-pressed",
            String(selected.has(d)),
          );
        },
        "token",
        { "aria-pressed": "false" },
      ),
    );
    const submit = () => submitDrill([...selected]);
    view = {
      key: (key) => {
        if (key === "Enter") {
          submit();
          return true;
        }
        return false;
      },
    };
    drillNodes.board.replaceChildren(
      el(
        "div",
        { className: "game-content" },
        el("p", { className: "board-prompt" }, pl.allDivisors),
        el("div", { className: "big-target" }, i.n),
        el("div", { className: "palette" }, choices),
        button(pl.confirm, submit),
      ),
    );
  }
}
function submitDrill(answer) {
  if (pending || !drill) return;
  const result = drill.answer(answer);
  if (!result) return;
  sound(result.correct);
  drillNodes.feedback.className = `feedback ${result.correct ? "success" : "error"}`;
  drillNodes.feedback.textContent = result.correct
    ? tr(pl.correct, { n: 1 })
    : tr(pl.solution, {
        answer: Array.isArray(result.item.solution)
          ? result.item.solution.join(", ")
          : symbol(result.item.solution),
      });
  pending = {
    drill: true,
    until: drill.clock.elapsed() + (result.correct ? 220 : 1200),
    done: result.done,
  };
}
function finishDrill(show = true) {
  if (!drill) return;
  const r = drill.record();
  if (r.levelsReached) {
    store.runs.push(r);
    persist();
  }
  drill = null;
  view = null;
  pending = null;
  drillNodes = null;
  if (!show) return;
  route = "drill-result";
  const slow = [...r.events]
    .sort((a, b) => b.responseMs - a.responseMs)
    .slice(0, 3);
  contentPage(
    el(
      "div",
      {},
      heading(pl.drillEnd, pl.endText, pl.nav.drill),
      el(
        "section",
        { className: "panel result-hero" },
        icon("drill", 48),
        el("div", { className: "result-score" }, `${r.score} / 20`),
        el("p", {}, `${pl.accuracy}: ${percent(runSummary(r).correct / 20)}`),
      ),
      el(
        "section",
        { className: "panel" },
        el("h2", {}, pl.slowest),
        slow.map((e) =>
          el(
            "p",
            {},
            `${metricName(e.itemSignature)} · ${seconds(e.responseMs)}`,
          ),
        ),
      ),
      el(
        "div",
        { className: "actions" },
        button(pl.restart, () => startDrill(r.variantId.split(":")[1])),
        button(pl.nav.stats, () => go("stats"), "button secondary"),
      ),
    ),
    "drill",
  );
  maybeNudge();
}
function maybeNudge() {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const ms = store.runs
    .filter((r) => r.startedAt >= day.getTime() && r.mode !== "session")
    .reduce((n, r) => n + r.durationMs, 0);
  if (ms >= 25 * 60000 && !nudged) {
    nudged = true;
    notice(`${pl.nudge} ${pl.nudgeText}`, 12000);
  }
}
function download(text) {
  const blob = new Blob([text], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    link = el("a", {
      href: url,
      download: `makstrener-${new Date().toISOString().slice(0, 10)}.json`,
    });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportData() {
  if (saveBlocked) {
    try {
      download(storage.getItem(STORE_KEY) ?? JSON.stringify(store));
    } catch {
      notice(pl.storageError);
    }
    return;
  }
  try {
    download(serializeStore(store));
  } catch {
    download(JSON.stringify(store));
  }
}
function importData() {
  const input = el("input", { type: "file", accept: ".json,application/json" });
  input.addEventListener("change", async () => {
    try {
      const file = input.files[0];
      if (
        !file ||
        !file.name.toLowerCase().endsWith(".json") ||
        file.size > 8 * 1024 * 1024
      )
        throw new Error("Invalid file");
      const incoming = parseImport(await file.text());
      for (const variant of Object.values(incoming.variants))
        validateParams(variant.gameId, variant.params);
      store = mergeStores(store, incoming);
      go("stats");
      if (saveBlocked) notice(pl.corruptStore, 7000);
      else if (saveStore(storage, store)) notice(pl.importOk);
      else notice(pl.storageError, 10000);
    } catch {
      notice(pl.importError, 7000);
    }
  });
  input.click();
}
function resetData() {
  modal(pl.reset, el("p", {}, pl.resetQuestion), [
    button(pl.cancel, () => dialog.close(), "button secondary"),
    button(
      pl.resetConfirm,
      () => {
        dialog.close();
        store = freshStore();
        saveBlocked = false;
        persist();
        go("stats");
      },
      "button danger",
    ),
  ]);
}

document.addEventListener("keydown", (event) => {
  if (
    dialog.open ||
    event.altKey ||
    event.metaKey ||
    event.ctrlKey ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)
  )
    return;
  if (event.key === "Escape") return;
  if (view?.key?.(event.key)) event.preventDefault();
});
document.addEventListener("visibilitychange", () => {
  run?.visibility(document.hidden);
  if (drill) {
    if (document.hidden) drill.clock.pause();
    else drill.clock.resume();
  }
  if (session)
    session.data.visibilityEvents.push({
      t: session.clock.elapsed(),
      hidden: document.hidden,
    });
  if (!document.hidden) {
    run?.tick();
    if (run?.state.ended && route === "play") endRun();
    if (session?.remaining() <= 0) endSession();
  }
});
window.addEventListener("hashchange", () => {
  if (!["play", "drilling"].includes(route)) go(location.hash.slice(1));
});
function animate() {
  const now = performance.now();
  if (!toastNode.hidden && now >= toastUntil) toastNode.hidden = true;
  if (session && session.remaining() <= 0) {
    endSession();
  } else if (run && route === "play") {
    run.tick();
    if (run.state.ended && !pending) endRun();
    else {
      updateGame();
      if (
        pending &&
        !pending.drill &&
        (run.state.ended
          ? now >= pending.wallUntil
          : run.clock.elapsed() >= pending.until)
      ) {
        const p = pending;
        pending = null;
        if (run.state.ended || p.end) endRun();
        else {
          gameNodes.board.classList.remove("flash-correct", "flash-wrong");
          if (p.next) {
            run.next();
            renderBoard();
          } else if (!p.next) {
            gameNodes.feedback.textContent = "\u00a0";
          }
        }
      }
    }
  }
  if (drill && route === "drilling") {
    drillNodes.time.textContent = formatTime(drill.clock.elapsed());
    if (pending?.drill && drill.clock.elapsed() >= pending.until) {
      const p = pending;
      pending = null;
      if (p.done) finishDrill();
      else {
        drill.next();
        renderDrillItem();
      }
    }
  }
  if (session && route === "session") {
    const second = Math.ceil(session.remaining() / 1000);
    if (second !== lastSessionSecond) {
      lastSessionSecond = second;
      const node = document.querySelector(".session-banner .stat strong");
      if (node) node.textContent = formatTime(session.remaining());
    }
    if (store.settings.rulesTimeout && session.clock.elapsed() >= 120000)
      document.querySelectorAll(".session-game .rules-copy").forEach((node) => {
        node.textContent = pl.rulesLocked;
      });
  }
  frame = requestAnimationFrame(animate);
}
window.addEventListener("pagehide", () => {
  if (run && !run.state.ended) {
    run.end("quit");
    saveRun();
  }
  if (drill) finishDrill(false);
  if (session) {
    store.sessions.push(session.finish());
    session = null;
    persist();
  }
  cancelAnimationFrame(frame);
});
go(location.hash.slice(1) || "home");
if (loaded.error) notice(pl.corruptStore, 12000);
frame = requestAnimationFrame(animate);
