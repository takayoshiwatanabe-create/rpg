import type { Difficulty, Subject } from "@/types";

export const MAX_HERO_LEVEL = 99;

export const EXP_PER_LEVEL_FACTOR = 100;

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    expReward: number;
    goldReward: number;
    enemyHp: number;
    enemyAttack: number;
    enemyDefense: number;
  }
> = {
  easy: { expReward: 50, goldReward: 30, enemyHp: 50, enemyAttack: 5, enemyDefense: 2 },
  normal: { expReward: 100, goldReward: 60, enemyHp: 100, enemyAttack: 10, enemyDefense: 5 },
  hard: { expReward: 200, goldReward: 120, enemyHp: 200, enemyAttack: 20, enemyDefense: 10 },
  boss: { expReward: 500, goldReward: 300, enemyHp: 500, enemyAttack: 40, enemyDefense: 20 },
};

export const OVERDUE_PENALTY = {
  expMultiplier: 0.75,
  goldMultiplier: 0.5,
} as const;

export const HERO_BASE_STATS = {
  hp: 100,
  hpPerLevel: 20,
  mp: 50,
  mpPerLevel: 10,
  attack: 10,
  attackPerLevel: 2,
  defense: 5,
  defensePerLevel: 1,
} as const;

export const SUBJECT_SPRITE_IDS: Record<Subject, string> = {
  math: "enemy_math",
  japanese: "enemy_japanese",
  english: "enemy_english",
  science: "enemy_science",
  social: "enemy_social",
  other: "enemy_other",
};

export const BATTLE_DAMAGE_VARIANCE = 5;

export const DEFAULT_ESTIMATED_MINUTES: Record<Difficulty, number> = {
  easy: 15,
  normal: 30,
  hard: 60,
  boss: 90,
};

export const FREE_PLAN_QUEST_LIMIT = 5;
