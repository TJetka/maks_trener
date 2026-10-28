/** Safe arithmetic parser. Only integer literals, four operations and brackets. */
export function evaluate(tokens) {
  if (!Array.isArray(tokens) || !tokens.length || tokens.length > 40) return null;
  let at = 0;
  function atom() {
    const token = tokens[at++];
    if (token === '(') {
      const value = expression();
      if (tokens[at++] !== ')') throw new Error('bracket');
      return value;
    }
    if (typeof token !== 'number' || !Number.isSafeInteger(token) || token < 0) throw new Error('number');
    return token;
  }
  function apply(a, op, b) {
    const value = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('integer');
    return value;
  }
  function product() {
    let value = atom();
    while (['*', '/'].includes(tokens[at])) { const op = tokens[at++]; value = apply(value, op, atom()); }
    return value;
  }
  function expression() {
    let value = product();
    while (['+', '-'].includes(tokens[at])) { const op = tokens[at++]; value = apply(value, op, product()); }
    return value;
  }
  try { const value = expression(); return at === tokens.length ? value : null; } catch { return null; }
}
export function expressionTokens(numbers, operators, brackets = false) {
  const tokens = numbers.flatMap((n, i) => i ? [operators[i - 1], n] : [n]);
  if (brackets) { tokens.unshift('('); tokens.splice(4, 0, ')'); }
  return tokens;
}
export const total = values => values.reduce((a, b) => a + b, 0);
export const product = values => values.reduce((a, b) => a * b, 1);
export const median = values => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function subsets(length, min = 1, max = length) {
  const result = [];
  for (let mask = 1; mask < 2 ** length; mask++) {
    const indices = Array.from({length}, (_, i) => i).filter(i => mask & (1 << i));
    if (indices.length >= min && indices.length <= max) result.push(indices);
  }
  return result;
}
export function assignments(values, count) {
  if (!count) return [[]];
  return values.flatMap(value => assignments(values, count - 1).map(rest => [value, ...rest]));
}
export function usesPalette(numbers, palette) {
  const rest = [...palette];
  return numbers.every(n => { const i = rest.indexOf(n); if (i < 0) return false; rest.splice(i, 1); return true; });
}
