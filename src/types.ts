/**
 * This file contains all the TypeScript type definitions for the Hero Homework Quest project.
 * It serves as a single source of truth for data structures used throughout the application.
 */

// ---------------------------------------------------------------------------
// Core Application Types
// ---------------------------------------------------------------------------

/**
 * Represents the role of a user account.
 * - 'child': A primary user who completes quests.
 * - 'parent': A supervisory user who can manage child accounts and quests.
 */
/** Supported locale codes matching the i18n translation files. */
export type Locale = "ja" | "en" | "zh" | "ko" | "es" | "fr" | "de" | "pt" | "ar" | "hi";

export type AccountRole = "child" | "parent";

/**
 * Defines the structure for a user's profile stored in Firestore.
 */
export type UserProfile = {
  id: string;
  role: AccountRole;
  locale: string; // e.g., 'en', 'ja'
  createdAt: string; // ISO date string
  lastLoginAt?: string; // ISO date string
  parentId?: string; // For child accounts, links to parent user ID
  childIds?: string[]; // For parent accounts, lists child user IDs
};

// ---------------------------------------------------------------------------
// Game-Specific Types
// ---------------------------------------------------------------------------

/**
 * Represents the profile and current stats of a hero character.
 * This is tied to a 'child' user account.
 */
export type HeroProfile = {
  id: string; // Same as userId
  displayName: string;
  level: number;
  totalExp: number;
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  // Add other hero-specific stats or properties as needed
};

/**
 * Represents an item in the hero's inventory.
 */
export type InventoryItem = {
  itemId: string;
  quantity: number;
  // Potentially add item-specific properties like 'durability', 'enchantment', etc.
};

/**
 * Represents the items currently equipped by the hero.
 */
export type EquippedItems = {
  weapon?: string; // itemId
  armor?: string; // itemId
  accessory?: string; // itemId
  // Add other equipment slots as needed
};

/**
 * Defines the possible subjects for a quest (homework).
 */
export type Subject =
  | "math"
  | "japanese"
  | "english"
  | "science"
  | "social"
  | "other";

/**
 * Defines the difficulty levels for a quest.
 */
export type Difficulty = "easy" | "normal" | "hard" | "boss";

/**
 * Defines the current status of a quest.
 */
export type QuestStatus = "pending" | "inProgress" | "completed" | "abandoned";

/**
 * Represents a single quest (homework assignment).
 */
export type Quest = {
  id: string;
  userId: string; // The user (child) who owns this quest
  heroId: string; // The hero associated with this quest
  title: string;
  subject: Subject;
  difficulty: Difficulty;
  status: QuestStatus;
  deadlineDate: string; // ISO date string (e.g., "YYYY-MM-DD")
  estimatedMinutes: number;
  expReward: number;
  goldReward: number;
  createdAt: string; // ISO date string
  completedAt?: string; // ISO date string, if completed
  deletedAt: string | null; // ISO date string, if soft-deleted
};

/**
 * Represents the rewards obtained from completing a quest.
 */
export type QuestReward = {
  exp: number;
  gold: number;
};

/**
 * Represents a battle session log, recording details of a quest attempt.
 */
export type BattleSession = {
  id: string;
  userId: string;
  questId: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  durationSeconds: number;
  status: "completed" | "failed" | "abandoned";
  rewards: QuestReward; // Actual rewards received (may be penalized)
};

// ---------------------------------------------------------------------------
// UI & Theming Types
// ---------------------------------------------------------------------------

/**
 * Defines the allowed color keys for `PixelText` and other UI components
 * that map to `COLORS` in `constants/theme.ts`.
 */
export type TextColor =
  | "primary"
  | "secondary"
  | "accent"
  | "gold"
  | "goldDark"
  | "goldLight"
  | "cream"
  | "gray"
  | "grayDark"
  | "danger"
  | "hp"
  | "mp"
  | "exp"
  | "math"
  | "japanese"
  | "english"
  | "science"
  | "social"
  | "other"
  | "easy"
  | "normal"
  | "hard"
  | "boss";

/**
 * Defines the allowed variants for `PixelButton`.
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

/**
 * Defines the allowed sizes for `PixelButton`.
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Defines the allowed variants for `PixelCard`.
 */
export type CardVariant = "default" | "elevated" | "highlighted";

/**
 * Defines the allowed variants for `PixelText`.
 */
export type TextVariant =
  | "title"
  | "heading"
  | "body"
  | "label"
  | "caption"
  | "stat";
