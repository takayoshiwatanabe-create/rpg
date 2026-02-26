import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isQuestOverdue,
  calculateQuestRewards,
  applyExpPenalty,
  applyGoldPenalty,
  calculateNextLevelExp,
  calculateHeroLevel,
} from "./gameLogic";
import {
  BASE_EXP_REWARD,
  BASE_GOLD_REWARD,
  DIFFICULTY_MULTIPLIERS,
  OVERDUE_PENALTY_MULTIPLIER,
  EXP_PER_LEVEL,
  MAX_LEVEL,
} from "@/constants/game";
import type { HeroProfile } from "@/types";

// Mock Date for consistent testing of date-dependent functions
const MOCK_DATE = "2024-07-20T12:00:00.000Z"; // July 20, 2024

describe("gameLogic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(MOCK_DATE));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isQuestOverdue", () => {
    it("should return true if deadline is in the past", () => {
      const deadlineDate = "2024-07-19"; // Day before MOCK_DATE
      expect(isQuestOverdue(deadlineDate)).toBe(true);
    });

    it("should return false if deadline is today", () => {
      const deadlineDate = "2024-07-20"; // Same day as MOCK_DATE
      expect(isQuestOverdue(deadlineDate)).toBe(false);
    });

    it("should return false if deadline is in the future", () => {
      const deadlineDate = "2024-07-21"; // Day after MOCK_DATE
      expect(isQuestOverdue(deadlineDate)).toBe(false);
    });

    it("should handle different date formats if they are valid ISO strings or YYYY-MM-DD", () => {
      const deadlineDateISO = "2024-07-19T23:59:59.999Z";
      expect(isQuestOverdue(deadlineDateISO)).toBe(true);

      const deadlineDateFutureISO = "2024-07-20T12:00:00.001Z";
      expect(isQuestOverdue(deadlineDateFutureISO)).toBe(false);
    });
  });

  describe("calculateQuestRewards", () => {
    it("should calculate correct rewards for easy difficulty, not overdue", () => {
      const rewards = calculateQuestRewards("easy", false);
      expect(rewards.exp).toBe(BASE_EXP_REWARD * DIFFICULTY_MULTIPLIERS.easy);
      expect(rewards.gold).toBe(BASE_GOLD_REWARD * DIFFICULTY_MULTIPLIERS.easy);
    });

    it("should calculate correct rewards for normal difficulty, not overdue", () => {
      const rewards = calculateQuestRewards("normal", false);
      expect(rewards.exp).toBe(BASE_EXP_REWARD * DIFFICULTY_MULTIPLIERS.normal);
      expect(rewards.gold).toBe(BASE_GOLD_REWARD * DIFFICULTY_MULTIPLIERS.normal);
    });

    it("should calculate correct rewards for hard difficulty, not overdue", () => {
      const rewards = calculateQuestRewards("hard", false);
      expect(rewards.exp).toBe(BASE_EXP_REWARD * DIFFICULTY_MULTIPLIERS.hard);
      expect(rewards.gold).toBe(BASE_GOLD_REWARD * DIFFICULTY_MULTIPLIERS.hard);
    });

    it("should calculate correct rewards for easy difficulty, overdue", () => {
      const rewards = calculateQuestRewards("easy", true);
      expect(rewards.exp).toBe(
        BASE_EXP_REWARD * DIFFICULTY_MULTIPLIERS.easy * OVERDUE_PENALTY_MULTIPLIER,
      );
      expect(rewards.gold).toBe(
        BASE_GOLD_REWARD * DIFFICULTY_MULTIPLIERS.easy * OVERDUE_PENALTY_MULTIPLIER,
      );
    });
  });

  describe("applyExpPenalty", () => {
    it("should apply penalty if overdue is true", () => {
      const baseExp = 100;
      expect(applyExpPenalty(baseExp, true)).toBe(
        baseExp * OVERDUE_PENALTY_MULTIPLIER,
      );
    });

    it("should not apply penalty if overdue is false", () => {
      const baseExp = 100;
      expect(applyExpPenalty(baseExp, false)).toBe(baseExp);
    });

    it("should return 0 if baseExp is 0", () => {
      expect(applyExpPenalty(0, true)).toBe(0);
      expect(applyExpPenalty(0, false)).toBe(0);
    });
  });

  describe("applyGoldPenalty", () => {
    it("should apply penalty if overdue is true", () => {
      const baseGold = 50;
      expect(applyGoldPenalty(baseGold, true)).toBe(
        baseGold * OVERDUE_PENALTY_MULTIPLIER,
      );
    });

    it("should not apply penalty if overdue is false", () => {
      const baseGold = 50;
      expect(applyGoldPenalty(baseGold, false)).toBe(baseGold);
    });

    it("should return 0 if baseGold is 0", () => {
      expect(applyGoldPenalty(0, true)).toBe(0);
      expect(applyGoldPenalty(0, false)).toBe(0);
    });
  });

  describe("calculateNextLevelExp", () => {
    it("should return correct EXP for next level", () => {
      // Assuming EXP_PER_LEVEL = [100, 200, 300, ...]
      expect(calculateNextLevelExp(1)).toBe(EXP_PER_LEVEL[0]); // For level 1, need EXP_PER_LEVEL[0] to reach level 2
      expect(calculateNextLevelExp(2)).toBe(EXP_PER_LEVEL[1]); // For level 2, need EXP_PER_LEVEL[1] to reach level 3
    });

    it("should return 0 if current level is MAX_LEVEL", () => {
      expect(calculateNextLevelExp(MAX_LEVEL)).toBe(0);
    });

    it("should return 0 if current level is greater than MAX_LEVEL", () => {
      expect(calculateNextLevelExp(MAX_LEVEL + 1)).toBe(0);
    });
  });

  describe("calculateHeroLevel", () => {
    it("should return level 1 for 0 totalExp", () => {
      const { level, currentExp } = calculateHeroLevel(0);
      expect(level).toBe(1);
      expect(currentExp).toBe(0);
    });

    it("should return level 1 and correct currentExp for less than first level EXP", () => {
      const totalExp = EXP_PER_LEVEL[0] / 2; // Halfway to level 2
      const { level, currentExp } = calculateHeroLevel(totalExp);
      expect(level).toBe(1);
      expect(currentExp).toBe(totalExp);
    });

    it("should return level 2 and 0 currentExp for exactly first level EXP", () => {
      const totalExp = EXP_PER_LEVEL[0]; // Exactly enough for level 2
      const { level, currentExp } = calculateHeroLevel(totalExp);
      expect(level).toBe(2);
      expect(currentExp).toBe(0);
    });

    it("should return correct level and currentExp for multiple levels", () => {
      // Total EXP for Level 3: EXP_PER_LEVEL[0] + EXP_PER_LEVEL[1]
      const totalExp = EXP_PER_LEVEL[0] + EXP_PER_LEVEL[1] + 150; // 100 + 200 + 150 = 450
      const { level, currentExp } = calculateHeroLevel(totalExp);
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
      const { level, currentExp } = calculateHeroLevel(totalExp);
      expect(level).toBe(MAX_LEVEL);
      expect(currentExp).toBe(500); // Should show excess EXP
    });

    it("should handle edge case where totalExp is exactly enough for MAX_LEVEL", () => {
      let expToMaxLevel = 0;
      for (let i = 0; i < MAX_LEVEL - 1; i++) {
        expToMaxLevel += EXP_PER_LEVEL[i];
      }
      const { level, currentExp } = calculateHeroLevel(expToMaxLevel);
      expect(level).toBe(MAX_LEVEL);
      expect(currentExp).toBe(0);
    });
  });
});
