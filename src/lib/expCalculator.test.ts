import { describe, it, expect } from "vitest";
import {
  getExpToNextLevel,
  getTotalExpForLevel,
  getLevelFromTotalExp,
  expProgressInCurrentLevel,
  isAtMaxLevel,
} from "./expCalculator";
import { applyExpPenalty } from "./gameLogic"; // Corrected import path for applyExpPenalty

describe("EXP Calculator", () => {
  it("should calculate EXP to next level correctly", () => {
    expect(getExpToNextLevel(1)).toBe(100);
    expect(getExpToNextLevel(2)).toBe(150);
    expect(getExpToNextLevel(5)).toBe(300);
    expect(getExpToNextLevel(10)).toBe(550);
  });

  it("should calculate total EXP for a given level correctly", () => {
    expect(getTotalExpForLevel(1)).toBe(0); // Level 1 starts at 0 EXP
    expect(getTotalExpForLevel(2)).toBe(100); // To reach level 2, need 100 EXP
    expect(getTotalExpForLevel(3)).toBe(100 + 150); // To reach level 3, need 100 (for L2) + 150 (for L3)
    expect(getTotalExpForLevel(3)).toBe(250);
    expect(getTotalExpForLevel(4)).toBe(250 + 200); // To reach level 4, need 250 (for L3) + 200 (for L4)
    expect(getTotalExpForLevel(4)).toBe(450);
  });

  it("should determine the correct level from total EXP", () => {
    expect(getLevelFromTotalExp(0)).toBe(1);
    expect(getLevelFromTotalExp(99)).toBe(1);
    expect(getLevelFromTotalExp(100)).toBe(2);
    expect(getLevelFromTotalExp(249)).toBe(2);
    expect(getLevelFromTotalExp(250)).toBe(3);
    expect(getLevelFromTotalExp(449)).toBe(3);
    expect(getLevelFromTotalExp(450)).toBe(4);
    expect(getLevelFromTotalExp(1000)).toBe(6); // Example value
    expect(getLevelFromTotalExp(999999)).toBe(99); // Max level
  });

  it("should correctly identify if hero is at max level", () => {
    expect(isAtMaxLevel(1)).toBe(false);
    expect(isAtMaxLevel(50)).toBe(false);
    expect(isAtMaxLevel(99)).toBe(true);
    expect(isAtMaxLevel(100)).toBe(true); // Even if somehow exceeds max level constant
  });

  it("should calculate EXP progress within current level", () => {
    // Level 1 (0-99 EXP), next level at 100 EXP
    // Current: 0, Required: 100
    expect(expProgressInCurrentLevel(0)).toEqual({ current: 0, required: 100 });
    expect(expProgressInCurrentLevel(50)).toEqual({ current: 50, required: 100 });
    expect(expProgressInCurrentLevel(99)).toEqual({ current: 99, required: 100 });

    // Level 2 (100-249 EXP), next level at 250 EXP
    // Current: 0, Required: 150 (for this level)
    expect(expProgressInCurrentLevel(100)).toEqual({ current: 0, required: 150 });
    expect(expProgressInCurrentLevel(175)).toEqual({ current: 75, required: 150 });
    expect(expProgressInCurrentLevel(249)).toEqual({ current: 149, required: 150 });

    // Level 3 (250-449 EXP), next level at 450 EXP
    // Current: 0, Required: 200 (for this level)
    expect(expProgressInCurrentLevel(250)).toEqual({ current: 0, required: 200 });
    expect(expProgressInCurrentLevel(350)).toEqual({ current: 100, required: 200 });
    expect(expProgressInCurrentLevel(449)).toEqual({ current: 199, required: 200 });

    // Max level (99)
    expect(expProgressInCurrentLevel(getTotalExpForLevel(99))).toEqual({
      current: 0,
      required: 1, // Or some other indicator for max level, as per implementation
    });
    expect(expProgressInCurrentLevel(999999)).toEqual({
      current: 0,
      required: 1,
    });
  });

  it("should apply EXP penalty correctly", () => {
    expect(applyExpPenalty(100, false)).toBe(100); // No penalty
    expect(applyExpPenalty(100, true)).toBe(50); // 50% penalty
    expect(applyExpPenalty(0, true)).toBe(0);
    expect(applyExpPenalty(250, true)).toBe(125);
  });
});

