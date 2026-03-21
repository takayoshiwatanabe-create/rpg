/**
 * Game-related constants for Hero Homework Quest.
 * All values related to game mechanics, balance, and progression should be defined here.
 */

import type { Difficulty } from "@/types";

// ---------------------------------------------------------------------------
// Hero Progression
// ---------------------------------------------------------------------------

/**
 * Defines the experience points required to reach each level.
 * Index 0 is level 1, index 1 is level 2, etc.
 * The value at index `n` is the total EXP needed to reach level `n+1`.
 * This array should be cumulative.
 */
export const HERO_EXP_CURVE: number[] = [
  0, // Level 1 (0 EXP)
  100, // Level 2
  250, // Level 3
  450, // Level 4
  700, // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
  3250, // Level 11
  3850, // Level 12
  4500, // Level 13
  5200, // Level 14
  6000, // Level 15 (Max Level)
];

/**
 * The maximum level a hero can reach.
 * This should correspond to the length of `HERO_EXP_CURVE`.
 */
export const MAX_LEVEL: number = HERO_EXP_CURVE.length;

/**
 * Base HP growth per level.
 */
export const BASE_HP_GROWTH: number = 10;

/**
 * Base MP growth per level.
 */
export const BASE_MP_GROWTH: number = 5;

/**
 * Base Attack growth per level.
 */
export const BASE_ATTACK_GROWTH: number = 2;

/**
 * Base Defense growth per level.
 */
export const BASE_DEFENSE_GROWTH: number = 1;

/**
 * Defines how hero stats grow with each level.
 * This can be a simple multiplier or a more complex object per level.
 */
export const HERO_STAT_GROWTH = {
  hp: BASE_HP_GROWTH,
  mp: BASE_MP_GROWTH,
  attack: BASE_ATTACK_GROWTH,
  defense: BASE_DEFENSE_GROWTH,
};

// ---------------------------------------------------------------------------
// Quest Rewards & Penalties
// ---------------------------------------------------------------------------

/**
 * Default experience points awarded for quests based on difficulty.
 */
export const DEFAULT_EXP_REWARDS: Record<Difficulty, number> = {
  easy: 50,
  normal: 100,
  hard: 200,
  boss: 400,
};

/**
 * Default gold awarded for quests based on difficulty.
 */
export const DEFAULT_GOLD_REWARDS: Record<Difficulty, number> = {
  easy: 20,
  normal: 50,
  hard: 100,
  boss: 200,
};

/**
 * Penalty factor for EXP if a quest is completed overdue (e.g., 0.5 means 50% reduction).
 */
export const EXP_PENALTY_FACTOR: number = 0.5;

/**
 * Penalty factor for Gold if a quest is completed overdue (e.g., 0.5 means 50% reduction).
 */
export const GOLD_PENALTY_FACTOR: number = 0.5;

/**
 * Default estimated minutes for quests based on difficulty.
 */
export const DEFAULT_ESTIMATED_MINUTES: Record<Difficulty, number> = {
  easy: 15,
  normal: 30,
  hard: 60,
  boss: 120,
};

// ---------------------------------------------------------------------------
// Battle Mechanics
// ---------------------------------------------------------------------------

/**
 * Base damage calculation factor.
 */
export const BASE_DAMAGE_FACTOR: number = 10;

/**
 * Critical hit chance (e.g., 0.1 for 10%).
 */
export const CRITICAL_HIT_CHANCE: number = 0.1;

/**
 * Critical hit multiplier (e.g., 1.5 for 150% damage).
 */
export const CRITICAL_HIT_MULTIPLIER: number = 1.5;

// ---------------------------------------------------------------------------
// Inventory & Shop
// ---------------------------------------------------------------------------

/**
 * Initial inventory size for a new hero.
 */
export const INITIAL_INVENTORY_SIZE: number = 10;

/**
 * Cost to expand inventory by one slot.
 */
export const INVENTORY_EXPANSION_COST: number = 50;

// ---------------------------------------------------------------------------
// Other
// ---------------------------------------------------------------------------

/**
 * Default locale for new users if not detected.
 */
export const DEFAULT_LOCALE: string = "ja";

