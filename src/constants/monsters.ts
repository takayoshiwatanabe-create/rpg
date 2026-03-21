import type { Subject, Difficulty } from "@/types";
import { MONSTER_SPRITE_MAP } from "./game"; // Import MONSTER_SPRITE_MAP

export type MonsterInfo = {
  nameKey: string;
  emoji: string;
};

export function getMonsterInfo(subject: Subject, difficulty: Difficulty): MonsterInfo | undefined {
  return MONSTER_SPRITE_MAP[subject]?.[difficulty];
}
