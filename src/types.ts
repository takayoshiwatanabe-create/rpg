import { Timestamp } from "firebase/firestore";

// User Profile
export type UserProfile = {
  userId: string;
  email: string;
  role: "parent" | "child";
  createdAt: Timestamp | Date | string;
};

// Hero Profile
export type Subject =
  | "math"
  | "japanese"
  | "english"
  | "science"
  | "social_studies"
  | "art"
  | "music"
  | "pe"
  | "other";

export type Difficulty = "easy" | "normal" | "hard" | "very_hard";

export type Skill = {
  id: string;
  name: string;
  description: string;
  levelRequired: number;
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  type: "consumable" | "equipment" | "material";
};

export type HeroProfile = {
  id: string; // Same as userId
  userId: string;
  displayName: string;
  level: number;
  currentExp: number; // EXP within current level
  totalExp: number; // Total accumulated EXP
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  skills: Skill[];
  inventory: InventoryItem[];
  createdAt: Timestamp | Date | string;
};

// Quests
export type QuestStatus = "pending" | "inProgress" | "completed" | "failed";

export type Quest = {
  id: string;
  userId: string; // The user who created the quest (parent or child)
  heroId: string; // The hero assigned to this quest
  title: string;
  subject: Subject;
  difficulty: Difficulty;
  status: QuestStatus;
  deadlineDate: string; // YYYY-MM-DD format
  estimatedMinutes: number;
  expReward: number;
  goldReward: number;
  createdAt: Timestamp | Date | string;
  deletedAt: Timestamp | Date | string | null;
};

// Battle Sessions (Records of completed quests)
export type BattleSession = {
  id: string;
  userId: string;
  questId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationSeconds: number;
  status: "completed" | "failed"; // Was the quest completed or abandoned?
  rewards: {
    exp: number;
    gold: number;
  };
  createdAt: Timestamp | Date | string;
};

