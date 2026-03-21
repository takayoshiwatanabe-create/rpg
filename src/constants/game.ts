import { Subject, Difficulty } from "@/types";

export const QUEST_SUBJECTS: Subject[] = [
  // Aligned with src/constants/quests.ts
  "math",
  "japanese",
  "english",
  "science",
  "social", // Changed from social_studies to social for consistency
  "art",
  "music",
  "pe",
  "home_economics",
  "programming",
];

export const QUEST_DIFFICULTIES: Difficulty[] = [
  // Aligned with src/constants/quests.ts
  "easy",
  "normal",
  "hard",
  "very_hard",
];

export const HERO_INITIAL_STATS = {
  level: 1,
  currentExp: 0,
  nextLevelExp: 100,
  totalExp: 0,
  gold: 0,
  currentHp: 100,
  maxHp: 100,
  attack: 10,
  defense: 5,
};

export const LEVEL_UP_EXP_MULTIPLIER = 1.5; // EXP needed for next level increases by this factor
export const LEVEL_UP_HP_GAIN = 10;
export const LEVEL_UP_ATTACK_GAIN = 2;
export const LEVEL_UP_DEFENSE_GAIN = 1;

export const MONSTER_BASE_STATS = {
  easy: { hp: 30, attack: 5, exp: 20, gold: 10 },
  normal: { hp: 60, attack: 10, exp: 50, gold: 25 },
  hard: { hp: 100, attack: 15, exp: 100, gold: 50 },
  very_hard: { hp: 150, attack: 20, exp: 150, gold: 75 },
};

export const MONSTER_SPRITE_MAP = {
  math: {
    easy: { emoji: "➕", nameKey: "monster.math.easy" },
    normal: { emoji: "✖️", nameKey: "monster.math.normal" },
    hard: { emoji: "➗", nameKey: "monster.math.hard" },
    very_hard: { emoji: "♾️", nameKey: "monster.math.very_hard" },
  },
  japanese: {
    easy: { emoji: "📖", nameKey: "monster.japanese.easy" },
    normal: { emoji: "📝", nameKey: "monster.japanese.normal" },
    hard: { emoji: "📜", nameKey: "monster.japanese.hard" },
    very_hard: { emoji: "⛩️", nameKey: "monster.japanese.very_hard" },
  },
  english: {
    easy: { emoji: "🅰️", nameKey: "monster.english.easy" },
    normal: { emoji: "🅱️", nameKey: "monster.english.normal" },
    hard: { emoji: "🔠", nameKey: "monster.english.hard" },
    very_hard: { emoji: "🇬🇧", nameKey: "monster.english.very_hard" },
  },
  science: {
    easy: { emoji: "🧪", nameKey: "monster.science.easy" },
    normal: { emoji: "⚛️", nameKey: "monster.science.normal" },
    hard: { emoji: "🔬", nameKey: "monster.science.hard" },
    very_hard: { emoji: "🔭", nameKey: "monster.science.very_hard" },
  },
  social: {
    easy: { emoji: "🗺️", nameKey: "monster.social.easy" },
    normal: { emoji: "🏛️", nameKey: "monster.social.normal" },
    hard: { emoji: "🌍", nameKey: "monster.social.hard" },
    very_hard: { emoji: "👑", nameKey: "monster.social.very_hard" },
  },
  art: {
    easy: { emoji: "🎨", nameKey: "monster.art.easy" },
    normal: { emoji: "🖼️", nameKey: "monster.art.normal" },
    hard: { emoji: "🎭", nameKey: "monster.art.hard" },
    very_hard: { emoji: "🏛️", nameKey: "monster.art.very_hard" },
  },
  music: {
    easy: { emoji: "🎵", nameKey: "monster.music.easy" },
    normal: { emoji: "🎶", nameKey: "monster.music.normal" },
    hard: { emoji: "🎼", nameKey: "monster.music.hard" },
    very_hard: { emoji: "🎹", nameKey: "monster.music.very_hard" },
  },
  pe: {
    easy: { emoji: "🏃", nameKey: "monster.pe.easy" },
    normal: { emoji: "⚽", nameKey: "monster.pe.normal" },
    hard: { emoji: "🏀", nameKey: "monster.pe.hard" },
    very_hard: { emoji: "🏅", nameKey: "monster.pe.very_hard" },
  },
  home_economics: {
    easy: { emoji: "🏠", nameKey: "monster.home_economics.easy" },
    normal: { emoji: "🍳", nameKey: "monster.home_economics.normal" },
    hard: { emoji: "🧵", nameKey: "monster.home_economics.hard" },
    very_hard: { emoji: "🏡", nameKey: "monster.home_economics.very_hard" },
  },
  programming: {
    easy: { emoji: "💻", nameKey: "monster.programming.easy" },
    normal: { emoji: "👾", nameKey: "monster.programming.normal" },
    hard: { emoji: "🤖", nameKey: "monster.programming.hard" },
    very_hard: { emoji: "🧠", nameKey: "monster.programming.very_hard" },
  },
};
