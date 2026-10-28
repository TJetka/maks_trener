import { el, button } from "../../ui/dom.js?v=1.0.1";
import { pl, tr } from "../../i18n/pl.js?v=1.0.1";
export function render(i, api) {
  return {
    node: el(
      "div",
      { className: "game-content" },
      el("p", { className: "board-prompt" }, pl.truthQuestion),
      el("div", { className: "statement" }, i.statement),
      el(
        "div",
        { className: "yes-no" },
        button(["✓ ", pl.yes], () => api.submit(true), "button yes"),
        button(["× ", pl.no], () => api.submit(false), "button no"),
      ),
    ),
    key: (key) => {
      if (["t", "T", "ArrowLeft"].includes(key)) {
        api.submit(true);
        return true;
      }
      if (["n", "N", "ArrowRight"].includes(key)) {
        api.submit(false);
        return true;
      }
      return false;
    },
    reveal: () =>
      api.notice(tr(pl.solution, { answer: i.solution ? pl.yes : pl.no })),
  };
}
