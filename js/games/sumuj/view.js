import { el, button } from "../../ui/dom.js?v=1.0.1";
import { orientations } from "../shared.js?v=1.0.1";
import { pl } from "../../i18n/pl.js?v=1.0.1";
export function render(i, api) {
  let rotation = 0;
  const shapes = orientations(i.shape, i.rotations),
    preview = el("div", { className: "shape-preview" });
  function paint() {
    const shape = shapes[rotation],
      minY = Math.min(...shape.map((p) => p[0])),
      minX = Math.min(...shape.map((p) => p[1])),
      width = Math.max(...shape.map((p) => p[1])) - minX + 1;
    const height = Math.max(...shape.map((p) => p[0])) - minY + 1;
    preview.style.gridTemplateColumns = `repeat(${width},24px)`;
    preview.replaceChildren(
      ...Array.from({ length: height * width }, (_, j) => {
        const y = Math.floor(j / width) + minY,
          x = (j % width) + minX,
          on = shape.some((p) => p[0] === y && p[1] === x);
        return el(
          "span",
          { className: on ? "shape-cell" : "shape-empty" },
          y === 0 && x === 0 ? "●" : "",
        );
      }),
    );
  }
  paint();
  const board = el(
    "div",
    { className: "number-grid sum-grid", style: { "--cols": String(i.size) } },
    i.board.map((n, anchor) =>
      button(n, () => api.submit({ anchor, rotation }), "cell"),
    ),
  );
  return {
    node: el(
      "div",
      { className: "game-content" },
      el("p", { className: "board-prompt" }, pl.shape),
      el(
        "div",
        { className: "shape-goal" },
        preview,
        el("span", {}, "→"),
        el("div", { className: "big-target" }, i.target),
      ),
      el(
        "p",
        { className: "subtle" },
        i.rotations ? pl.rotationHint : pl.shapeHint,
      ),
      i.rotations
        ? button(
            pl.rotate,
            () => {
              api.interact();
              rotation = (rotation + 1) % shapes.length;
              paint();
            },
            "button secondary small",
          )
        : null,
      el("div", { className: "board-scroll" }, board),
    ),
    reveal: () => {
      rotation = i.solution.rotation;
      paint();
      const shape = shapes[rotation];
      for (const [y, x] of shape)
        board.children[i.solution.anchor + y * i.size + x].classList.add(
          "solution",
        );
    },
  };
}
