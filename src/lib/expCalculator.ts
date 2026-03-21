import { HERO_EXP_CURVE, MAX_LEVEL } from "@/constants/game";

/**
 * Calculates the hero's current level based on their total experience points.
 * @param totalExp The hero's total accumulated experience points.
 * @returns The hero's current level (1-indexed).
 */
export function calculateLevelFromExp(totalExp: number): number {
  for (let i = 0; i < HERO_EXP_CURVE.length; i++) {
    if (totalExp < HERO_EXP_CURVE[i]) {
      return i; // Levels are 1-indexed, so if totalExp is less than exp to reach level i+1, it's level i.
                // HERO_EXP_CURVE[0] is 0, meaning 0 exp is level 1.
                // HERO_EXP_CURVE[1] is 100, meaning 0-99 exp is level 1.
                // If totalExp is 0, i=0, 0 < HERO_EXP_CURVE[0] (which is 0) is false.
                // This loop needs to be adjusted.
    }
  }
  return MAX_LEVEL; // If EXP is greater than or equal to max level threshold
}

/**
 * Calculates the hero's current level based on their total experience points.
 * Corrected logic:
 * HERO_EXP_CURVE: [0, 100, 250, 450, ...]
 * Level 1: totalExp < 100 (index 1)
 * Level 2: totalExp >= 100 (index 1) and totalExp < 250 (index 2)
 * Level 3: totalExp >= 250 (index 2) and totalExp < 450 (index 3)
 * ...
 * MAX_LEVEL: totalExp >= HERO_EXP_CURVE[MAX_LEVEL - 1]
 */
export function calculateLevelFromExpCorrected(totalExp: number): number {
  for (let i = 0; i < HERO_EXP_CURVE.length; i++) {
    if (totalExp < HERO_EXP_CURVE[i]) {
      // If totalExp is less than the EXP required to reach level (i+1),
      // then the current level is i. Since HERO_EXP_CURVE is 0-indexed for levels,
      // and levels are 1-indexed, this means:
      // i=0 (HERO_EXP_CURVE[0]=0): if totalExp < 0 (impossible), level 0 (invalid)
      // i=1 (HERO_EXP_CURVE[1]=100): if totalExp < 100, level 1.
      // i=2 (HERO_EXP_CURVE[2]=250): if totalExp < 250, level 2.
      // So, the level is 'i'.
      return i;
    }
  }
  // If totalExp is greater than or equal to the EXP required for the MAX_LEVEL,
  // then the hero is at MAX_LEVEL.
  return MAX_LEVEL;
}


/**
 * Calculates the hero's experience progress within their current level.
 * @param totalExp The hero's total accumulated experience points.
 * @returns An object containing `current` EXP in the level and `required` EXP for the next level.
 */
export function expProgressInCurrentLevel(
  totalExp: number,
): { current: number; required: number } {
  const currentLevel = calculateLevelFromExpCorrected(totalExp);

  if (currentLevel >= MAX_LEVEL) {
    return { current: 0, required: 0 }; // At max level, no more EXP needed
  }

  // HERO_EXP_CURVE stores the *total* EXP needed to *reach* a level.
  // Index 0: EXP to reach Level 1 (0)
  // Index 1: EXP to reach Level 2 (100)
  // Index 2: EXP to reach Level 3 (250)
  // ...
  // So, expToReachCurrentLevel is HERO_EXP_CURVE[currentLevel - 1]
  // And expToReachNextLevel is HERO_EXP_CURVE[currentLevel]

  const expToReachCurrentLevel = HERO_EXP_CURVE[currentLevel - 1];
  const expToReachNextLevel = HERO_EXP_CURVE[currentLevel];

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
