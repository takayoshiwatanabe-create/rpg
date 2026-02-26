import { MAX_LEVEL } from "@/constants/game";

/**
 * Calculates the experience points required to advance from the current level to the next.
 * The EXP requirement increases with level, following a specific curve.
 *
 * @param level The current level of the hero (1-indexed).
 * @returns The amount of EXP needed to reach the next level.
 */
export function getExpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) {
    return 0; // No more EXP needed if at max level
  }
  // Example: Linear increase, then quadratic or exponential for higher levels
  // This is a simple example, adjust as per game design
  if (level < 10) {
    return 100 + (level - 1) * 50; // Level 1: 100, Level 2: 150, Level 3: 200...
  } else if (level < 50) {
    return 500 + (level - 10) * 25; // Level 10: 500, Level 11: 525...
  } else {
    return 1500 + (level - 50) * 50; // Level 50: 1500, Level 51: 1550...
  }
}

/**
 * Calculates the total experience points accumulated to reach the beginning of a given level.
 *
 * @param level The target level.
 * @returns The total EXP required to be at the start of `level`.
 */
export function getTotalExpForLevel(level: number): number {
  if (level <= 1) return 0;

  let totalExp = 0;
  for (let i = 1; i < level; i++) {
    totalExp += getExpToNextLevel(i);
  }
  return totalExp;
}

/**
 * Determines the current level of a hero based on their total accumulated experience points.
 *
 * @param totalExp The hero's total experience points.
 * @returns The current level of the hero.
 */
export function getLevelFromTotalExp(totalExp: number): number {
  let level = 1;
  while (level < MAX_LEVEL) {
    const expNeededForNextLevel = getExpToNextLevel(level);
    if (totalExp < getTotalExpForLevel(level + 1)) {
      break;
    }
    level++;
  }
  return level;
}

/**
 * Calculates the hero's progress within their current level.
 *
 * @param totalExp The hero's total experience points.
 * @returns An object containing `current` EXP within the level and `required` EXP for the next level.
 */
export function expProgressInCurrentLevel(
  totalExp: number,
): { current: number; required: number } {
  const currentLevel = getLevelFromTotalExp(totalExp);

  if (currentLevel >= MAX_LEVEL) {
    return { current: 0, required: 1 }; // At max level, progress is irrelevant or can be 0/1
  }

  const expAtStartOfCurrentLevel = getTotalExpForLevel(currentLevel);
  const expNeededForNextLevel = getExpToNextLevel(currentLevel);

  const currentExpInLevel = totalExp - expAtStartOfCurrentLevel;

  return {
    current: currentExpInLevel,
    required: expNeededForNextLevel,
  };
}

/**
 * Checks if the hero is at the maximum level.
 *
 * @param level The hero's current level.
 * @returns `true` if the hero is at or above the maximum level, `false` otherwise.
 */
export function isAtMaxLevel(level: number): boolean {
  return level >= MAX_LEVEL;
}

