import type { ExpProgress } from "@/types";
import { MAX_HERO_LEVEL, EXP_PER_LEVEL_FACTOR, OVERDUE_PENALTY } from "@/constants/game";

/**
 * EXP required to advance from `level` to `level + 1`.
 * Returns 0 at the level cap.
 */
export function expToNextLevel(level: number): number {
  if (level >= MAX_HERO_LEVEL) return 0;
  return level * EXP_PER_LEVEL_FACTOR;
}

/**
 * Cumulative EXP needed to *reach* `level` from level 1.
 * e.g. totalExpForLevel(1) === 0, totalExpForLevel(2) === 100, totalExpForLevel(3) === 300.
 */
export function totalExpForLevel(level: number): number {
  return (EXP_PER_LEVEL_FACTOR * (level - 1) * level) / 2;
}

/**
 * Derive the hero's current level from lifetime accumulated EXP.
 * Result is clamped to [1, MAX_HERO_LEVEL].
 */
export function levelFromTotalExp(totalExp: number): number {
  // Solve for level `L` in `totalExp = EXP_PER_LEVEL_FACTOR * (L-1) * L / 2`
  // This is a quadratic equation: `L^2 - L - (2 * totalExp / EXP_PER_LEVEL_FACTOR) = 0`
  // Using the quadratic formula: `L = (1 + sqrt(1 + 8 * totalExp / EXP_PER_LEVEL_FACTOR)) / 2`
  const discriminant = 1 + (8 * totalExp) / EXP_PER_LEVEL_FACTOR;
  const level = Math.floor((1 + Math.sqrt(discriminant)) / 2);
  return Math.min(Math.max(1, level), MAX_HERO_LEVEL);
}

/**
 * Progress within the current level as `{ current, required, percentage }`.
 * `percentage` is in [0, 1]; equals 1 at the level cap.
 */
export function expProgressInCurrentLevel(totalExp: number): ExpProgress {
  const level = levelFromTotalExp(totalExp);
  const expAtLevelStart = totalExpForLevel(level);
  const current = totalExp - expAtLevelStart;
  const required = expToNextLevel(level);
  const percentage = required > 0 ? Math.min(1, current / required) : 1;
  return { current, required, percentage };
}

/**
 * Whether the hero has reached the level cap.
 */
export function isAtMaxLevel(level: number): boolean {
  return level >= MAX_HERO_LEVEL;
}

/**
 * Apply the overdue penalty to a raw EXP amount.
 * Result is always a non-negative integer.
 */
export function applyExpPenalty(baseExp: number, isOverdue: boolean): number {
  const multiplier = isOverdue ? OVERDUE_PENALTY.expMultiplier : 1;
  return Math.max(0, Math.floor(baseExp * multiplier));
}


