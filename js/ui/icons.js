import { el } from "./dom.js?v=1.0.1";
const paths = {
  train: "M5 5h14v14H5z M9 9h2m-1-1v2m4 0 2-2m-7 6h2m3 0h2m-2 2h2",
  session: "M9 3h6m-3 3v2m6-2 2 2M12 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14m0 3v4l3 1",
  mystery:
    "M8 7a4 4 0 0 1 8 0c0 3-4 3-4 6m0 4v1M4 3l1 1m15-1-1 1M3 15l2-1m14 0 2 1",
  drill: "m13 2-9 12h7l-1 8 10-13h-7z",
  stats: "M4 20h17M7 16v-5m5 5V4m5 12V8",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-2-5h4l1 3 3 1 3 1v4l-3 1-1 3-1 3h-4l-1-3-3-1-3-1v-4l3-1 1-3z",
  home: "m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9",
  arrow: "M4 12h15m-5-5 5 5-5 5",
  trophy:
    "M8 3h8v7a4 4 0 0 1-8 0V3m0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z m-4 9 3 3 5-6",
};
export function icon(name, size = 24) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 1.7,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  }))
    svg.setAttribute(key, String(value));
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[name] ?? paths.train);
  svg.append(path);
  return svg;
}
export const iconBox = (name, color = "mint") =>
  el("span", { className: `icon-box ${color}` }, icon(name, 28));
