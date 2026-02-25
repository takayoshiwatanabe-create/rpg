import { describe, it, expect } from "@jest/globals";
import {
  expToNextLevel,
  totalExpForLevel,
  levelFromTotalExp,
  expProgressInCurrentLevel,
  heroStatsForLevel,
  calculateQuestRewards,
  applyRewardsToHero,
  calculateBattleDamage,
  isQuestOverdue,
  daysUntilDeadline,
  createHeroProfile,
} from "./gameLogic";
import { MAX_HERO_LEVEL } from "@/constants/game";

// Deterministic RNG stubs — same convention as src/lib/gameLogic.test.ts.
// BATTLE_DAMAGE_VARIANCE = 5, so variance range = 11 values (0..10).
// rngMin(): roll = floor(0   * 11) - 5 = -5
// rngMid(): roll = floor(0.5 * 11) - 5 =  0
// rngMax(): roll = floor(1   * 11) - 5 =  5  (capped at 10 ints: 0-9 → max floor = 10)
const rngMin = (): number => 0;
const rngMid = (): number => 0.5;
const rngMax = (): number => 0.9999;

describe("expToNextLevel", () => {
  it("returns 100 for level 1", () => {
    expect(expToNextLevel(1)).toBe(100);
  });

  it("returns level * 100 for level N", () => {
    expect(expToNextLevel(5)).toBe(500);
    expect(expToNextLevel(10)).toBe(1000);
  });

  it("returns 0 at max level", () => {
    expect(expToNextLevel(MAX_HERO_LEVEL)).toBe(0);
  });
});

describe("totalExpForLevel", () => {
  it("returns 0 for level 1", () => {
    expect(totalExpForLevel(1)).toBe(0);
  });

  it("returns 100 for level 2", () => {
    expect(totalExpForLevel(2)).toBe(100);
  });

  it("returns 300 for level 3", () => {
    expect(totalExpForLevel(3)).toBe(300);
  });

  it("returns 600 for level 4", () => {
    expect(totalExpForLevel(4)).toBe(600);
  });
});

describe("levelFromTotalExp", () => {
  it("returns 1 at 0 EXP", () => {
    expect(levelFromTotalExp(0)).toBe(1);
  });

  it("returns 1 at 99 EXP", () => {
    expect(levelFromTotalExp(99)).toBe(1);
  });

  it("returns 2 at exactly 100 EXP", () => {
    expect(levelFromTotalExp(100)).toBe(2);
  });

  it("returns 3 at exactly 300 EXP", () => {
    expect(levelFromTotalExp(300)).toBe(3);
  });

  it("never exceeds max level", () => {
    expect(levelFromTotalExp(999_999_999)).toBe(MAX_HERO_LEVEL);
  });

  it("is consistent with totalExpForLevel", () => {
    for (let lv = 1; lv <= 20; lv++) {
      expect(levelFromTotalExp(totalExpForLevel(lv))).toBe(lv);
    }
  });
});

describe("expProgressInCurrentLevel", () => {
  it("returns 0% at level boundary", () => {
    const progress = expProgressInCurrentLevel(0);
    expect(progress.current).toBe(0);
    expect(progress.required).toBe(100);
    expect(progress.percentage).toBe(0);
  });

  it("returns 50% at midpoint", () => {
    const progress = expProgressInCurrentLevel(50);
    expect(progress.percentage).toBeCloseTo(0.5);
  });

  it("returns 100% at max level", () => {
    const progress = expProgressInCurrentLevel(totalExpForLevel(MAX_HERO_LEVEL));
    expect(progress.percentage).toBe(1);
  });
});

describe("heroStatsForLevel", () => {
  it("returns base stats at level 1", () => {
    const stats = heroStatsForLevel(1);
    expect(stats.maxHp).toBe(100);
    expect(stats.maxMp).toBe(50);
    expect(stats.attack).toBe(10);
    expect(stats.defense).toBe(5);
  });

  it("scales correctly at level 2", () => {
    const stats = heroStatsForLevel(2);
    expect(stats.maxHp).toBe(120);
    expect(stats.maxMp).toBe(60);
    expect(stats.attack).toBe(12);
    expect(stats.defense).toBe(6);
  });

  it("returns higher stats at higher levels", () => {
    const lv10 = heroStatsForLevel(10);
    const lv1 = heroStatsForLevel(1);
    expect(lv10.maxHp).toBeGreaterThan(lv1.maxHp);
    expect(lv10.attack).toBeGreaterThan(lv1.attack);
  });
});

describe("calculateQuestRewards", () => {
  it("returns full rewards when not overdue", () => {
    const rewards = calculateQuestRewards("easy", false);
    expect(rewards.exp).toBe(50);
    expect(rewards.gold).toBe(30);
  });

  it("applies penalty when overdue", () => {
    const overdue = calculateQuestRewards("easy", true);
    const normal = calculateQuestRewards("easy", false);
    expect(overdue.exp).toBeLessThan(normal.exp);
    expect(overdue.gold).toBeLessThan(normal.gold);
  });

  it("boss rewards are higher than easy rewards", () => {
    const boss = calculateQuestRewards("boss", false);
    const easy = calculateQuestRewards("easy", false);
    expect(boss.exp).toBeGreaterThan(easy.exp);
    expect(boss.gold).toBeGreaterThan(easy.gold);
  });

  it("overdue exp is 75% of normal", () => {
    const overdue = calculateQuestRewards("normal", true);
    expect(overdue.exp).toBe(75);
  });

  it("overdue gold is 50% of normal", () => {
    const overdue = calculateQuestRewards("normal", true);
    expect(overdue.gold).toBe(30);
  });
});

describe("applyRewardsToHero", () => {
  const baseHero = createHeroProfile("test", "TestHero");

  it("adds exp and gold correctly", () => {
    const { updatedHero } = applyRewardsToHero(baseHero, { exp: 50, gold: 30 });
    expect(updatedHero.totalExp).toBe(50);
    expect(updatedHero.gold).toBe(30);
  });

  it("does not level up when exp is insufficient", () => {
    const { leveledUp, updatedHero } = applyRewardsToHero(baseHero, { exp: 50, gold: 0 });
    expect(leveledUp).toBe(false);
    expect(updatedHero.level).toBe(1);
  });

  it("levels up when exp threshold is reached", () => {
    const { leveledUp, newLevel, updatedHero } = applyRewardsToHero(baseHero, {
      exp: 100,
      gold: 0,
    });
    expect(leveledUp).toBe(true);
    expect(newLevel).toBe(2);
    expect(updatedHero.level).toBe(2);
  });

  it("restores HP and MP on level up", () => {
    const lowHpHero = { ...baseHero, hp: 10 };
    const { updatedHero } = applyRewardsToHero(lowHpHero, { exp: 100, gold: 0 });
    expect(updatedHero.hp).toBe(updatedHero.maxHp);
  });
});

describe("calculateBattleDamage", () => {
  // attack=10, defense=4 → base = max(1, 10 - floor(4/2)) = 8
  // rngMin: roll = -5 → max(1, 8-5) = 3
  // rngMid: roll =  0 → max(1, 8+0) = 8
  // rngMax: roll =  5 → max(1, 8+5) = 13

  it("returns at least 1 even against overwhelming defense", () => {
    expect(calculateBattleDamage(1, 999, rngMin)).toBeGreaterThanOrEqual(1);
  });

  it("returns deterministic minimum damage with rng=0", () => {
    expect(calculateBattleDamage(10, 4, rngMin)).toBe(3);
  });

  it("returns deterministic neutral damage with rng=0.5", () => {
    expect(calculateBattleDamage(10, 4, rngMid)).toBe(8);
  });

  it("returns deterministic maximum damage with rng≈1", () => {
    expect(calculateBattleDamage(10, 4, rngMax)).toBe(13);
  });

  it("higher attack deals more damage given the same rng and defense", () => {
    expect(calculateBattleDamage(50, 4, rngMid)).toBeGreaterThan(
      calculateBattleDamage(10, 4, rngMid)
    );
  });
});

describe("isQuestOverdue", () => {
  it("returns true for past dates", () => {
    expect(isQuestOverdue("2020-01-01")).toBe(true);
  });

  it("returns false for future dates", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isQuestOverdue(future.toISOString())).toBe(false);
  });
});

describe("daysUntilDeadline", () => {
  it("returns negative for past dates", () => {
    expect(daysUntilDeadline("2020-01-01")).toBeLessThan(0);
  });

  it("returns positive for future dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysUntilDeadline(future.toISOString())).toBeGreaterThanOrEqual(4);
  });
});

describe("createHeroProfile", () => {
  it("creates a level 1 hero with base stats", () => {
    const hero = createHeroProfile("id1", "Taro");
    expect(hero.level).toBe(1);
    expect(hero.totalExp).toBe(0);
    expect(hero.gold).toBe(0);
    expect(hero.hp).toBe(hero.maxHp);
    expect(hero.mp).toBe(hero.maxMp);
  });

  it("sets displayName correctly", () => {
    const hero = createHeroProfile("id2", "Hanako");
    expect(hero.displayName).toBe("Hanako");
  });
});
