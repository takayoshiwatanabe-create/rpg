// Re-exports from the canonical src/lib implementations.
// All game-logic pure functions live in src/lib/gameLogic.ts and
// src/lib/expCalculator.ts per CLAUDE.md §2.2 (pure functions, unit-test required).

export {
  expToNextLevel,
  totalExpForLevel,
  levelFromTotalExp,
  expProgressInCurrentLevel,
  heroStatsForLevel,
  calculateQuestRewards,
  applyRewardsToHero,
  isQuestOverdue,
  daysUntilDeadline,
  createHeroProfile,
} from "@/src/lib/gameLogic";

// calculateBattleDamage is an alias for calculateAttackDamage.
// The injectable `rng` parameter (default: Math.random) keeps the function pure
// and allows deterministic unit tests.
export { calculateAttackDamage as calculateBattleDamage } from "@/src/lib/gameLogic";
