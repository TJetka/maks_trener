export const DIFFICULTIES = ["intermediate", "expert"];

/** Missing metadata denotes the original ramps, never a newly assigned tier. */
export function recordDifficulty(record) {
  return (
    record.difficulty ??
    record.settings?.difficulty ??
    record.provenance?.settings?.difficulty ??
    "legacy"
  );
}

export function selectedDifficulty(settings, gameId) {
  return (
    settings.gameDifficulties?.[gameId] ?? settings.difficulty ?? "intermediate"
  );
}

export function presetId(gameId, difficulty) {
  return difficulty && difficulty !== "legacy"
    ? `${gameId}:${difficulty}`
    : `${gameId}:preset`;
}

/** Bounded grade-4 ramps: puzzle structure changes before time pressure does.
 * Legacy calls without a tier retain their original seeded behavior.
 */
export function tierParameters(gameId, level, base, difficulty) {
  if (!DIFFICULTIES.includes(difficulty)) return base;
  const expert = difficulty === "expert";
  const late = level > base.levels / 2;
  const rules = {
    dzielnik: expert
      ? {
          cells: 24,
          find: 3,
          min: 30,
          max: late ? 499 : 199,
          divisors: [3, 4, 6, 8, 9],
          seconds: 12,
        }
      : {
          cells: late ? 16 : 12,
          find: 2,
          min: 10,
          max: late ? 99 : 69,
          divisors: late ? [3, 5, 6] : [2, 3, 5, 10],
          seconds: 20,
        },
    dzialanie: expert
      ? {
          numberSlots: late ? 4 : 3,
          operators: ["+", "-", "*", "/"],
          max: 10,
          brackets: late,
          distractors: 2,
          prefill: "none",
          minOperand: 2,
          requireMixed: true,
        }
      : {
          numberSlots: level > 15 ? 3 : 2,
          operators:
            level >= 7 && level <= 15 ? ["+", "-", "*", "/"] : ["+", "-"],
          max: level >= 7 && level <= 15 ? 10 : 20,
          brackets: false,
          distractors: 1,
          prefill: "operators",
        },
    sumuj: expert
      ? {
          size: late ? 7 : 6,
          shapeSize: late ? 4 : 3,
          max: late ? 30 : 15,
          operation: "sum",
          rotations: false,
        }
      : {
          size: 5,
          shapeSize: late ? 3 : 2,
          max: late ? 15 : 9,
          operation: "sum",
          rotations: false,
        },
    wybierz: expert
      ? {
          rows: late ? 5 : 4,
          cols: 3,
          max: 9,
          subsetMin: 3,
          subsetMax: 3,
          seconds: 18,
        }
      : {
          rows: late ? 4 : 3,
          cols: 2,
          max: 6,
          subsetMin: 2,
          subsetMax: 2,
          seconds: 25,
        },
    podziel: expert
      ? {
          max: late ? 999 : 199,
          divisors: [3, 4, 5, 6, 7, 8, 9],
          remainder: true,
          minQuotient: 5,
          requireRemainder: true,
          seconds: 15,
        }
      : {
          max: 100,
          divisors: [2, 3, 4, 5, 6, 7, 8, 9, 10],
          remainder: false,
          seconds: 20,
        },
    plusminus: expert
      ? {
          blanks: late ? 4 : 3,
          max: late ? 50 : 20,
          operators: ["+", "-", "*"],
          requireMultiply: true,
          maxTarget: 1000,
        }
      : { blanks: 2, max: late ? 20 : 10, operators: ["+", "-"] },
    taknie: expert
      ? {
          itemTypes: ["compare", "twoStep", "div", "rem"],
          max: late ? 300 : 100,
          seconds: 6,
        }
      : { itemTypes: ["mul", "inequality"], max: late ? 20 : 10, seconds: 10 },
    slupek: expert
      ? {
          digits: 3,
          blanks: level > 8 ? 3 : 2,
          operation: level > 12 ? "multiply" : "mixed",
          resultOnly: false,
        }
      : {
          digits: 2,
          blanks: late ? 2 : 1,
          operation: late ? "mixed" : "add",
          resultOnly: false,
        },
    kwadrat: expert
      ? {
          size: late ? 4 : 3,
          blanks: late ? 4 : 3,
          max: late ? 30 : 20,
          totals: "both",
          diagonals: false,
        }
      : {
          size: 3,
          blanks: late ? 2 : 1,
          max: late ? 15 : 9,
          totals: "both",
          diagonals: false,
        },
    karuzela: expert
      ? {
          chainLength: late ? 4 : 3,
          operators: ["+", "-", "*", "/"],
          options: 6,
          max: late ? 500 : 300,
          seconds: 12,
          avoidNeutral: true,
          requireMultiply: true,
        }
      : {
          chainLength: late ? 3 : 2,
          operators: ["+", "-"],
          options: 4,
          max: 100,
          seconds: 18,
          avoidNeutral: true,
        },
  };
  return {
    ...base,
    ...(base.archetype === "ladder" ? { seconds: expert ? 300 : 360 } : {}),
    ...rules[gameId],
    difficulty,
  };
}
