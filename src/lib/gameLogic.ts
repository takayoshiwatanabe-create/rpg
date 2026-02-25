import type {
  Difficulty,
  HeroProfile,
  BattleReward,
  HeroStats,
  BattleEnemy,
  BattleOutcome,
  Subject,
} from "@/types";
import {
  DIFFICULTY_CONFIG,
  OVERDUE_PENALTY,
  HERO_BASE_STATS,
  BATTLE_DAMAGE_VARIANCE,
  SUBJECT_SPRITE_IDS,
} from "@/constants/game";
import { levelFromTotalExp } from "./expCalculator";

// Re-export for consumers who only depend on this module.
export { isAtMaxLevel, applyExpPenalty } from "./expCalculator";

// ---------------------------------------------------------------------------
// Hero stats
// ---------------------------------------------------------------------------

export function heroStatsForLevel(level: number): HeroStats {
  return {
    maxHp: HERO_BASE_STATS.hp + (level - 1) * HERO_BASE_STATS.hpPerLevel,
    maxMp: HERO_BASE_STATS.mp + (level - 1) * HERO_BASE_STATS.mpPerLevel,
    attack: HERO_BASE_STATS.attack + (level - 1) * HERO_BASE_STATS.attackPerLevel,
    defense: HERO_BASE_STATS.defense + (level - 1) * HERO_BASE_STATS.defensePerLevel,
  };
}

export function createHeroProfile(id: string, displayName: string): HeroProfile {
  const stats = heroStatsForLevel(1);
  return {
    id,
    displayName,
    avatarId: "hero_default",
    level: 1,
    totalExp: 0,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    mp: stats.maxMp,
    maxMp: stats.maxMp,
    attack: stats.attack,
    defense: stats.defense,
    gold: 0,
  };
}

// ---------------------------------------------------------------------------
// Quest rewards
// ---------------------------------------------------------------------------

export interface QuestRewards {
  exp: number;
  gold: number;
}

export function calculateQuestRewards(
  difficulty: Difficulty,
  isOverdue: boolean
): QuestRewards {
  const config = DIFFICULTY_CONFIG[difficulty];
  const expMultiplier = isOverdue ? OVERDUE_PENALTY.expMultiplier : 1;
  const goldMultiplier = isOverdue ? OVERDUE_PENALTY.goldMultiplier : 1;
  return {
    exp: Math.floor(config.expReward * expMultiplier),
    gold: Math.floor(config.goldReward * goldMultiplier),
  };
}

// ---------------------------------------------------------------------------
// Gold drop rate
// ---------------------------------------------------------------------------

export interface GoldDropOptions {
  difficulty: Difficulty;
  isOverdue: boolean;
  /** Streak / performance bonus applied after the overdue penalty. Default: 1. */
  bonusMultiplier?: number;
}

/**
 * Calculate the gold awarded for completing a quest.
 * Overdue penalty and bonus multipliers stack multiplicatively.
 * Result is always a non-negative integer.
 */
export function calculateGoldDrop(options: GoldDropOptions): number {
  const { difficulty, isOverdue, bonusMultiplier = 1 } = options;
  const base = DIFFICULTY_CONFIG[difficulty].goldReward;
  const overdueMultiplier = isOverdue ? OVERDUE_PENALTY.goldMultiplier : 1;
  return Math.max(0, Math.floor(base * overdueMultiplier * bonusMultiplier));
}

// ---------------------------------------------------------------------------
// Battle engine — injectable RNG for deterministic unit tests
// ---------------------------------------------------------------------------

/** Random number generator type. Inject a stub in tests for determinism. */
export type RngFn = () => number;

/**
 * Calculate damage for a single attack hit.
 * Variance is applied symmetrically around the base value.
 * Minimum damage is always 1.
 */
export function calculateAttackDamage(
  attackerAttack: number,
  defenderDefense: number,
  rng: RngFn = Math.random
): number {
  const base = Math.max(1, attackerAttack - Math.floor(defenderDefense / 2));
  const roll = Math.floor(rng() * (BATTLE_DAMAGE_VARIANCE * 2 + 1)) - BATTLE_DAMAGE_VARIANCE;
  return Math.max(1, base + roll);
}

export interface BattleSimulationResult {
  outcome: BattleOutcome;
  heroHpRemaining: number;
  enemyHpRemaining: number;
  turnsElapsed: number;
  totalDamageDealtToEnemy: number;
  totalDamageTakenByHero: number;
}

const MAX_BATTLE_TURNS = 100;

/**
 * Simulate a full battle turn-by-turn.
 * Hero always acts first within each turn. Returns a complete, deterministic
 * result for a given `rng`.
 */
export function simulateBattle(
  hero: HeroStats & { currentHp: number },
  enemy: BattleEnemy,
  rng: RngFn = Math.random
): BattleSimulationResult {
  let heroHp = hero.currentHp;
  let enemyHp = enemy.currentHp;
  let turns = 0;
  let totalDamageDealtToEnemy = 0;
  let totalDamageTakenByHero = 0;

  while (heroHp > 0 && enemyHp > 0 && turns < MAX_BATTLE_TURNS) {
    turns++;

    const heroHit = calculateAttackDamage(hero.attack, enemy.defense, rng);
    enemyHp = Math.max(0, enemyHp - heroHit);
    totalDamageDealtToEnemy += heroHit;

    if (enemyHp === 0) break;

    const enemyHit = calculateAttackDamage(enemy.attack, hero.defense, rng);
    heroHp = Math.max(0, heroHp - enemyHit);
    totalDamageTakenByHero += enemyHit;
  }

  return {
    outcome: determineBattleOutcome(heroHp, enemyHp),
    heroHpRemaining: heroHp,
    enemyHpRemaining: enemyHp,
    turnsElapsed: turns,
    totalDamageDealtToEnemy,
    totalDamageTakenByHero,
  };
}

/**
 * Determine the battle outcome from final HP values.
 * A hero at 0 HP is always a defeat, even if the enemy also reached 0.
 */
export function determineBattleOutcome(
  heroFinalHp: number,
  enemyFinalHp: number
): BattleOutcome {
  return heroFinalHp > 0 && enemyFinalHp <= 0 ? "victory" : "defeat";
}

/**
 * Construct a BattleEnemy ready for `simulateBattle` from quest parameters.
 */
export function createEnemyFromQuest(
  questId: string,
  subject: Subject,
  difficulty: Difficulty
): BattleEnemy {
  void questId; // reserved for future per-quest enemy customisation
  const config = DIFFICULTY_CONFIG[difficulty];
  return {
    nameKey: `enemy.${subject}.${difficulty}`,
    spriteId: SUBJECT_SPRITE_IDS[subject],
    maxHp: config.enemyHp,
    currentHp: config.enemyHp,
    attack: config.enemyAttack,
    defense: config.enemyDefense,
  };
}

// ---------------------------------------------------------------------------
// Reward application
// ---------------------------------------------------------------------------

/**
 * Apply EXP and gold rewards to a hero, handling level-up when the threshold
 * is crossed. Pure — returns a new hero object without mutating the input.
 */
export function applyRewardsToHero(
  hero: HeroProfile,
  reward: Pick<BattleReward, "exp" | "gold">
): { updatedHero: HeroProfile; leveledUp: boolean; newLevel: number } {
  const newTotalExp = hero.totalExp + reward.exp;
  const oldLevel = levelFromTotalExp(hero.totalExp);
  const newLevel = levelFromTotalExp(newTotalExp);
  const leveledUp = newLevel > oldLevel;

  let updatedHero: HeroProfile = {
    ...hero,
    totalExp: newTotalExp,
    gold: hero.gold + reward.gold,
  };

  if (leveledUp) {
    const newStats = heroStatsForLevel(newLevel);
    updatedHero = {
      ...updatedHero,
      level: newLevel,
      maxHp: newStats.maxHp,
      maxMp: newStats.maxMp,
      attack: newStats.attack,
      defense: newStats.defense,
      hp: newStats.maxHp,
      mp: newStats.maxMp,
    };
  }

  return { updatedHero, leveledUp, newLevel };
}

// ---------------------------------------------------------------------------
// Date utilities (pure — no side effects, no I/O)
// ---------------------------------------------------------------------------

export function isQuestOverdue(deadlineDate: string): boolean {
  const deadline = new Date(deadlineDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
}

export function daysUntilDeadline(deadlineDate: string): number {
  const deadline = new Date(deadlineDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Convenience re-exports from expCalculator so callers can depend on a single
// import path for all game maths.
export { expToNextLevel, totalExpForLevel, levelFromTotalExp, expProgressInCurrentLevel } from "./expCalculator";
