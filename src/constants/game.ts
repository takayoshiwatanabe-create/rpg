import { Subject, Difficulty } from "@/types";

export const QUEST_SUBJECTS: Subject[] = [
  "math",
  "japanese",
  "english",
  "science",
  "social_studies",
  "art",
  "music",
  "pe",
  "other",
];

export const QUEST_DIFFICULTIES: Difficulty[] = [
  "easy",
  "normal",
  "hard",
  "very_hard",
];

// Base EXP and Gold rewards for each difficulty
export const BASE_REWARDS = {
  easy: { exp: 50, gold: 20 },
  normal: { exp: 100, gold: 40 },
  hard: { exp: 200, gold: 80 },
  very_hard: { exp: 400, gold: 150 },
};

// EXP required for each level
// Level 1: 0 EXP
// Level 2: 100 EXP
// Level 3: 250 EXP
// ...
export const LEVEL_UP_REQUIREMENTS = [
  0, // Level 1 (0 exp to reach)
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5
  1800, // Level 6
  2800, // Level 7
  4000, // Level 8
  5500, // Level 9
  7500, // Level 10
  // Add more levels as needed
];

// Overdue penalty percentage
export const OVERDUE_PENALTY_PERCENTAGE = 0.2; // 20% penalty

// Monster definitions
export const MONSTERS = {
  math: {
    easy: { emoji: "➕", nameKey: "monster.math.easy" },
    normal: { emoji: "➗", nameKey: "monster.math.normal" },
    hard: { emoji: "✖️", nameKey: "monster.math.hard" },
    very_hard: { emoji: "♾️", nameKey: "monster.math.very_hard" },
  },
  japanese: {
    easy: { emoji: "📖", nameKey: "monster.japanese.easy" },
    normal: { emoji: "✍️", nameKey: "monster.japanese.normal" },
    hard: { emoji: "📜", nameKey: "monster.japanese.hard" },
    very_hard: { emoji: "⛩️", nameKey: "monster.japanese.very_hard" },
  },
  english: {
    easy: { emoji: "🅰️", nameKey: "monster.english.easy" },
    normal: { emoji: "🗣️", nameKey: "monster.english.normal" },
    hard: { emoji: "🇬🇧", nameKey: "monster.english.hard" },
    very_hard: { emoji: "🇺🇸", nameKey: "monster.english.very_hard" },
  },
  science: {
    easy: { emoji: "🧪", nameKey: "monster.science.easy" },
    normal: { emoji: "⚛️", nameKey: "monster.science.normal" },
    hard: { emoji: "🔬", nameKey: "monster.science.hard" },
    very_hard: { emoji: "🔭", nameKey: "monster.science.very_hard" },
  },
  social_studies: {
    easy: { emoji: "🗺️", nameKey: "monster.social_studies.easy" },
    normal: { emoji: "🏛️", nameKey: "monster.social_studies.normal" },
    hard: { emoji: "🌍", nameKey: "monster.social_studies.hard" },
    very_hard: { emoji: "👑", nameKey: "monster.social_studies.very_hard" },
  },
  art: {
    easy: { emoji: "🎨", nameKey: "monster.art.easy" },
    normal: { emoji: "🖼️", nameKey: "monster.art.normal" },
    hard: { emoji: "🖌️", nameKey: "monster.art.hard" },
    very_hard: { emoji: "🎭", nameKey: "monster.art.very_hard" },
  },
  music: {
    easy: { emoji: "🎵", nameKey: "monster.music.easy" },
    normal: { emoji: "🎶", nameKey: "monster.music.normal" },
    hard: { emoji: "🎼", nameKey: "monster.music.hard" },
    very_hard: { emoji: "🎹", nameKey: "monster.music.very_hard" },
  },
  pe: {
    easy: { emoji: "🏃", nameKey: "monster.pe.easy" },
    normal: { emoji: "⛹️", nameKey: "monster.pe.normal" },
    hard: { emoji: "🏋️", nameKey: "monster.pe.hard" },
    very_hard: { emoji: "🏅", nameKey: "monster.pe.very_hard" },
  },
  other: {
    easy: { emoji: "❓", nameKey: "monster.other.easy" },
    normal: { emoji: "👻", nameKey: "monster.other.normal" },
    hard: { emoji: "👾", nameKey: "monster.other.hard" },
    very_hard: { emoji: "🐉", nameKey: "monster.other.very_hard" },
  },
};

export function getMonster(subject: Subject, difficulty: Difficulty) {
  return MONSTERS[subject]?.[difficulty] || MONSTERS.other.easy;
}

