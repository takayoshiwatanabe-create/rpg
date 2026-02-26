import { DEFAULT_ESTIMATED_MINUTES, EXP_BASE, GOLD_BASE, MAX_LEVEL } from "@/constants/game";
import type { Difficulty, QuestRewards } from "@/types";

/**
 * Calculates base rewards (EXP and Gold) for a quest based on its difficulty.
 * @param difficulty The difficulty level of the quest.
 * @returns An object containing base EXP and Gold rewards.
 */
export function calculateBaseRewards(difficulty: Difficulty): QuestRewards {
  let expMultiplier = 1;
  let goldMultiplier = 1;

  switch (difficulty) {
    case "easy":
      expMultiplier = 0.8;
      goldMultiplier = 0.7;
      break;
    case "normal":
      expMultiplier = 1;
      goldMultiplier = 1;
      break;
    case "hard":
      expMultiplier = 1.5;
      goldMultiplier = 1.8;
      break;
    case "boss":
      expMultiplier = 2.5;
      goldMultiplier = 3.0;
      break;
    default:
      // Should not happen with TypeScript, but as a fallback
      console.warn(`Unknown difficulty: ${difficulty}. Using normal multipliers.`);
      break;
  }

  const exp = Math.floor(EXP_BASE * expMultiplier);
  const gold = Math.floor(GOLD_BASE * goldMultiplier);

  return { exp, gold };
}

/**
 * Applies an experience penalty if the quest is overdue.
 * @param baseExp The base experience reward.
 * @param isOverdue Whether the quest is overdue.
 * @returns The final experience reward after penalty.
 */
export function applyExpPenalty(baseExp: number, isOverdue: boolean): number {
  if (isOverdue) {
    return Math.floor(baseExp * 0.5); // 50% penalty for overdue quests
  }
  return baseExp;
}

/**
 * Applies a gold penalty if the quest is overdue.
 * @param baseGold The base gold reward.
 * @param isOverdue Whether the quest is overdue.
 * @returns The final gold reward after penalty.
 */
export function applyGoldPenalty(baseGold: number, isOverdue: boolean): number {
  if (isOverdue) {
    return Math.floor(baseGold * 0.3); // 70% penalty for overdue quests
  }
  return baseGold;
}

/**
 * Calculates the final quest rewards, including overdue penalties.
 * @param difficulty The difficulty of the quest.
 * @param isOverdue Whether the quest is overdue.
 * @returns The final EXP and Gold rewards.
 */
export function calculateQuestRewards(
  difficulty: Difficulty,
  isOverdue: boolean,
): QuestRewards {
  const { exp: baseExp, gold: baseGold } = calculateBaseRewards(difficulty);
  const finalExp = applyExpPenalty(baseExp, isOverdue);
  const finalGold = applyGoldPenalty(baseGold, isOverdue);
  return { exp: finalExp, gold: finalGold };
}

/**
 * Checks if a quest's deadline has passed.
 * @param deadlineDateString The deadline date in ISO string format.
 * @returns True if the quest is overdue, false otherwise.
 */
export function isQuestOverdue(deadlineDateString: string): boolean {
  const deadline = new Date(deadlineDateString);
  deadline.setHours(23, 59, 59, 999); // End of the deadline day
  const now = new Date();
  return now > deadline;
}

/**
 * Calculates the number of days remaining until a deadline.
 * Returns 0 if the deadline is today or has passed.
 * @param deadlineDateString The deadline date in ISO string format.
 * @returns The number of days remaining.
 */
export function daysUntilDeadline(deadlineDateString: string): number {
  const deadline = new Date(deadlineDateString);
  deadline.setHours(0, 0, 0, 0); // Start of the deadline day
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Creates a new hero profile with default stats.
 * @param userId The ID of the user who owns this hero.
 * @param displayName The hero's chosen display name.
 * @returns A new HeroProfile object.
 */
export function createHeroProfile(userId: string, displayName: string) {
  return {
    id: userId, // Hero ID is the same as User ID
    displayName,
    level: 1,
    totalExp: 0,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    attack: 10,
    defense: 5,
    gold: 0,
    sprite: "hero_default", // Default sprite name
    avatarId: "default_avatar", // Add a default avatarId
    createdAt: new Date().toISOString(),
  };
}
