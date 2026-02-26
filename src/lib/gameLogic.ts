import {
  DEFAULT_EXP_REWARDS,
  DEFAULT_GOLD_REWARDS,
  EXP_PENALTY_FACTOR,
  GOLD_PENALTY_FACTOR,
  HERO_STAT_GROWTH,
  MAX_LEVEL,
} from "@/constants/game";
import type { Difficulty, HeroProfile, QuestReward } from "@/types";
import { calculateLevelFromExp } from "./expCalculator";

/**
 * Calculates the EXP and Gold rewards for a quest based on its difficulty
 * and whether it was completed overdue.
 * @param difficulty The difficulty of the quest.
 * @param overdue True if the quest was completed after its deadline.
 * @returns An object containing the calculated `exp` and `gold` rewards.
 */
export function calculateQuestRewards(
  difficulty: Difficulty,
  overdue: boolean,
): QuestReward {
  let exp = DEFAULT_EXP_REWARDS[difficulty];
  let gold = DEFAULT_GOLD_REWARDS[difficulty];

  if (overdue) {
    exp = Math.floor(exp * EXP_PENALTY_FACTOR);
    gold = Math.floor(gold * GOLD_PENALTY_FACTOR);
  }

  return { exp, gold };
}

/**
 * Checks if a quest's deadline has passed.
 * @param deadlineDate The deadline date string (ISO format).
 * @returns True if the deadline is in the past, false otherwise.
 */
export function isQuestOverdue(deadlineDate: string): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of today for comparison
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0); // Normalize to start of deadline day

  return deadline.getTime() < now.getTime();
}

/**
 * Calculates the number of days until a quest's deadline.
 * @param deadlineDate The deadline date string (ISO format).
 * @returns The number of days until the deadline. Negative if overdue, 0 if today.
 */
export function daysUntilDeadline(deadlineDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Use ceil to count today as 0 if not passed
  return diffDays;
}

/**
 * Applies an EXP penalty if the quest is overdue.
 * @param baseExp The base experience points.
 * @param overdue True if the quest is overdue.
 * @returns The final experience points after penalty (if any).
 */
export function applyExpPenalty(baseExp: number, overdue: boolean): number {
  return overdue ? Math.floor(baseExp * EXP_PENALTY_FACTOR) : baseExp;
}

/**
 * Applies a Gold penalty if the quest is overdue.
 * @param baseGold The base gold.
 * @param overdue True if the quest is overdue.
 * @returns The final gold after penalty (if any).
 */
export function applyGoldPenalty(baseGold: number, overdue: boolean): number {
  return overdue ? Math.floor(baseGold * GOLD_PENALTY_FACTOR) : baseGold;
}

/**
 * Creates a new hero profile with initial stats.
 * @param userId The ID of the user associated with this hero.
 * @param displayName The chosen display name for the hero.
 * @returns A new `HeroProfile` object.
 */
export function createHeroProfile(
  userId: string,
  displayName: string,
): HeroProfile {
  return {
    id: userId, // Hero ID is the same as User ID
    displayName,
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
  };
}

/**
 * Levels up a hero, increasing their stats.
 * @param hero The current `HeroProfile` to level up.
 * @returns A new `HeroProfile` object with updated stats, or the original if already max level.
 */
export function levelUpHero(hero: HeroProfile): HeroProfile {
  if (hero.level >= MAX_LEVEL) {
    return hero; // Already at max level
  }

  const newLevel = hero.level + 1;
  const newMaxHp = hero.maxHp + HERO_STAT_GROWTH.hp;
  const newMaxMp = hero.maxMp + HERO_STAT_GROWTH.mp;
  const newAttack = hero.attack + HERO_STAT_GROWTH.attack;
  const newDefense = hero.defense + HERO_STAT_GROWTH.defense;

  return {
    ...hero,
    level: newLevel,
    maxHp: newMaxHp,
    hp: newMaxHp, // Fully restore HP on level up
    maxMp: newMaxMp,
    mp: newMaxMp, // Fully restore MP on level up
    attack: newAttack,
    defense: newDefense,
  };
}
