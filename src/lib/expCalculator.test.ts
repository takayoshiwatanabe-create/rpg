import { describe, it, expect } from "vitest";
import {
  expToNextLevel,
  totalExpForLevel,
  levelFromTotalExp,
  expProgressInCurrentLevel,
  isAtMaxLevel,
  applyExpPenalty,
} from "./expCalculator";
import { MAX_HERO_LEVEL } from "@/constants/game";

describe("expToNextLevel", () => {
  it("returns 100 for level 1", () => {
    expect(expToNextLevel(1)).toBe(100);
  });

  it("scales linearly: level * 100", () => {
    expect(expToNextLevel(5)).toBe(500);
    expect(expToNextLevel(10)).toBe(1_000);
    expect(expToNextLevel(50)).toBe(5_000);
  });

  it("returns 0 at max level", () => {
    expect(expToNextLevel(MAX_HERO_LEVEL)).toBe(0);
  });

  it("returns 0 above max level", () => {
    expect(expToNextLevel(MAX_HERO_LEVEL + 1)).toBe(0);
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

  it("follows triangular-number formula: 100+200+...+(level-1)*100", () => {
    expect(totalExpForLevel(5)).toBe(1_000); // 100+200+300+400
  });
});

describe("levelFromTotalExp", () => {
  it("returns 1 at 0 EXP", () => {
    expect(levelFromTotalExp(0)).toBe(1);
  });

  it("stays at 1 just below the first threshold", () => {
    expect(levelFromTotalExp(99)).toBe(1);
  });

  it("returns 2 at exactly 100 EXP", () => {
    expect(levelFromTotalExp(100)).toBe(2);
  });

  it("returns 3 at exactly 300 EXP", () => {
    expect(levelFromTotalExp(300)).toBe(3);
  });

  it("is capped at MAX_HERO_LEVEL regardless of EXP", () => {
    expect(levelFromTotalExp(999_999_999)).toBe(MAX_HERO_LEVEL);
  });

  it("round-trips with totalExpForLevel for levels 1–30", () => {
    for (let lv = 1; lv <= 30; lv++) {
      expect(levelFromTotalExp(totalExpForLevel(lv))).toBe(lv);
    }
  });
});

describe("expProgressInCurrentLevel", () => {
  it("returns 0% at the start of level 1", () => {
    const p = expProgressInCurrentLevel(0);
    expect(p.current).toBe(0);
    expect(p.required).toBe(100);
    expect(p.percentage).toBe(0);
  });

  it("returns ~50% at the midpoint of level 1", () => {
    const p = expProgressInCurrentLevel(50);
    expect(p.percentage).toBeCloseTo(0.5);
  });

  it("returns 100% at max level", () => {
    const p = expProgressInCurrentLevel(totalExpForLevel(MAX_HERO_LEVEL));
    expect(p.percentage).toBe(1);
  });

  it("percentage stays in [0, 1] for arbitrary EXP values", () => {
    for (const exp of [0, 99, 100, 250, 1_000, 9_999]) {
      const { percentage } = expProgressInCurrentLevel(exp);
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(1);
    }
  });
});

describe("isAtMaxLevel", () => {
  it("returns false below max level", () => {
    expect(isAtMaxLevel(1)).toBe(false);
    expect(isAtMaxLevel(MAX_HERO_LEVEL - 1)).toBe(false);
  });

  it("returns true at max level", () => {
    expect(isAtMaxLevel(MAX_HERO_LEVEL)).toBe(true);
  });

  it("returns true above max level", () => {
    expect(isAtMaxLevel(MAX_HERO_LEVEL + 1)).toBe(true);
  });
});

describe("applyExpPenalty", () => {
  it("returns full EXP when not overdue", () => {
    expect(applyExpPenalty(100, false)).toBe(100);
    expect(applyExpPenalty(200, false)).toBe(200);
  });

  it("returns 75% (floored) when overdue", () => {
    expect(applyExpPenalty(100, true)).toBe(75);
    expect(applyExpPenalty(200, true)).toBe(150);
    expect(applyExpPenalty(1, true)).toBe(0); // floor(0.75) === 0
  });

  it("never returns negative EXP", () => {
    expect(applyExpPenalty(0, true)).toBe(0);
    expect(applyExpPenalty(0, false)).toBe(0);
  });
});

