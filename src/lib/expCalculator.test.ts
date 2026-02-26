import { describe, it, expect } from "vitest";
import { calculateLevelAndExp } from "./expCalculator";
import { EXP_PER_LEVEL, MAX_LEVEL } from "@/constants/game";

describe("calculateLevelAndExp", () => {
  it("should return level 1 and 0 currentExp for 0 totalExp", () => {
    const { level, currentExp } = calculateLevelAndExp(0);
    expect(level).toBe(1);
    expect(currentExp).toBe(0);
  });

  it("should return level 1 and correct currentExp for less than first level EXP", () => {
    const totalExp = EXP_PER_LEVEL[0] / 2; // Halfway to level 2
    const { level, currentExp } = calculateLevelAndExp(totalExp);
    expect(level).toBe(1);
    expect(currentExp).toBe(totalExp);
  });

  it("should return level 2 and 0 currentExp for exactly first level EXP", () => {
    const totalExp = EXP_PER_LEVEL[0]; // Exactly enough for level 2
    const { level, currentExp } = calculateLevelAndExp(totalExp);
    expect(level).toBe(2);
    expect(currentExp).toBe(0);
  });

  it("should return correct level and currentExp for multiple levels", () => {
    // Level 1: 100 EXP
    // Level 2: 200 EXP
    // Level 3: 300 EXP
    // Total EXP for Level 3: 100 + 200 = 300
    // Total EXP for Level 4: 100 + 200 + 300 = 600

    // Test for totalExp = 450 (Level 3 + 150 EXP towards Level 4)
    const totalExp = EXP_PER_LEVEL[0] + EXP_PER_LEVEL[1] + 150; // 100 + 200 + 150 = 450
    const { level, currentExp } = calculateLevelAndExp(totalExp);
    expect(level).toBe(3);
    expect(currentExp).toBe(150);
  });

  it("should cap at MAX_LEVEL and show remaining exp", () => {
    // Calculate total EXP needed to reach MAX_LEVEL
    let expToMaxLevel = 0;
    for (let i = 0; i < MAX_LEVEL - 1; i++) {
      expToMaxLevel += EXP_PER_LEVEL[i];
    }

    const totalExp = expToMaxLevel + 500; // 500 EXP beyond max level
    const { level, currentExp } = calculateLevelAndExp(totalExp);
    expect(level).toBe(MAX_LEVEL);
    expect(currentExp).toBe(500); // Should show excess EXP
  });

  it("should handle edge case where totalExp is exactly enough for MAX_LEVEL", () => {
    let expToMaxLevel = 0;
    for (let i = 0; i < MAX_LEVEL - 1; i++) {
      expToMaxLevel += EXP_PER_LEVEL[i];
    }
    const { level, currentExp } = calculateLevelAndExp(expToMaxLevel);
    expect(level).toBe(MAX_LEVEL);
    expect(currentExp).toBe(0);
  });

  it("should handle large totalExp values correctly", () => {
    // Assuming MAX_LEVEL is 10 and EXP_PER_LEVEL are small for this test
    // If EXP_PER_LEVEL = [100, 100, ..., 100] for 9 levels
    // Total EXP for level 10 = 9 * 100 = 900
    // If totalExp = 1500, should be level 10, currentExp = 600
    const mockExpPerLevel = Array(MAX_LEVEL - 1).fill(100);
    const originalExpPerLevel = [...EXP_PER_LEVEL];
    (EXP_PER_LEVEL as number[]) = mockExpPerLevel; // Temporarily override for test

    let expToMaxLevel = 0;
    for (let i = 0; i < MAX_LEVEL - 1; i++) {
      expToMaxLevel += mockExpPerLevel[i];
    }

    const totalExp = expToMaxLevel + 600;
    const { level, currentExp } = calculateLevelAndExp(totalExp);
    expect(level).toBe(MAX_LEVEL);
    expect(currentExp).toBe(600);

    (EXP_PER_LEVEL as number[]) = originalExpPerLevel; // Restore original
  });
});
