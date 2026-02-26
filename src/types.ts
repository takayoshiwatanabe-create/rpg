// ---------------------------------------------------------------------------
// Core Game Types
// ---------------------------------------------------------------------------

export type AccountRole = "child" | "parent";

export type Subject =
  | "math"
  | "japanese"
  | "english"
  | "science"
  | "social"
  | "other";

export type Difficulty = "easy" | "normal" | "hard" | "boss";

export type QuestStatus = "pending" | "inProgress" | "completed" | "abandoned";

export type QuestRewards = {
  exp: number;
  gold: number;
};

export type HeroStats = {
  level: number;
  totalExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  gold: number;
};

// ---------------------------------------------------------------------------
// Firestore Document Types
// ---------------------------------------------------------------------------

/**
 * Represents a user's profile stored in Firestore.
 * Corresponds to `users/{userId}/profile` document.
 */
export type UserProfile = {
  role: AccountRole;
  locale: string;
  createdAt: string; // ISO string
  lastLoginAt?: string; // ISO string
};

/**
 * Represents a hero's profile (child account's game state).
 * Corresponds to `users/{userId}/hero/{heroId}` document.
 */
export type HeroProfile = HeroStats & {
  id: string; // Same as userId for simplicity
  displayName: string;
  avatarId: string; // Reference to an avatar sprite
  userId: string; // Parent user's ID if applicable, or self for child
  createdAt: string; // ISO string
  lastActiveAt: string; // ISO string
};

/**
 * Represents a single quest (homework assignment).
 * Corresponds to `quests/{questId}` document.
 */
export type Quest = {
  id: string;
  userId: string; // The user who created/owns this quest
  heroId: string; // The hero assigned to this quest
  title: string;
  subject: Subject;
  difficulty: Difficulty;
  status: QuestStatus;
  deadlineDate: string; // YYYY-MM-DD format
  estimatedMinutes: number;
  expReward: number;
  goldReward: number;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string, if status is 'completed'
  deletedAt: string | null; // ISO string, for soft deletion
};

// ---------------------------------------------------------------------------
// UI & Theming Types
// ---------------------------------------------------------------------------

/**
 * Defines the allowed color keys for `PixelText` and other UI components.
 * These keys map to specific color values in `constants/theme.ts`.
 */
export type TextColor =
  | "primary"
  | "secondary"
  | "gold"
  | "goldDark"
  | "cream"
  | "gray"
  | "grayDark"
  | "hp" // Health points color
  | "mp" // Magic points color
  | "exp" // Experience points color
  | "danger" // Error/warning color
  | Subject // Colors for each subject
  | Difficulty; // Colors for each difficulty

