import { HERO_EXP_CURVE, MAX_LEVEL } from "@/constants/game";

/**
 * Calculates the hero's current level based on their total experience points.
 * @param totalExp The hero's total accumulated experience points.
 * @returns The hero's current level (1-indexed).
 */
export function calculateLevelFromExp(totalExp: number): number {
  for (let i = 0; i < HERO_EXP_CURVE.length; i++) {
    if (totalExp < HERO_EXP_CURVE[i]) {
      return i + 1; // Levels are 1-indexed
    }
  }
  return MAX_LEVEL; // If EXP is greater than or equal to max level threshold
}

/**
 * Calculates the hero's experience progress within their current level.
 * @param totalExp The hero's total accumulated experience points.
 * @returns An object containing `current` EXP in the level and `required` EXP for the next level.
 */
export function expProgressInCurrentLevel(
  totalExp: number,
): { current: number; required: number } {
  const currentLevel = calculateLevelFromExp(totalExp);

  if (currentLevel >= MAX_LEVEL) {
    return { current: 0, required: 0 }; // At max level, no more EXP needed
  }

  const expToReachCurrentLevel =
    currentLevel > 1 ? HERO_EXP_CURVE[currentLevel - 2] : 0;
  const expToReachNextLevel = HERO_EXP_CURVE[currentLevel - 1];

  const currentLevelExp = totalExp - expToReachCurrentLevel;
  const requiredForNextLevel = expToReachNextLevel - expToReachCurrentLevel;

  return {
    current: currentLevelExp,
    required: requiredForNextLevel,
  };
}

/**
 * Checks if the hero is at the maximum possible level.
 * @param level The hero's current level.
 * @returns True if the hero is at max level, false otherwise.
 */
export function isAtMaxLevel(level: number): boolean {
  return level >= MAX_LEVEL;
}
