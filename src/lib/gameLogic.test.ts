import { describe, it, expect } from "vitest";
import type { BattleEnemy } from "@/types";
import {
  heroStatsForLevel,
  createHeroProfile,
  calculateQuestRewards,
  calculateGoldDrop,
  calculateAttackDamage,
  simulateBattle,
  determineBattleOutcome,
  createEnemyFromQuest,
  applyRewardsToHero,
  isQuestOverdue,
  daysUntilDeadline,
} from "./gameLogic";
import { MAX_HERO_LEVEL } from "@/constants/game";

// ---------------------------------------------------------------------------
// Deterministic RNG stubs
// rng() == 0   → roll = floor(0   * 11) - 5 = -5  (minimum variance)
// rng() == 0.5 → roll = floor(0.5 * 11) - 5 =  0  (neutral)
// rng() == 1-ε → roll = floor(1   * 11) - 5 =  5  (maximum variance)
// ---------------------------------------------------------------------------
const rngMin = (): number => 0;
const rngMid = (): number => 0.5;
const rngMax = (): number => 0.9999;

// ---------------------------------------------------------------------------
// heroStatsForLevel
// ---------------------------------------------------------------------------
describe("heroStatsForLevel", () => {
  it("returns base stats at level 1", () => {
    const s = heroStatsForLevel(1);
    expect(s.maxHp).toBe(100);
    expect(s.maxMp).toBe(50);
    expect(s.attack).toBe(10);
    expect(s.defense).toBe(5);
  });

  it("increments correctly at level 2", () => {
    const s = heroStatsForLevel(2);
    expect(s.maxHp).toBe(120);
    expect(s.maxMp).toBe(60);
    expect(s.attack).toBe(12);
    expect(s.defense).toBe(6);
  });

  it("stats grow monotonically with level", () => {
    const lv1 = heroStatsForLevel(1);
    const lv10 = heroStatsForLevel(10);
    const lv99 = heroStatsForLevel(MAX_HERO_LEVEL);
    expect(lv10.maxHp).toBeGreaterThan(lv1.maxHp);
    expect(lv99.attack).toBeGreaterThan(lv10.attack);
  });
});

// ---------------------------------------------------------------------------
// createHeroProfile
// ---------------------------------------------------------------------------
describe("createHeroProfile", () => {
  it("creates a level-1 hero with zeroed EXP and gold", () => {
    const hero = createHeroProfile("id1", "たろう");
    expect(hero.level).toBe(1);
    expect(hero.totalExp).toBe(0);
    expect(hero.gold).toBe(0);
  });

  it("starts with full HP and MP", () => {
    const hero = createHeroProfile("id2", "はなこ");
    expect(hero.hp).toBe(hero.maxHp);
    expect(hero.mp).toBe(hero.maxMp);
  });

  it("assigns id and displayName", () => {
    const hero = createHeroProfile("abc", "Hero");
    expect(hero.id).toBe("abc");
    expect(hero.displayName).toBe("Hero");
  });
});

// ---------------------------------------------------------------------------
// calculateQuestRewards
// ---------------------------------------------------------------------------
describe("calculateQuestRewards", () => {
  it("returns full rewards when on time", () => {
    const r = calculateQuestRewards("easy", false);
    expect(r.exp).toBe(50);
    expect(r.gold).toBe(30);
  });

  it("applies 75% EXP penalty when overdue", () => {
    const r = calculateQuestRewards("normal", true);
    expect(r.exp).toBe(75); // 100 * 0.75
  });

  it("applies 50% gold penalty when overdue", () => {
    const r = calculateQuestRewards("normal", true);
    expect(r.gold).toBe(30); // 60 * 0.5
  });

  it("boss rewards exceed easy rewards", () => {
    const boss = calculateQuestRewards("boss", false);
    const easy = calculateQuestRewards("easy", false);
    expect(boss.exp).toBeGreaterThan(easy.exp);
    expect(boss.gold).toBeGreaterThan(easy.gold);
  });
});

// ---------------------------------------------------------------------------
// calculateGoldDrop
// ---------------------------------------------------------------------------
describe("calculateGoldDrop", () => {
  it("returns base gold for an on-time easy quest", () => {
    expect(calculateGoldDrop({ difficulty: "easy", isOverdue: false })).toBe(30);
  });

  it("applies 50% overdue penalty", () => {
    expect(calculateGoldDrop({ difficulty: "easy", isOverdue: true })).toBe(15);
  });

  it("applies bonus multiplier correctly", () => {
    const gold = calculateGoldDrop({ difficulty: "normal", isOverdue: false, bonusMultiplier: 1.5 });
    expect(gold).toBe(Math.floor(60 * 1.5)); // 90
  });

  it("stacks overdue penalty and bonus multiplier", () => {
    const gold = calculateGoldDrop({ difficulty: "normal", isOverdue: true, bonusMultiplier: 2 });
    expect(gold).toBe(Math.floor(60 * 0.5 * 2)); // 60
  });

  it("never returns negative gold", () => {
    expect(calculateGoldDrop({ difficulty: "easy", isOverdue: true, bonusMultiplier: 0 })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateAttackDamage
// ---------------------------------------------------------------------------
describe("calculateAttackDamage", () => {
  // attack=10, defense=4 → base = max(1, 10 - floor(4/2)) = 8
  // rngMin: roll = floor(0 * 11) - 5 = -5 → max(1, 8-5) = 3
  // rngMid: roll = floor(0.5*11) - 5 = 0  → max(1, 8+0) = 8
  // rngMax: roll = floor(1*11) - 5 = 5    → max(1, 8+5) = 13

  it("returns minimum damage with rng=0", () => {
    expect(calculateAttackDamage(10, 4, rngMin)).toBe(3);
  });

  it("returns neutral damage with rng=0.5", () => {
    expect(calculateAttackDamage(10, 4, rngMid)).toBe(8);
  });

  it("returns maximum damage with rng≈1", () => {
    expect(calculateAttackDamage(10, 4, rngMax)).toBe(13);
  });

  it("always returns at least 1 even against overwhelming defense", () => {
    for (let i = 0; i < 20; i++) {
      expect(calculateAttackDamage(1, 9999, rngMin)).toBeGreaterThanOrEqual(1);
    }
  });

  it("higher attack deals more damage given the same rng and defense", () => {
    expect(calculateAttackDamage(50, 4, rngMid)).toBeGreaterThan(
      calculateAttackDamage(10, 4, rngMid)
    );
  });
});

// ---------------------------------------------------------------------------
// determineBattleOutcome
// ---------------------------------------------------------------------------
describe("determineBattleOutcome", () => {
  it("returns victory when hero survives and enemy is defeated", () => {
    expect(determineBattleOutcome(10, 0)).toBe("victory");
  });

  it("returns defeat when hero HP reaches 0", () => {
    expect(determineBattleOutcome(0, 50)).toBe("defeat");
  });

  it("returns defeat when both reach 0 simultaneously", () => {
    expect(determineBattleOutcome(0, 0)).toBe("defeat");
  });

  it("returns defeat when max turns elapsed with both sides alive", () => {
    expect(determineBattleOutcome(10, 10)).toBe("defeat");
  });
});

// ---------------------------------------------------------------------------
// simulateBattle
// ---------------------------------------------------------------------------
describe("simulateBattle", () => {
  const strongHero = {
    maxHp: 500,
    maxMp: 100,
    attack: 100,
    defense: 50,
    currentHp: 500,
  };

  const weakHero = {
    maxHp: 10,
    maxMp: 10,
    attack: 1,
    defense: 0,
    currentHp: 10,
  };

  const normalEnemy: BattleEnemy = {
    nameKey: "enemy.math.normal",
    spriteId: "enemy_math",
    maxHp: 100,
    currentHp: 100,
    attack: 10,
    defense: 5,
  };

  it("strong hero defeats enemy (victory)", () => {
    const result = simulateBattle(strongHero, normalEnemy, rngMid);
    expect(result.outcome).toBe("victory");
    expect(result.enemyHpRemaining).toBe(0);
    expect(result.heroHpRemaining).toBeGreaterThan(0);
  });

  it("weak hero loses (defeat)", () => {
    const result = simulateBattle(weakHero, normalEnemy, rngMid);
    expect(result.outcome).toBe("defeat");
  });

  it("reports at least 1 turn elapsed", () => {
    const result = simulateBattle(strongHero, normalEnemy, rngMid);
    expect(result.turnsElapsed).toBeGreaterThan(0);
  });

  it("damage totals are non-negative", () => {
    const result = simulateBattle(strongHero, normalEnemy, rngMid);
    expect(result.totalDamageDealtToEnemy).toBeGreaterThanOrEqual(0);
    expect(result.totalDamageTakenByHero).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic for the same rng stub", () => {
    const r1 = simulateBattle(strongHero, normalEnemy, rngMid);
    const r2 = simulateBattle(strongHero, normalEnemy, rngMid);
    expect(r1).toEqual(r2);
  });

  it("hero takes more damage with rng biased toward max variance", () => {
    const maxResult = simulateBattle(weakHero, normalEnemy, rngMax);
    const minResult = simulateBattle(weakHero, normalEnemy, rngMin);
    // With max variance the enemy deals more per hit
    expect(maxResult.totalDamageTakenByHero).toBeGreaterThanOrEqual(
      minResult.totalDamageTakenByHero
    );
  });
});

// ---------------------------------------------------------------------------
// createEnemyFromQuest
// ---------------------------------------------------------------------------
describe("createEnemyFromQuest", () => {
  it("sets stats from difficulty config for easy quest", () => {
    const enemy = createEnemyFromQuest("q1", "math", "easy");
    expect(enemy.maxHp).toBe(50);
    expect(enemy.currentHp).toBe(50);
    expect(enemy.attack).toBe(5);
    expect(enemy.defense).toBe(2);
  });

  it("boss enemy is much stronger than easy enemy", () => {
    const boss = createEnemyFromQuest("q2", "math", "boss");
    const easy = createEnemyFromQuest("q3", "math", "easy");
    expect(boss.maxHp).toBeGreaterThan(easy.maxHp);
    expect(boss.attack).toBeGreaterThan(easy.attack);
  });

  it("assigns the correct subject sprite", () => {
    const enemy = createEnemyFromQuest("q4", "japanese", "normal");
    expect(enemy.spriteId).toBe("enemy_japanese");
  });

  it("starts with currentHp equal to maxHp", () => {
    const enemy = createEnemyFromQuest("q5", "science", "hard");
    expect(enemy.currentHp).toBe(enemy.maxHp);
  });
});

// ---------------------------------------------------------------------------
// applyRewardsToHero
// ---------------------------------------------------------------------------
describe("applyRewardsToHero", () => {
  const baseHero = createHeroProfile("h1", "Taro");

  it("adds exp and gold without mutating the original", () => {
    const { updatedHero } = applyRewardsToHero(baseHero, { exp: 50, gold: 30 });
    expect(updatedHero.totalExp).toBe(50);
    expect(updatedHero.gold).toBe(30);
    expect(baseHero.totalExp).toBe(0); // original is unchanged
  });

  it("does not level up when EXP is below threshold", () => {
    const { leveledUp, updatedHero } = applyRewardsToHero(baseHero, { exp: 99, gold: 0 });
    expect(leveledUp).toBe(false);
    expect(updatedHero.level).toBe(1);
  });

  it("levels up when EXP threshold is crossed", () => {
    const { leveledUp, newLevel, updatedHero } = applyRewardsToHero(baseHero, {
      exp: 100,
      gold: 0,
    });
    expect(leveledUp).toBe(true);
    expect(newLevel).toBe(2);
    expect(updatedHero.level).toBe(2);
  });

  it("restores HP and MP on level up", () => {
    const damagedHero = { ...baseHero, hp: 1, mp: 1 };
    const { updatedHero } = applyRewardsToHero(damagedHero, { exp: 100, gold: 0 });
    expect(updatedHero.hp).toBe(updatedHero.maxHp);
    expect(updatedHero.mp).toBe(updatedHero.maxMp);
  });

  it("increases maxHp on level up", () => {
    const { updatedHero } = applyRewardsToHero(baseHero, { exp: 100, gold: 0 });
    expect(updatedHero.maxHp).toBeGreaterThan(baseHero.maxHp);
  });
});

// ---------------------------------------------------------------------------
// isQuestOverdue / daysUntilDeadline
// ---------------------------------------------------------------------------
describe("isQuestOverdue", () => {
  it("returns true for a past date", () => {
    expect(isQuestOverdue("2020-01-01")).toBe(true);
  });

  it("returns false for a future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isQuestOverdue(future.toISOString())).toBe(false);
  });
});

describe("daysUntilDeadline", () => {
  it("returns a negative number for past dates", () => {
    expect(daysUntilDeadline("2020-01-01")).toBeLessThan(0);
  });

  it("returns a positive number for future dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysUntilDeadline(future.toISOString())).toBeGreaterThanOrEqual(4);
  });
});
