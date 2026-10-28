import { el, button } from "../../ui/dom.js?v=1.1.0";
import { pl, tr } from "../../i18n/pl.js?v=1.1.0";
export function render(i, api) {
  const values = i.blanks.map(() => null),
    cells = [];
  let active = 0;
  const palette = el("div", { className: "palette" });
  function paint() {
    cells.forEach((c, j) => {
      c.textContent = values[j] ?? "?";
      c.classList.toggle("active", active === j);
    });
    palette.replaceChildren(
      ...i.palette.map((n) =>
        button(
          n,
          () => {
            api.interact();
            values[active] = n;
            const next = values.indexOf(null);
            if (next >= 0) active = next;
            paint();
          },
          "token",
          {
            disabled:
              values.filter((v) => v === n).length >=
              i.palette.filter((v) => v === n).length,
          },
        ),
      ),
    );
  }
  const board = el("div", {
    className: "square-board",
    style: { "--cols": i.size + 1 },
  });
  for (let r = 0; r < i.size; r++) {
    for (let c = 0; c < i.size; c++) {
      const index = r * i.size + c,
        j = i.blanks.indexOf(index);
      if (j >= 0) {
        const cell = button(
          "?",
          () => {
            api.interact();
            active = j;
            values[j] = null;
            paint();
          },
          "cell",
          { "aria-label": tr(pl.blank, { n: j + 1 }) },
        );
        cells[j] = cell;
        board.append(cell);
      } else
        board.append(el("span", { className: "cell fixed" }, i.board[index]));
    }
    board.append(
      el(
        "span",
        { className: "total" },
        i.totals === "columns" ? "" : i.rowTotals[r],
      ),
    );
  }
  i.colTotals.forEach((n) =>
    board.append(
      el("span", { className: "total" }, i.totals === "rows" ? "" : n),
    ),
  );
  board.append(el("span"));
  function submit() {
    if (values.every((v) => v !== null)) api.submit([...values]);
    else api.notice(pl.emptyAnswer);
  }
  paint();
  return {
    node: el(
      "div",
      { className: "game-content" },
      el("p", { className: "board-prompt" }, pl.square),
      board,
      i.diagonals
        ? el(
            "p",
            { className: "subtle" },
            `↘ ${i.diagonalTotals[0]} · ↙ ${i.diagonalTotals[1]}`,
          )
        : null,
      palette,
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
      i.solution.forEach((n, j) => {
        cells[j].textContent = n;
        cells[j].classList.add("solution");
      }),
  };
}
