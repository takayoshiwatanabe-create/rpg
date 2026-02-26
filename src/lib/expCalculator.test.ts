import { describe, it, expect } from "vitest";
import {
  calculateLevelFromExp,
  expProgressInCurrentLevel,
  isAtMaxLevel,
} from "./expCalculator";
import { HERO_EXP_CURVE, MAX_LEVEL } from "@/constants/game";

describe("expCalculator", () => {
  it("should calculate correct level from total EXP", () => {
    expect(calculateLevelFromExp(0)).toBe(1); // Start at level 1
    expect(calculateLevelFromExp(HERO_EXP_CURVE[0])).toBe(1); // Still level 1 until 100
    expect(calculateLevelFromExp(HERO_EXP_CURVE[0] + 1)).toBe(2); // Level 2
    expect(calculateLevelFromExp(HERO_EXP_CURVE[1])).toBe(2); // Still level 2 until 250
    expect(calculateLevelFromExp(HERO_EXP_CURVE[1] + 1)).toBe(3); // Level 3
    expect(calculateLevelFromExp(HERO_EXP_CURVE[MAX_LEVEL - 2])).toBe(
      MAX_LEVEL - 1,
    ); // Max-1 level
    expect(calculateLevelFromExp(HERO_EXP_CURVE[MAX_LEVEL - 1])).toBe(
      MAX_LEVEL,
    ); // Max level
    expect(calculateLevelFromExp(HERO_EXP_CURVE[MAX_LEVEL - 1] + 1000)).toBe(
      MAX_LEVEL,
    ); // Beyond max level
  });

  it("should return correct EXP progress in current level", () => {
    // Level 1 (0-99 EXP)
    expect(expProgressInCurrentLevel(0)).toEqual({ current: 0, required: 100 });
    expect(expProgressInCurrentLevel(50)).toEqual({ current: 50, required: 100 });
    expect(expProgressInCurrentLevel(99)).toEqual({ current: 99, required: 100 });

    // Level 2 (100-249 EXP)
    expect(expProgressInCurrentLevel(100)).toEqual({ current: 0, required: 150 }); // 100 (total) - 100 (prev level) = 0
    expect(expProgressInCurrentLevel(150)).toEqual({ current: 50, required: 150 });
    expect(expProgressInCurrentLevel(249)).toEqual({ current: 149, required: 150 });

    // Level 3 (250-449 EXP)
    expect(expProgressInCurrentLevel(250)).toEqual({ current: 0, required: 200 }); // 250 (total) - 250 (prev level) = 0
    expect(expProgressInCurrentLevel(350)).toEqual({ current: 100, required: 200 });
    expect(expProgressInCurrentLevel(449)).toEqual({ current: 199, required: 200 });

    // Max level
    const maxExp = HERO_EXP_CURVE[MAX_LEVEL - 1];
    expect(expProgressInCurrentLevel(maxExp)).toEqual({
      current: 0,
      required: 0,
    });
    expect(expProgressInCurrentLevel(maxExp + 100)).toEqual({
      current: 0,
      required: 0,
    });
  });

  it("should correctly identify if hero is at max level", () => {
    expect(isAtMaxLevel(1)).toBe(false);
    expect(isAtMaxLevel(MAX_LEVEL - 1)).toBe(false);
    expect(isAtMaxLevel(MAX_LEVEL)).toBe(true);
    expect(isAtMaxLevel(MAX_LEVEL + 1)).toBe(true); // Should still be true if somehow over max
  });
});
