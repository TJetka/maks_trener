import { el, button } from "../../ui/dom.js?v=1.1.0";
import { pl, tr } from "../../i18n/pl.js?v=1.1.0";
export function render(i, api) {
  let selected = new Set();
  const rows = [];
  function paint() {
    rows.forEach((row, j) => {
      row.classList.toggle("selected", selected.has(j));
      row.setAttribute("aria-pressed", String(selected.has(j)));
      row.firstChild.textContent = selected.has(j) ? "✓" : "○";
    });
  }
  const table = el(
    "div",
    { className: "product-table", style: { "--cols": i.board[0].length } },
    i.board.map((row, j) => {
      const node = button(
        "",
        () => {
          api.interact();
          selected.has(j) ? selected.delete(j) : selected.add(j);
          paint();
        },
        "product-row",
        { "aria-label": tr(pl.row, { n: j + 1 }), "aria-pressed": "false" },
      );
      node.append(el("span", {}, "○"), ...row.map((n) => el("span", {}, n)));
      rows.push(node);
      return node;
    }),
    el(
      "div",
      { className: "product-target" },
      el("span", {}, "="),
      i.targets.map((n) => el("span", {}, n)),
    ),
  );
  function submit() {
    if (!selected.size) return;
    const result = api.submit([...selected]);
    if (result && !result.correct && !result.ignored) {
      selected.clear();
      paint();
    }
  }
  return {
    node: el(
      "div",
      { className: "game-content" },
      el("p", { className: "board-prompt" }, pl.rows),
      el(
        "p",
        { className: "subtle" },
        i.operation === "product" ? pl.productGoal : pl.sumGoal,
      ),
      table,
      button(pl.confirm, submit),
    ),
    key: (key) => {
      if (key === "Enter") {
        submit();
        return true;
      }
      return false;
    },
    reveal: () => i.solution.forEach((j) => rows[j].classList.add("solution")),
  };
}
