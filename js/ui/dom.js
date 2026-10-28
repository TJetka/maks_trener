import { pl, tr } from "../i18n/pl.js?v=1.1.0";
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith("on"))
      node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "className") node.className = value;
    else if (key === "style" && typeof value === "object") {
      for (const [property, setting] of Object.entries(value)) {
        if (property.startsWith("--"))
          node.style.setProperty(property, String(setting));
        else node.style[property] = setting;
      }
    } else if (key === "checked" || key === "disabled" || key === "hidden")
      node[key] = Boolean(value);
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity))
    if (child !== null && child !== undefined && child !== false)
      node.append(
        child instanceof Node ? child : document.createTextNode(String(child)),
      );
  return node;
}
export const button = (text, action, cls = "button", attrs = {}) =>
  el(
    "button",
    { type: "button", className: cls, onClick: action, ...attrs },
    text,
  );
export const symbol = (op) => ({ "*": "×", "/": "÷", "-": "−" })[op] ?? op;
export const percent = (n) => `${Math.round(n * 100)}%`;
export const seconds = (ms) =>
  `${(ms / 1000).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} ${pl.secondsUnit}`;
export const date = (ms) =>
  new Date(ms).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
export function stat(label, value, extra = "") {
  return el(
    "div",
    { className: "stat" },
    el("span", { className: "stat-label" }, label),
    el("strong", {}, value),
    extra ? el("small", {}, extra) : null,
  );
}
export const heading = (title, description, eyebrow) =>
  el(
    "div",
    { className: "page-heading" },
    eyebrow ? el("p", { className: "eyebrow" }, eyebrow) : null,
    el("h1", {}, title),
    description ? el("p", { className: "subtle" }, description) : null,
  );
export function field(label, input) {
  return el("label", { className: "field" }, el("span", {}, label), input);
}
export function select(options, value, onChange, attrs = {}) {
  const node = el(
    "select",
    { onChange: (e) => onChange?.(e.target.value), ...attrs },
    options.map(([id, label]) => el("option", { value: id }, label)),
  );
  node.value = String(value);
  return node;
}
export function metricName(signature) {
  const fact = signature.match(/^(mul|div):(\d+)x(\d+)$/);
  if (fact)
    return fact[1] === "mul"
      ? `${fact[2]} × ${fact[3]}`
      : `${Number(fact[2]) * Number(fact[3])} ÷ ${fact[2]}`;
  const divisibility = signature.match(/^div(\d+):/);
  if (divisibility) return tr(pl.divisibilityName, { n: divisibility[1] });
  return pl.families[signature.split(":")[0]] ?? pl.nav.drill;
}
export function keypad(onKey) {
  return el(
    "div",
    { className: "keypad", role: "group", "aria-label": pl.input },
    [1, 2, 3, 4, 5, 6, 7, 8, 9, "Backspace", 0, "Enter"].map((key) =>
      button(
        key === "Backspace" ? "⌫" : key === "Enter" ? "OK" : key,
        () => onKey(String(key)),
        `key ${key === "Enter" ? "key-ok" : ""}`,
        {
          "aria-label":
            key === "Backspace"
              ? pl.undo
              : key === "Enter"
                ? pl.confirm
                : tr(pl.digit, { n: key }),
        },
      ),
    ),
  );
}
export function numericEditor(
  labels,
  onSubmit,
  onInteract = () => {},
  maxDigits = 4,
) {
  const values = labels.map(() => ""),
    nodes = [];
  let active = 0;
  function paint() {
    nodes.forEach((node, i) => {
      node.textContent = values[i] || "…";
      node.classList.toggle("active", i === active);
    });
  }
  function key(value) {
    onInteract();
    if (value === "Enter") {
      const next = values.findIndex((v) => v === "");
      if (next >= 0) {
        active = next;
        paint();
        return;
      }
      onSubmit(values.map(Number));
    } else if (value === "Backspace")
      values[active] = values[active].slice(0, -1);
    else if (/^\d$/.test(value) && values[active].length < maxDigits)
      values[active] += value;
    else if (value === "Tab" || value === "ArrowRight")
      active = (active + 1) % values.length;
    else return false;
    paint();
    return true;
  }
  const fields = el(
    "div",
    { className: "number-fields" },
    labels.map((label, i) => {
      const node = button(
        "…",
        () => {
          onInteract();
          active = i;
          paint();
        },
        "answer-field",
        { "aria-label": label },
      );
      nodes.push(node);
      return el(
        "div",
        {},
        el("span", { className: "field-label" }, label),
        node,
      );
    }),
  );
  paint();
  return {
    node: el("div", { className: "numeric-editor" }, fields, keypad(key)),
    key,
  };
}
