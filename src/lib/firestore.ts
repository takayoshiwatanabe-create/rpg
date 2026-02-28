/**
 * Local data persistence layer for Hero Homework Quest.
 *
 * Replaces Firebase Firestore with AsyncStorage.
 * Uses a simple event emitter so that subscribe* functions can
 * react to data changes across screens (e.g. camp sees updated
 * hero stats after a battle).
 *
 * API surface is identical to the previous Firestore version —
 * no changes needed in screen components.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProfile,
  HeroProfile,
  Quest,
  QuestStatus,
  BattleSession,
} from "@/types";

// ---------------------------------------------------------------------------
// Simple event emitter for data-change notifications
// ---------------------------------------------------------------------------

type ChangeHandler = () => void;
const changeListeners = new Map<string, Set<ChangeHandler>>();

function emitChange(key: string) {
  changeListeners.get(key)?.forEach((fn) => fn());
}

function onDataChange(key: string, handler: ChangeHandler): () => void {
  if (!changeListeners.has(key)) changeListeners.set(key, new Set());
  changeListeners.get(key)!.add(handler);
  return () => changeListeners.get(key)?.delete(handler);
}

// ---------------------------------------------------------------------------
// Storage key helpers
// ---------------------------------------------------------------------------

const KEYS = {
  user: (id: string) => `@shukudai:user:${id}`,
  hero: (userId: string, heroId: string) =>
    `@shukudai:hero:${userId}:${heroId}`,
  quests: () => `@shukudai:quests`,
  battleSessions: () => `@shukudai:battle_sessions`,
};

// ---------------------------------------------------------------------------
// Generic AsyncStorage helpers
// ---------------------------------------------------------------------------

async function readJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function writeJSON<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(): string {
  const s = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s()}${s()}-${s()}-${s()}-${s()}-${s()}${s()}${s()}`;
}

// ---------------------------------------------------------------------------
// User Profile Operations
// ---------------------------------------------------------------------------

export async function setUserProfile(
  userId: string,
  data: Omit<UserProfile, "id">,
): Promise<void> {
  await writeJSON(KEYS.user(userId), { ...data, id: userId });
  emitChange(KEYS.user(userId));
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  return readJSON<UserProfile>(KEYS.user(userId));
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  const existing = await getUserProfile(userId);
  if (existing) {
    await writeJSON(KEYS.user(userId), { ...existing, ...updates });
    emitChange(KEYS.user(userId));
  }
}

// ---------------------------------------------------------------------------
// Hero Profile Operations
// ---------------------------------------------------------------------------

export async function setHeroProfile(
  userId: string,
  heroId: string,
  data: Omit<HeroProfile, "id" | "userId">,
): Promise<void> {
  const key = KEYS.hero(userId, heroId);
  await writeJSON(key, { ...data, id: heroId, userId });
  emitChange(key);
}

export function subscribeToHero(
  userId: string,
  heroId: string,
  callback: (hero: HeroProfile | null) => void,
): () => void {
  const key = KEYS.hero(userId, heroId);

  const loadData = async () => {
    const hero = await readJSON<HeroProfile>(key);
    callback(hero);
  };

  // Initial load
  loadData();

  // Re-load when data changes
  const unsubChange = onDataChange(key, loadData);
  return unsubChange;
}

export async function updateHeroStats(
  heroId: string,
  updates: Partial<HeroProfile>,
): Promise<void> {
  // heroId is same as userId in this app
  const key = KEYS.hero(heroId, heroId);
  const existing = await readJSON<HeroProfile>(key);
  if (existing) {
    await writeJSON(key, { ...existing, ...updates });
    emitChange(key);
  }
}

// ---------------------------------------------------------------------------
// Quest Operations
// ---------------------------------------------------------------------------

async function getAllQuests(): Promise<Quest[]> {
  return (await readJSON<Quest[]>(KEYS.quests())) ?? [];
}

async function saveAllQuests(quests: Quest[]): Promise<void> {
  await writeJSON(KEYS.quests(), quests);
  emitChange(KEYS.quests());
}

export async function createQuest(data: Omit<Quest, "id">): Promise<string> {
  const id = generateId();
  const quests = await getAllQuests();
  quests.push({ ...data, id });
  await saveAllQuests(quests);
  return id;
}

export function subscribeToQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
): () => void {
  const loadData = async () => {
    const all = await getAllQuests();
    const filtered = all
      .filter((q) => q.heroId === heroId && q.deletedAt === null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    callback(filtered);
  };

  loadData();
  return onDataChange(KEYS.quests(), loadData);
}

export function subscribeToActiveQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
): () => void {
  const loadData = async () => {
    const all = await getAllQuests();
    const filtered = all
      .filter(
        (q) =>
          q.heroId === heroId &&
          q.deletedAt === null &&
          (q.status === "pending" || q.status === "inProgress"),
      )
      .sort(
        (a, b) =>
          new Date(a.deadlineDate).getTime() -
          new Date(b.deadlineDate).getTime(),
      );
    callback(filtered);
  };

  loadData();
  return onDataChange(KEYS.quests(), loadData);
}

export function subscribeToQuestsByParent(
  heroId: string,
  callback: (quests: Quest[]) => void,
): () => void {
  return subscribeToQuests(heroId, callback);
}

export function subscribeToQuest(
  questId: string,
  callback: (quest: Quest | null) => void,
): () => void {
  const loadData = async () => {
    const all = await getAllQuests();
    const quest = all.find((q) => q.id === questId) ?? null;
    callback(quest);
  };

  loadData();
  return onDataChange(KEYS.quests(), loadData);
}

export async function updateQuestStatus(
  questId: string,
  status: QuestStatus,
): Promise<void> {
  const quests = await getAllQuests();
  const idx = quests.findIndex((q) => q.id === questId);
  if (idx >= 0) {
    quests[idx] = { ...quests[idx], status };
    if (status === "completed") {
      quests[idx].completedAt = new Date().toISOString();
    }
    await saveAllQuests(quests);
  }
}

export async function softDeleteQuest(questId: string): Promise<void> {
  const quests = await getAllQuests();
  const idx = quests.findIndex((q) => q.id === questId);
  if (idx >= 0) {
    quests[idx] = { ...quests[idx], deletedAt: new Date().toISOString() };
    await saveAllQuests(quests);
  }
}

// ---------------------------------------------------------------------------
// Battle Session Operations
// ---------------------------------------------------------------------------

async function getAllBattleSessions(): Promise<BattleSession[]> {
  return (await readJSON<BattleSession[]>(KEYS.battleSessions())) ?? [];
}

async function saveAllBattleSessions(
  sessions: BattleSession[],
): Promise<void> {
  await writeJSON(KEYS.battleSessions(), sessions);
  emitChange(KEYS.battleSessions());
}

export async function createBattleSession(
  userId: string,
  questId: string,
  data: Omit<BattleSession, "id" | "userId" | "questId">,
): Promise<string> {
  const id = generateId();
  const sessions = await getAllBattleSessions();
  sessions.push({ ...data, id, userId, questId });
  await saveAllBattleSessions(sessions);
  return id;
}

export function subscribeToRecentBattleSessions(
  userId: string,
  callback: (sessions: BattleSession[]) => void,
  limitCount: number = 5,
): () => void {
  const loadData = async () => {
    const all = await getAllBattleSessions();
    const filtered = all
      .filter((s) => s.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      )
      .slice(0, limitCount);
    callback(filtered);
  };

  loadData();
  return onDataChange(KEYS.battleSessions(), loadData);
}

export function subscribeToBattleSessions(
  userId: string,
  callback: (sessions: BattleSession[]) => void,
): () => void {
  const loadData = async () => {
    const all = await getAllBattleSessions();
    const filtered = all
      .filter((s) => s.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
    callback(filtered);
  };

  loadData();
  return onDataChange(KEYS.battleSessions(), loadData);
}

export async function getQuestById(
  questId: string,
): Promise<Quest | null> {
  const all = await getAllQuests();
  return all.find((q) => q.id === questId) ?? null;
}
