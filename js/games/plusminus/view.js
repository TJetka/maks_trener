import { el, button, symbol } from "../../ui/dom.js?v=1.0.1";
import { pl, tr } from "../../i18n/pl.js?v=1.0.1";
export function render(i, api) {
  const signs = i.numbers.slice(1).map(() => i.allowed[0]);
  const expression = el(
    "div",
    { className: "expression" },
    i.numbers.flatMap((n, j) =>
      j
        ? [
            button(
              symbol(signs[j - 1]),
              (e) => {
                api.interact();
                signs[j - 1] =
                  i.allowed[
                    (i.allowed.indexOf(signs[j - 1]) + 1) % i.allowed.length
                  ];
                e.currentTarget.textContent = symbol(signs[j - 1]);
              },
              "slot operator",
              { "aria-label": tr(pl.operatorSlot, { n: j }) },
            ),
            el("span", {}, n),
          ]
        : [el("span", {}, n)],
    ),
  );
  function submit() {
    api.submit([...signs]);
  }
  return {
    node: el(
      "div",
      { className: "game-content" },
      el("p", { className: "board-prompt" }, pl.signs),
      expression,
      el("div", { className: "big-target" }, `= ${i.target}`),
      button(pl.confirm, submit),
    ),
    key: (key) => {
      if (key === "Enter") {
        submit();
        return true;
      }
      return false;
    },
    reveal: () =>
      api.notice(
        tr(pl.solution, {
          answer: i.numbers
            .map((n, j) => `${j ? ` ${symbol(i.solution[j - 1])} ` : ""}${n}`)
            .join(""),
        }),
      ),
  };
}
