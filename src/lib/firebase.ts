/**
 * Local authentication & storage layer for Hero Homework Quest.
 *
 * Replaces Firebase with AsyncStorage-based local persistence.
 * This is intentional: a children's single-player game works best
 * offline with zero network dependency and no COPPA risk.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { UserProfile, HeroProfile, Quest } from "@/types"; // Import types
import { DEFAULT_EXP_REWARDS, DEFAULT_GOLD_REWARDS, DEFAULT_ESTIMATED_MINUTES } from "@/constants/game"; // Import game constants
import { getMonster } from "@/constants/monsters"; // Import getMonster

// ---------------------------------------------------------------------------
// Local user types (API-compatible with previous Firebase usage)
// ---------------------------------------------------------------------------

export type LocalUser = {
  uid: string;
  isAnonymous: boolean;
  email?: string;
};

export type LocalCredential = {
  user: LocalUser;
};

// ---------------------------------------------------------------------------
// Auth state management
// ---------------------------------------------------------------------------

const AUTH_STORAGE_KEY = "@shukudai:auth_user";

type AuthHandler = (user: LocalUser | null) => void;
const authListeners = new Set<AuthHandler>();

function generateUID(): string {
  const s = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s()}${s()}-${s()}-${s()}-${s()}-${s()}${s()}${s()}`;
}

/** Read current auth user from AsyncStorage. */
async function loadCurrentUser(): Promise<LocalUser | null> {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/** Notify all auth listeners of state change. */
function notifyAll(user: LocalUser | null) {
  authListeners.forEach((handler) => {
    try {
      handler(user);
    } catch {
      // Prevent one bad handler from breaking others
    }
  });
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function signInAsGuest(): Promise<LocalCredential> {
  const user: LocalUser = {
    uid: generateUID(),
    isAnonymous: true,
  };
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  notifyAll(user);
  return { user };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<LocalCredential> {
  const key = `@shukudai:email_user:${email.toLowerCase()}`;
  const stored = await AsyncStorage.getItem(key);
  if (!stored) {
    throw new Error("auth/user-not-found");
  }
  const data = JSON.parse(stored);
  if (data.password !== password) {
    throw new Error("auth/wrong-password");
  }
  const user: LocalUser = { uid: data.uid, isAnonymous: false, email };
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  notifyAll(user);
  return { user };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<LocalCredential> {
  const key = `@shukudai:email_user:${email.toLowerCase()}`;
  const existing = await AsyncStorage.getItem(key);
  if (existing) {
    throw new Error("auth/email-already-in-use");
  }
  const uid = generateUID();
  await AsyncStorage.setItem(key, JSON.stringify({ uid, password }));
  const user: LocalUser = { uid, isAnonymous: false, email };
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  notifyAll(user);
  return { user };
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAll(null);
}

/** Alias for backward compatibility with parent screens. */
export const signOutUser = signOut;

/**
 * Re-broadcasts the current auth user to all listeners.
 * Call after saving user profile to ensure AuthContext picks up the profile.
 */
export async function refreshAuthState(): Promise<void> {
  const user = await loadCurrentUser();
  notifyAll(user);
}

/**
 * Subscribes to authentication state changes.
 * Loads persisted state asynchronously and fires handler.
 * Fires on every subsequent auth change.
 */
export function onAuthStateChange(
  handler: (user: LocalUser | null) => void,
): () => void {
  authListeners.add(handler);

  // Load persisted auth state and fire handler
  loadCurrentUser().then((user) => {
    // Only fire if still subscribed
    if (authListeners.has(handler)) {
      handler(user);
    }
  });

  return () => {
    authListeners.delete(handler);
  };
}

// ---------------------------------------------------------------------------
// Push Notifications (works without Firebase)
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushToken = string;

export async function registerPushToken(): Promise<PushToken | null> {
  if (Platform.OS === "web") return null;

  const { status: current } = await Notifications.getPermissionsAsync();
  const finalStatus =
    current === "granted"
      ? current
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== "granted") return null;

  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  const projectId = extra?.eas?.projectId;

  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

export function onNotificationReceived(
  handler: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function onNotificationResponse(
  handler: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// ---------------------------------------------------------------------------
// Mock Firestore (AsyncStorage based)
// ---------------------------------------------------------------------------

const USER_PROFILE_PREFIX = "@shukudai:user_profile:";
const HERO_PROFILE_PREFIX = "@shukudai:hero_profile:";
const QUESTS_PREFIX = "@shukudai:quests:";

// Helper to get current timestamp
const getTimestamp = () => new Date().toISOString();

/**
 * Get user profile from local storage.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(`${USER_PROFILE_PREFIX}${userId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Save user profile to local storage.
 */
export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  try {
    const existing = await getUserProfile(userId);
    const newProfile: UserProfile = {
      displayName: profile.displayName || existing?.displayName || `Hero-${userId.substring(0, 4)}`,
      avatarUrl: profile.avatarUrl || existing?.avatarUrl || "https://example.com/default-avatar.png",
      createdAt: existing?.createdAt || getTimestamp(),
      lastLogin: getTimestamp(),
      role: profile.role || existing?.role || "child",
      parentId: profile.parentId || existing?.parentId || undefined,
      childIds: profile.childIds || existing?.childIds || [],
      ...profile,
    };
    await AsyncStorage.setItem(`${USER_PROFILE_PREFIX}${userId}`, JSON.stringify(newProfile));
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

/**
 * Get hero profile from local storage.
 */
export async function getHeroProfile(userId: string): Promise<HeroProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(`${HERO_PROFILE_PREFIX}${userId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error getting hero profile:", error);
    return null;
  }
}

/**
 * Save hero profile to local storage.
 */
export async function saveHeroProfile(userId: string, hero: Partial<HeroProfile>): Promise<void> {
  try {
    const existing = await getHeroProfile(userId);
    const newHero: HeroProfile = {
      level: hero.level || existing?.level || 1,
      totalExp: hero.totalExp || existing?.totalExp || 0,
      hp: hero.hp || existing?.hp || 100,
      maxHp: hero.maxHp || existing?.maxHp || 100,
      mp: hero.mp || existing?.mp || 50,
      maxMp: hero.maxMp || existing?.maxMp || 50,
      attack: hero.attack || existing?.attack || 10,
      defense: hero.defense || existing?.defense || 5,
      gold: hero.gold || existing?.gold || 0,
      equipment: hero.equipment || existing?.equipment || {},
      inventory: hero.inventory || existing?.inventory || [],
      displayName: hero.displayName || existing?.displayName || `Hero-${userId.substring(0, 4)}`, // Added displayName for HeroProfile
      ...hero,
    };
    await AsyncStorage.setItem(`${HERO_PROFILE_PREFIX}${userId}`, JSON.stringify(newHero));
  } catch (error) {
    console.error("Error saving hero profile:", error);
    throw error;
  }
}

/**
 * Get all quests for a user from local storage.
 */
export async function getQuests(userId: string): Promise<Quest[]> {
  try {
    const stored = await AsyncStorage.getItem(`${QUESTS_PREFIX}${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error getting quests:", error);
    return [];
  }
}

/**
 * Get a single quest by ID for a user from local storage.
 */
export async function getQuest(userId: string, questId: string): Promise<Quest | null> {
  try {
    const quests = await getQuests(userId);
    return quests.find(q => q.id === questId) || null;
  } catch (error) {
    console.error("Error getting quest:", error);
    return null;
  }
}

/**
 * Save a quest to local storage. If questId exists, update; otherwise, create.
 */
export async function saveQuest(userId: string, quest: Partial<Quest>): Promise<Quest> {
  try {
    const quests = await getQuests(userId);
    let updatedQuest: Quest;

    if (quest.id) {
      // Update existing quest
      const index = quests.findIndex(q => q.id === quest.id);
      if (index > -1) {
        updatedQuest = { ...quests[index], ...quest, userId };
        quests[index] = updatedQuest;
      } else {
        // This case should ideally not happen if quest.id is provided for an update
        // but we'll treat it as a new quest if not found.
        const newId = generateUID();
        updatedQuest = {
          id: newId,
          userId,
          title: quest.title || "New Quest",
          description: quest.description || "",
          subject: quest.subject || "other",
          difficulty: quest.difficulty || "easy",
          status: quest.status || "pending",
          deadlineDate: quest.deadlineDate || getTimestamp(),
          estimatedMinutes: quest.estimatedMinutes || DEFAULT_ESTIMATED_MINUTES[quest.difficulty || "easy"],
          rewards: quest.rewards || {
            exp: DEFAULT_EXP_REWARDS[quest.difficulty || "easy"],
            gold: DEFAULT_GOLD_REWARDS[quest.difficulty || "easy"],
            items: [],
          },
          createdAt: getTimestamp(),
          ...quest,
        };
        quests.push(updatedQuest);
      }
    } else {
      // Create new quest
      const newId = generateUID();
      updatedQuest = {
        id: newId,
        userId,
        title: quest.title || "New Quest",
        description: quest.description || "",
        subject: quest.subject || "other",
        difficulty: quest.difficulty || "easy",
        status: quest.status || "pending",
        deadlineDate: quest.deadlineDate || getTimestamp(),
        estimatedMinutes: quest.estimatedMinutes || DEFAULT_ESTIMATED_MINUTES[quest.difficulty || "easy"],
        rewards: quest.rewards || {
          exp: DEFAULT_EXP_REWARDS[quest.difficulty || "easy"],
          gold: DEFAULT_GOLD_REWARDS[quest.difficulty || "easy"],
          items: [],
        },
        createdAt: getTimestamp(),
        ...quest,
      };
      quests.push(updatedQuest);
    }

    await AsyncStorage.setItem(`${QUESTS_PREFIX}${userId}`, JSON.stringify(quests));
    return updatedQuest;
  } catch (error) {
    console.error("Error saving quest:", error);
    throw error;
  }
}

/**
 * Delete a quest from local storage.
 */
export async function deleteQuest(userId: string, questId: string): Promise<void> {
  try {
    let quests = await getQuests(userId);
    quests = quests.filter(q => q.id !== questId);
    await AsyncStorage.setItem(`${QUESTS_PREFIX}${userId}`, JSON.stringify(quests));
  } catch (error) {
    console.error("Error deleting quest:", error);
    throw error;
  }
}

// Mock battle session and completed quests (for future implementation)
export async function getBattleSession(userId: string, sessionId: string): Promise<any> {
  console.warn("getBattleSession not implemented for local storage.");
  return null;
}

export async function saveBattleSession(userId: string, session: any): Promise<any> {
  console.warn("saveBattleSession not implemented for local storage.");
  return session;
}

export async function getCompletedQuests(userId: string): Promise<any[]> {
  console.warn("getCompletedQuests not implemented for local storage.");
  return [];
}

export async function saveCompletedQuest(userId: string, completedQuest: any): Promise<any> {
  console.warn("saveCompletedQuest not implemented for local storage.");
  return completedQuest;
}

// Mock monster data (can be loaded from constants)
export async function getMonsterData(monsterId: string): Promise<any> {
  // This should ideally map monsterId to a specific monster in constants/monsters.ts
  // For now, return a generic monster or look up by a simplified ID
  console.warn("getMonsterData not fully implemented for local storage. Using getMonster from constants.");
  // Example: if monsterId is "math-easy", parse it
  const [subject, difficulty] = monsterId.split('-') as [any, any];
  if (subject && difficulty) {
    return getMonster(subject, difficulty);
  }
  return getMonster("other", "easy"); // Fallback
}

