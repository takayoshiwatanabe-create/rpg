import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  User,
  UserProfile,
  HeroProfile,
  Quest,
  QuestStatus,
  BattleSession,
} from "@/types";

// ---------------------------------------------------------------------------
// User Profile Operations
// ---------------------------------------------------------------------------

/**
 * Sets or updates a user's profile in Firestore.
 * @param userId The ID of the user.
 * @param data The user profile data.
 */
export async function setUserProfile(
  userId: string,
  data: Partial<UserProfile>,
) {
  const userProfileRef = doc(db, "users", userId, "profile", userId);
  await setDoc(userProfileRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Subscribes to a user's profile changes.
 * @param userId The ID of the user.
 * @param callback Callback function to receive the user profile.
 * @returns An unsubscribe function.
 */
export function subscribeToUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void,
) {
  const userProfileRef = doc(db, "users", userId, "profile", userId);
  return onSnapshot(userProfileRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  });
}

// ---------------------------------------------------------------------------
// Hero Profile Operations
// ---------------------------------------------------------------------------

/**
 * Sets or updates a hero's profile in Firestore.
 * @param userId The ID of the user (owner of the hero).
 * @param heroId The ID of the hero.
 * @param data The hero profile data.
 */
export async function setHeroProfile(
  userId: string,
  heroId: string,
  data: Partial<Omit<HeroProfile, "id">>, // Omit id as it's the document ID
) {
  const heroRef = doc(db, "users", userId, "hero", heroId);
  await setDoc(heroRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Subscribes to a hero's profile changes.
 * @param userId The ID of the user (owner of the hero).
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive the hero profile.
 * @returns An unsubscribe function.
 */
export function subscribeToHero(
  userId: string,
  heroId: string,
  callback: (hero: HeroProfile | null) => void,
) {
  const heroRef = doc(db, "users", userId, "hero", heroId);
  return onSnapshot(heroRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as HeroProfile);
    } else {
      callback(null);
    }
  });
}

/**
 * Updates hero stats (exp, gold, level).
 * @param userId The ID of the user (owner of the hero).
 * @param data The stats to update.
 */
export async function updateHeroStats(
  userId: string,
  data: { exp?: number; gold?: number; level?: number },
) {
  const heroRef = doc(db, "users", userId, "hero", userId); // Assuming heroId is same as userId
  await updateDoc(heroRef, data);
}

// ---------------------------------------------------------------------------
// Quest Operations
// ---------------------------------------------------------------------------

/**
 * Creates a new quest.
 * @param data The quest data.
 * @returns The ID of the created quest.
 */
export async function createQuest(
  data: Omit<Quest, "id" | "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
) {
  const questsCollectionRef = collection(db, "quests");
  const newQuestRef = doc(questsCollectionRef); // Let Firestore generate ID
  await setDoc(newQuestRef, {
    ...data,
    id: newQuestRef.id,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  });
  return newQuestRef.id;
}

/**
 * Subscribes to a single quest's changes.
 * @param questId The ID of the quest.
 * @param callback Callback function to receive the quest.
 * @returns An unsubscribe function.
 */
export function subscribeToQuest(
  questId: string,
  callback: (quest: Quest | null) => void,
) {
  const questRef = doc(db, "quests", questId);
  return onSnapshot(questRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Quest);
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribes to all quests for a given hero, excluding soft-deleted ones.
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive the list of quests.
 * @returns An unsubscribe function.
 */
export function subscribeToQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
) {
  const questsCollectionRef = collection(db, "quests");
  const q = query(
    questsCollectionRef,
    where("heroId", "==", heroId),
    where("deletedAt", "==", null), // Only active quests
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests = querySnapshot.docs.map((doc) => doc.data() as Quest);
    callback(quests);
  });
}

/**
 * Subscribes to active quests (pending or inProgress) for a given hero.
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive the list of active quests.
 * @returns An unsubscribe function.
 */
export function subscribeToActiveQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
) {
  const questsCollectionRef = collection(db, "quests");
  const q = query(
    questsCollectionRef,
    where("heroId", "==", heroId),
    where("status", "in", ["pending", "inProgress"]),
    where("deletedAt", "==", null), // Only active quests
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests = querySnapshot.docs.map((doc) => doc.data() as Quest);
    callback(quests);
  });
}

/**
 * Updates the status of a quest.
 * @param questId The ID of the quest.
 * @param status The new status.
 */
export async function updateQuestStatus(questId: string, status: QuestStatus) {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, { status, updatedAt: serverTimestamp() });
}

/**
 * Soft deletes a quest by setting its `deletedAt` timestamp.
 * @param questId The ID of the quest to delete.
 */
export async function softDeleteQuest(questId: string) {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

// ---------------------------------------------------------------------------
// Battle Session Operations
// ---------------------------------------------------------------------------

/**
 * Creates a new battle session record.
 * @param userId The ID of the user.
 * @param questId The ID of the quest.
 * @param data The battle session data.
 * @returns The ID of the created battle session.
 */
export async function createBattleSession(
  userId: string,
  questId: string,
  data: Omit<BattleSession, "id">,
) {
  const battleSessionsCollectionRef = collection(
    db,
    "users",
    userId,
    "battleSessions",
  );
  const newSessionRef = doc(battleSessionsCollectionRef); // Let Firestore generate ID
  await setDoc(newSessionRef, {
    ...data,
    id: newSessionRef.id,
    createdAt: serverTimestamp(),
  });
  return newSessionRef.id;
}

/**
 * Retrieves a battle session by its ID.
 * @param userId The ID of the user.
 * @param sessionId The ID of the battle session.
 * @returns The battle session data or null if not found.
 */
export async function getBattleSession(
  userId: string,
  sessionId: string,
): Promise<BattleSession | null> {
  const sessionRef = doc(db, "users", userId, "battleSessions", sessionId);
  const docSnap = await getDoc(sessionRef);
  if (docSnap.exists()) {
    return docSnap.data() as BattleSession;
  }
  return null;
}
