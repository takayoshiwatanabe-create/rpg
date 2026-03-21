import type { Subject, Difficulty } from "@/types";

type MonsterInfo = {
  nameKey: string;
  emoji: string;
};

export const MONSTERS: Record<Subject, Record<Difficulty, MonsterInfo>> = {
  math: {
    easy: { nameKey: "monster.math.easy", emoji: "🐉" },
    normal: { nameKey: "monster.math.normal", emoji: "🐲" },
    hard: { nameKey: "monster.math.hard", emoji: "🗿" },
    boss: { nameKey: "monster.math.boss", emoji: "👑" },
  },
  japanese: {
    easy: { nameKey: "monster.japanese.easy", emoji: "👻" },
    normal: { nameKey: "monster.japanese.normal", emoji: "🧛" },
    hard: { nameKey: "monster.japanese.hard", emoji: "💀" },
    boss: { nameKey: "monster.japanese.boss", emoji: "🔥" },
  },
  english: {
    easy: { nameKey: "monster.english.easy", emoji: "🦇" },
    normal: { nameKey: "monster.english.normal", emoji: "🧙" },
    hard: { nameKey: "monster.english.hard", emoji: "👹" },
    boss: { nameKey: "monster.english.boss", emoji: "❄️" },
  },
  science: {
    easy: { nameKey: "monster.science.easy", emoji: "🫧" },
    normal: { nameKey: "monster.science.normal", emoji: "🦅" },
    hard: { nameKey: "monster.science.hard", emoji: "🐲" },
    boss: { nameKey: "monster.science.boss", emoji: "⚡" },
  },
  social: {
    easy: { nameKey: "monster.social.easy", emoji: "🐦‍⬛" },
    normal: { nameKey: "monster.social.normal", emoji: "🛡️" },
    hard: { nameKey: "monster.social.hard", emoji: "✨" },
    boss: { nameKey: "monster.social.boss", emoji: "😈" },
  },
  other: {
    easy: { nameKey: "monster.other.easy", emoji: "🐾" },
    normal: { nameKey: "monster.other.normal", emoji: "🧟" },
    hard: { nameKey: "monster.other.hard", emoji: "⚔️" },
    boss: { nameKey: "monster.other.boss", emoji: "🌀" },
  },
};

/**
 * Get monster info for a quest based on subject and difficulty.
 */
export function getMonster(subject: Subject, difficulty: Difficulty): MonsterInfo {
  return MONSTERS[subject][difficulty];
}

