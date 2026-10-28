import test from "node:test";
import assert from "node:assert/strict";
import { games } from "../js/games/registry.js";
import { mulberry32 } from "../js/engine/rng.js";
import { evaluate, expressionTokens } from "../js/engine/math.js";
import { placements } from "../js/games/sumuj/generator.js";
import { solutions as rowSolutions } from "../js/games/wybierz/generator.js";
import { solutions as columnSolutions } from "../js/games/slupek/generator.js";
import { solutions as squareSolutions } from "../js/games/kwadrat/generator.js";
import { subsets } from "../js/engine/math.js";

test("generators have bounded constructive fallbacks with a degenerate random source", (t) => {
  t.mock.method(console, "warn", () => {});
  for (const id of ["sumuj", "wybierz", "plusminus", "dzialanie"]) {
    const g = games[id],
      instance = g.generate(20, {}, () => 0);
    assert.ok(g.check(instance, instance.solution).correct);
    if (id === "sumuj")
      assert.equal(
        placements(instance).filter((x) => x.value === instance.target).length,
        1,
      );
    if (id === "wybierz") assert.equal(rowSolutions(instance).length, 1);
  }
  for (const indices of subsets(3))
    for (const blanks of [2, 3, 4]) {
      const operators = indices.map((j) => ["+", "-", "*"][j]);
      const instance = games.plusminus.generate(
        20,
        { operators, blanks },
        () => 0,
      );
      assert.ok(games.plusminus.check(instance, instance.solution).correct);
    }
});

for (const game of Object.values(games)) {
  test(`${game.id}: 10,000 seeded solvable instances, ramps and uniqueness`, () => {
    for (let seed = 0; seed < 10000; seed++) {
      const level = 1 + (seed % game.difficulty(1).levels);
      const p = game.difficulty(level),
        i = game.generate(level, p, mulberry32(seed));
      assert.equal(typeof i.itemSignature, "string");
      if (seed < 30)
        assert.deepEqual(i, game.generate(level, p, mulberry32(seed)));
      if (game.id === "dzielnik") {
        assert.equal(i.board.length, p.cells);
        assert.ok(i.solution.length >= 2 && i.solution.length <= 4);
        assert.ok(i.board.every((n) => n >= p.min && n <= p.max));
        assert.ok(i.solution.every((a) => game.check(i, a).correct));
        assert.ok(
          i.board.some(
            (n) =>
              n % i.divisor !== 0 &&
              (i.divisor === 6
                ? n % 3 === 0 || n % 2 === 0
                : n % i.divisor === 1 || n % i.divisor === i.divisor - 1),
          ),
        );
      } else
        assert.ok(game.check(i, i.solution).correct, `${game.id} seed ${seed}`);
      if (game.id === "sumuj")
        assert.equal(
          placements(i).filter((x) => x.value === i.target).length,
          1,
        );
      if (game.id === "wybierz") {
        assert.equal(rowSolutions(i).length, 1);
        assert.ok(i.targets.every((n) => n <= 729));
      }
      if (game.id === "slupek") {
        assert.equal(columnSolutions(i).length, 1);
        assert.equal(i.blanks.length, p.blanks);
      }
      if (game.id === "kwadrat") {
        assert.equal(squareSolutions(i).length, 1);
        assert.equal(i.blanks.length, p.blanks);
      }
      if (game.id === "karuzela") {
        assert.ok(
          i.intermediates.every(
            (n) => Number.isInteger(n) && n >= 0 && n <= p.max,
          ),
        );
        assert.equal(new Set(i.options).size, p.options);
      }
      if (game.id === "podziel") {
        assert.ok(i.solution.remainder < i.d);
        assert.ok(i.n <= p.max);
      }
      if (game.id === "dzialanie")
        assert.equal(
          evaluate(expressionTokens(i.numbers, i.operators, i.brackets)),
          i.target,
        );
    }
  });
}
test("truth generation is balanced independently of level", () => {
  for (const level of [1, 40, 80]) {
    let truth = 0;
    for (let seed = 0; seed < 1000; seed++)
      truth += games.taknie.generate(level, {}, mulberry32(seed)).solution
        ? 1
        : 0;
    assert.ok(truth >= 450 && truth <= 550);
  }
});
test("arithmetic handles precedence and rejects unsafe or fractional intermediate values", () => {
  assert.equal(evaluate([8, "+", 3, "*", 4]), 20);
  assert.equal(evaluate(["(", 8, "+", 3, ")", "*", 4]), 44);
  assert.equal(evaluate([1, "-", 3, "+", 4]), null);
  assert.equal(evaluate([3, "/", 2, "*", 2]), null);
  assert.equal(evaluate(["alert(1)"]), null);
  assert.equal(evaluate([1, "/", 0]), null);
});
test("Działanie accepts another valid filling and enforces palette multiplicity", () => {
  const i = {
    numbers: [2, 3],
    operators: ["+"],
    palette: [2, 3, 7],
    allowed: ["+", "*"],
    target: 5,
    brackets: false,
    prefill: "none",
  };
  assert.equal(
    games.dzialanie.check(i, { numbers: [3, 2], operators: ["+"] }).correct,
    true,
  );
  assert.equal(
    games.dzialanie.check(
      { ...i, target: 4 },
      { numbers: [2, 2], operators: ["+"] },
    ).correct,
    false,
  );
});
