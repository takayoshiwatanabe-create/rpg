import { describe, it, expect } from "vitest";
import { calculateLevelFromExpCorrected, expProgressInCurrentLevel, isAtMaxLevel } from "./expCalculator"; // Use calculateLevelFromExpCorrected
import { HERO_EXP_CURVE, MAX_LEVEL } from "@/constants/game";

describe("calculateLevelFromExpCorrected", () => {
  it("should return level 1 for 0 totalExp", () => {
    expect(calculateLevelFromExpCorrected(0)).toBe(1);
  });

  it("should return level 1 for less than first level EXP", () => {
    const totalExp = HERO_EXP_CURVE[1] / 2; // Halfway to level 2
    expect(calculateLevelFromExpCorrected(totalExp)).toBe(1);
  });

  it("should return level 2 for exactly first level EXP", () => {
    const totalExp = HERO_EXP_CURVE[1]; // Exactly enough for level 2
    expect(calculateLevelFromExpCorrected(totalExp)).toBe(2);
  });

  it("should return correct level for multiple levels", () => {
    // HERO_EXP_CURVE: [0, 100, 250, 450, ...]
    // Level 1: 0-99 EXP
    // Level 2: 100-249 EXP
    // Level 3: 250-449 EXP
    // Level 4: 450-699 EXP

    expect(calculateLevelFromExpCorrected(99)).toBe(1);
    expect(calculateLevelFromExpCorrected(100)).toBe(2);
    expect(calculateLevelFromExpCorrected(249)).toBe(2);
    expect(calculateLevelFromExpCorrected(250)).toBe(3);
    expect(calculateLevelFromExpCorrected(449)).toBe(3);
    expect(calculateLevelFromExpCorrected(450)).toBe(4);
  });

  it("should cap at MAX_LEVEL", () => {
    // MAX_LEVEL is HERO_EXP_CURVE.length
    // The last element in HERO_EXP_CURVE is the total EXP needed to reach MAX_LEVEL
    const expToMaxLevel = HERO_EXP_CURVE[MAX_LEVEL - 1];
    expect(calculateLevelFromExpCorrected(expToMaxLevel)).toBe(MAX_LEVEL);
    expect(calculateLevelFromExpCorrected(expToMaxLevel + 1000)).toBe(MAX_LEVEL); // Beyond max EXP
  });
});

describe("expProgressInCurrentLevel", () => {
  it("should return correct progress for level 1", () => {
    const progress = expProgressInCurrentLevel(50);
    expect(progress.current).toBe(50);
    expect(progress.required).toBe(HERO_EXP_CURVE[1] - HERO_EXP_CURVE[0]); // EXP for level 1 to 2
  });

  it("should return correct progress for an intermediate level", () => {
    // Total EXP 300: Level 3 (250 total EXP for level 3)
    // EXP needed for Level 3 -> 4 is HERO_EXP_CURVE[3] - HERO_EXP_CURVE[2] = 450 - 250 = 200
    // Current EXP in Level 3: 300 - HERO_EXP_CURVE[2] = 300 - 250 = 50
    const progress = expProgressInCurrentLevel(300);
    expect(progress.current).toBe(50);
    expect(progress.required).toBe(HERO_EXP_CURVE[3] - HERO_EXP_CURVE[2]);
  });

  it("should return 0 currentExp and correct requiredExp when exactly at level start", () => {
    const progress = expProgressInCurrentLevel(HERO_EXP_CURVE[2]); // Exactly at start of level 3
    expect(progress.current).toBe(0);
    expect(progress.required).toBe(HERO_EXP_CURVE[3] - HERO_EXP_CURVE[2]);
  });

  it("should return 0 currentExp and 0 requiredExp for MAX_LEVEL", () => {
    const expAtMaxLevel = HERO_EXP_CURVE[MAX_LEVEL - 1];
    const progress = expProgressInCurrentLevel(expAtMaxLevel);
    expect(progress.current).toBe(0);
    expect(progress.required).toBe(0);
  });

  it("should handle EXP beyond MAX_LEVEL", () => {
    const expBeyondMax = HERO_EXP_CURVE[MAX_LEVEL - 1] + 500;
    const progress = expProgressInCurrentLevel(expBeyondMax);
    expect(progress.current).toBe(0);
    expect(progress.required).toBe(0);
  });
});

describe("isAtMaxLevel", () => {
  it("should return false for levels below MAX_LEVEL", () => {
    expect(isAtMaxLevel(1)).toBe(false);
    expect(isAtMaxLevel(MAX_LEVEL - 1)).toBe(false);
  });

  it("should return true for MAX_LEVEL", () => {
    expect(isAtMaxLevel(MAX_LEVEL)).toBe(true);
  });

  it("should return true for levels above MAX_LEVEL (should not happen in practice)", () => {
    expect(isAtMaxLevel(MAX_LEVEL + 1)).toBe(true);
  });
});
