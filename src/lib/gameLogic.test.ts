import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  calculateQuestRewards,
  isQuestOverdue,
  daysUntilDeadline,
  applyExpPenalty,
  applyGoldPenalty,
  createHeroProfile,
  levelUpHero,
} from "./gameLogic";
import {
  DEFAULT_EXP_REWARDS,
  DEFAULT_GOLD_REWARDS,
  EXP_PENALTY_FACTOR,
  GOLD_PENALTY_FACTOR,
  HERO_STAT_GROWTH,
  MAX_LEVEL,
} from "@/constants/game";
import type { HeroProfile } from "@/types";

// Mock Date for consistent testing of date-dependent functions
const MOCK_DATE = "2024-07-20T12:00:00.000Z"; // July 20, 2024
const RealDate = Date;

beforeAll(() => {
  global.Date = class extends RealDate {
    constructor(dateString?: string) {
      super(dateString || MOCK_DATE);
    }
  } as typeof Date;
});

afterAll(() => {
  global.Date = RealDate;
});

describe("gameLogic", () => {
  // --- Quest Rewards ---
  it("should calculate quest rewards correctly for non-overdue quests", () => {
    expect(calculateQuestRewards("easy", false)).toEqual({
      exp: DEFAULT_EXP_REWARDS.easy,
      gold: DEFAULT_GOLD_REWARDS.easy,
    });
    expect(calculateQuestRewards("normal", false)).toEqual({
      exp: DEFAULT_EXP_REWARDS.normal,
      gold: DEFAULT_GOLD_REWARDS.normal,
    });
    expect(calculateQuestRewards("hard", false)).toEqual({
      exp: DEFAULT_EXP_REWARDS.hard,
      gold: DEFAULT_GOLD_REWARDS.hard,
    });
    expect(calculateQuestRewards("boss", false)).toEqual({
      exp: DEFAULT_EXP_REWARDS.boss,
      gold: DEFAULT_GOLD_REWARDS.boss,
    });
  });

  it("should calculate quest rewards with penalty for overdue quests", () => {
    expect(calculateQuestRewards("easy", true)).toEqual({
      exp: Math.floor(DEFAULT_EXP_REWARDS.easy * EXP_PENALTY_FACTOR),
      gold: Math.floor(DEFAULT_GOLD_REWARDS.easy * GOLD_PENALTY_FACTOR),
    });
    expect(calculateQuestRewards("boss", true)).toEqual({
      exp: Math.floor(DEFAULT_EXP_REWARDS.boss * EXP_PENALTY_FACTOR),
      gold: Math.floor(DEFAULT_GOLD_REWARDS.boss * GOLD_PENALTY_FACTOR),
    });
  });

  // --- Overdue Checks ---
  it("should correctly identify overdue quests", () => {
    // Deadline in the past
    expect(isQuestOverdue("2024-07-19T23:59:59.999Z")).toBe(true);
    // Deadline today (not overdue until after today)
    expect(isQuestOverdue("2024-07-20T00:00:00.000Z")).toBe(false);
    expect(isQuestOverdue("2024-07-20T23:59:59.999Z")).toBe(false);
    // Deadline in the future
    expect(isQuestOverdue("2024-07-21T00:00:00.000Z")).toBe(false);
  });

  it("should calculate days until deadline correctly", () => {
    // Deadline in the past
    expect(daysUntilDeadline("2024-07-19T12:00:00.000Z")).toBe(-1);
    // Deadline today
    expect(daysUntilDeadline("2024-07-20T12:00:00.000Z")).toBe(0);
    // Deadline tomorrow
    expect(daysUntilDeadline("2024-07-21T12:00:00.000Z")).toBe(1);
    // Deadline 7 days from now
    expect(daysUntilDeadline("2024-07-27T12:00:00.000Z")).toBe(7);
  });

  // --- Penalty Application ---
  it("should apply EXP penalty if overdue", () => {
    expect(applyExpPenalty(100, true)).toBe(
      Math.floor(100 * EXP_PENALTY_FACTOR),
    );
    expect(applyExpPenalty(100, false)).toBe(100);
  });

  it("should apply Gold penalty if overdue", () => {
    expect(applyGoldPenalty(50, true)).toBe(
      Math.floor(50 * GOLD_PENALTY_FACTOR),
    );
    expect(applyGoldPenalty(50, false)).toBe(50);
  });

  // --- Hero Profile Creation ---
  it("should create a new hero profile with default stats", () => {
    const hero = createHeroProfile("testUserId", "TestHero");
    expect(hero.id).toBe("testUserId");
    expect(hero.displayName).toBe("TestHero");
    expect(hero.level).toBe(1);
    expect(hero.totalExp).toBe(0);
    expect(hero.gold).toBe(0);
    expect(hero.hp).toBe(100);
    expect(hero.maxHp).toBe(100);
    expect(hero.mp).toBe(50);
    expect(hero.maxMp).toBe(50);
    expect(hero.attack).toBe(10);
    expect(hero.defense).toBe(5);
    expect(hero.inventory).toEqual([]);
    expect(hero.equippedItems).toEqual({});
  });

  // --- Hero Level Up ---
  it("should level up hero and increase stats", () => {
    const initialHero: HeroProfile = {
      id: "hero1",
      displayName: "LevelUpHero",
      level: 1,
      totalExp: 0,
      gold: 0,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 10,
      defense: 5,
      inventory: [],
      equippedItems: {},
      // Add other required properties if HeroProfile type changes
    };

    const leveledUpHero = levelUpHero(initialHero);

    expect(leveledUpHero.level).toBe(2);
    expect(leveledUpHero.maxHp).toBe(
      initialHero.maxHp + HERO_STAT_GROWTH.hp,
    );
    expect(leveledUpHero.hp).toBe(leveledUpHero.maxHp); // HP should be fully restored
    expect(leveledUpHero.maxMp).toBe(
      initialHero.maxMp + HERO_STAT_GROWTH.mp,
    );
    expect(leveledUpHero.mp).toBe(leveledUpHero.maxMp); // MP should be fully restored
    expect(leveledUpHero.attack).toBe(
      initialHero.attack + HERO_STAT_GROWTH.attack,
    );
    expect(leveledUpHero.defense).toBe(
      initialHero.defense + HERO_STAT_GROWTH.defense,
    );
  });

  it("should not level up hero beyond MAX_LEVEL", () => {
    const maxLevelHero: HeroProfile = {
      id: "heroMax",
      displayName: "MaxLevelHero",
      level: MAX_LEVEL,
      totalExp: 99999, // Some high EXP
      gold: 0,
      hp: 500,
      maxHp: 500,
      mp: 250,
      maxMp: 250,
      attack: 100,
      defense: 50,
      inventory: [],
      equippedItems: {},
    };

    const sameLevelHero = levelUpHero(maxLevelHero);
    expect(sameLevelHero.level).toBe(MAX_LEVEL);
    expect(sameLevelHero).toEqual(maxLevelHero); // Should return the same hero object
  });
});
