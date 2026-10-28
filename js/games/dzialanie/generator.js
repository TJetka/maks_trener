import { int, pick, shuffle } from "../../engine/rng.js?v=1.1.0";
import {
  evaluate,
  expressionTokens,
  usesPalette,
} from "../../engine/math.js?v=1.1.0";
import { ladder, relaxed } from "../shared.js?v=1.1.0";
import { gameRules } from "../../i18n/pl.js?v=1.1.0";
export const difficulty = (l) =>
  ladder({
    numberSlots: l <= 12 ? 2 : l <= 17 ? 3 : 4,
    operators: l <= 6 ? ["+", "-"] : ["+", "-", "*", "/"],
    max: l <= 6 ? 99 : 10,
    brackets: l >= 18,
    distractors: 2,
    prefill: "none",
  });
export function generate(level, params, rng) {
  const p = { ...difficulty(level), ...params };
  let numbers, operators, target;
  for (let attempt = 0; attempt < 201; attempt++) {
    numbers = Array.from({ length: p.numberSlots }, () =>
      int(rng, p.minOperand ?? 1, p.max),
    );
    operators = Array.from({ length: p.numberSlots - 1 }, () =>
      pick(rng, p.operators),
    );
    if (numbers.length === 2 && operators[0] === "/") numbers[0] *= numbers[1];
    if (
      ((p.requireMixed && p.numberSlots >= 3) ||
        (level >= 13 && level <= 17 && p.numberSlots === 3)) &&
      p.operators.includes("*") &&
      p.operators.includes("+")
    ) {
      operators[0] = "+";
      operators[1] = "*";
    }
    if (attempt === 200) {
      relaxed("dzialanie", p);
      numbers.fill(1);
      operators.fill(p.operators.find((o) => o !== "-") ?? "-");
      if (operators[0] === "-") numbers[0] = p.numberSlots;
    }
    target = evaluate(expressionTokens(numbers, operators, p.brackets));
    if (target !== null && target <= (level <= 6 ? 200 : 1000)) break;
  }
  const palette = shuffle(rng, [
    ...numbers,
    ...Array.from({ length: p.distractors }, () => int(rng, 1, p.max)),
  ]);
  return {
    numbers,
    operators,
    palette,
    allowed: p.operators,
    brackets: p.brackets,
    prefill: p.prefill,
    target,
    solution: { numbers, operators },
    itemSignature:
      numbers.length === 2 && operators[0] === "/"
        ? `div:${numbers[1]}x${target}`
        : operators.includes("*") && numbers.length === 2
          ? `mul:${numbers[0]}x${numbers[1]}`
          : "expr:precedence",
  };
}
export function check(i, a) {
  if (a?.tokens) {
    const nums = a.tokens.filter((t) => typeof t === "number");
    return {
      correct:
        nums.length === i.numbers.length &&
        usesPalette(nums, i.palette) &&
        a.tokens.every(
          (t) =>
            typeof t === "number" ||
            i.allowed.includes(t) ||
            (i.brackets && ["(", ")"].includes(t)),
        ) &&
        evaluate(a.tokens) === i.target,
    };
  }
  if (
    !a ||
    a.numbers?.length !== i.numbers.length ||
    a.operators?.length !== i.operators.length
  )
    return { correct: false };
  const fixed =
    (i.prefill !== "numbers" ||
      a.numbers.every((n, j) => n === i.numbers[j])) &&
    (i.prefill !== "operators" ||
      a.operators.every((o, j) => o === i.operators[j]));
  return {
    correct:
      fixed &&
      usesPalette(a.numbers, i.palette) &&
      a.operators.every((o) => i.allowed.includes(o)) &&
      evaluate(expressionTokens(a.numbers, a.operators, i.brackets)) ===
        i.target,
  };
}
export const rulesCard = (p) => gameRules("dzialanie", p);
