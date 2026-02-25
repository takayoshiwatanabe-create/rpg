export type Language = "ja" | "en" | "zh" | "ko" | "es" | "fr" | "de" | "pt" | "ar" | "hi";

export type Difficulty = "easy" | "normal" | "hard" | "boss";

export type QuestStatus = "pending" | "inProgress" | "completed" | "failed";

export type Subject = "math" | "japanese" | "english" | "science" | "social" | "other";

export type AccountRole = "child" | "parent";

export type SubscriptionPlan = "free" | "premium";

export type BattleOutcome = "victory" | "defeat";

export interface HeroProfile {
  id: string;
  displayName: string;
  avatarId: string;
  level: number;
  totalExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  gold: number;
}

export interface Quest {
  id: string;
  userId: string;
  heroId: string;
  title: string;
  subject: Subject;
  difficulty: Difficulty;
  status: QuestStatus;
  deadlineDate: string;
  estimatedMinutes: number;
  expReward: number;
  goldReward: number;
  createdAt: string;
  completedAt?: string;
  deletedAt: string | null;
}

export interface BattleEnemy {
  nameKey: string;
  spriteId: string;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
}

export interface BattleSession {
  id: string;
  userId: string;
  questId: string;
  heroId: string;
  enemy: BattleEnemy;
  startedAt: string;
  completedAt?: string;
  outcome?: BattleOutcome;
  expEarned: number;
  goldEarned: number;
}

export interface BattleReward {
  exp: number;
  gold: number;
  leveledUp: boolean;
  newLevel?: number;
}

export interface UserProfile {
  id: string;
  role: AccountRole;
  parentId?: string;
  locale: Language;
  createdAt: string;
}

export interface Subscription {
  plan: SubscriptionPlan;
  expiresAt?: string;
  trialEndsAt?: string;
}

export interface AppSettings {
  locale: Language;
  reducedMotion: boolean;
  notificationsEnabled: boolean;
}

export interface ExpProgress {
  current: number;
  required: number;
  percentage: number;
}

export interface HeroStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
}
