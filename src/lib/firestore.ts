import {
  doc,
  collection,
  setDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import type {
  UserProfile,
  HeroProfile,
  Quest,
  QuestStatus,
  BattleSession,
} from "@/types"; // Ensure UserProfile is imported

// ---------------------------------------------------------------------------
// User Profile Operations
// ---------------------------------------------------------------------------

/**
 * Sets or updates a user's profile in Firestore.
 * @param userId The ID of the user.
 * @param data The profile data to set.
 */
export async function setUserProfile(
  userId: string,
  data: Omit<UserProfile, "id">,
): Promise<void> {
  await setDoc(doc(db, "users", userId), { ...data, id: userId });
}

/**
 * Retrieves a user's profile from Firestore.
 * @param userId The ID of the user.
 * @returns The user's profile or null if not found.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Hero Profile Operations
// ---------------------------------------------------------------------------

/**
 * Sets or updates a hero's profile in Firestore.
 * @param userId The ID of the user who owns the hero.
 * @param heroId The ID of the hero (usually same as userId for child accounts).
 * @param data The hero profile data to set.
 */
export async function setHeroProfile(
  userId: string,
  heroId: string,
  data: Omit<HeroProfile, "id" | "userId">,
): Promise<void> {
  await setDoc(doc(db, "users", userId, "hero", heroId), {
    ...data,
    id: heroId,
    userId: userId,
  });
}

/**
 * Subscribes to real-time updates of a hero's profile.
 * @param userId The ID of the user who owns the hero.
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive hero profile updates.
 * @returns An unsubscribe function.
 */
export function subscribeToHero(
  userId: string,
  heroId: string,
  callback: (hero: HeroProfile | null) => void,
): () => void {
  const heroRef = doc(db, "users", userId, "hero", heroId);
  return onSnapshot(heroRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as HeroProfile);
    } else {
      callback(null);
    }
  });
}

/**
 * Updates specific stats of a hero.
 * @param heroId The ID of the hero.
 * @param updates An object containing the fields to update.
 */
export async function updateHeroStats(
  heroId: string,
  updates: Partial<HeroProfile>,
): Promise<void> {
  // Assuming heroId is the same as userId for simplicity in this context
  const heroRef = doc(db, "users", heroId, "hero", heroId);
  await updateDoc(heroRef, updates);
}

// ---------------------------------------------------------------------------
// Quest Operations
// ---------------------------------------------------------------------------

/**
 * Creates a new quest in Firestore.
 * @param data The quest data to create.
 * @returns The ID of the newly created quest.
 */
export async function createQuest(
  data: Omit<Quest, "id">,
): Promise<string> {
  const questsCollectionRef = collection(db, "quests");
  const newQuestRef = doc(questsCollectionRef); // Let Firestore generate an ID
  await setDoc(newQuestRef, { ...data, id: newQuestRef.id });
  return newQuestRef.id;
}

/**
 * Subscribes to real-time updates of quests for a specific hero.
 * Only fetches non-deleted quests.
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive quest updates.
 * @returns An unsubscribe function.
 */
export function subscribeToQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
): () => void {
  const q = query(
    collection(db, "quests"),
    where("heroId", "==", heroId),
    where("deletedAt", "==", null), // Only active quests
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests: Quest[] = [];
    querySnapshot.forEach((doc) => {
      quests.push(doc.data() as Quest);
    });
    callback(quests);
  });
}

/**
 * Subscribes to real-time updates of active quests for a specific hero.
 * Active quests are those with status 'pending' or 'inProgress'.
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive quest updates.
 * @returns An unsubscribe function.
 */
export function subscribeToActiveQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
): () => void {
  const q = query(
    collection(db, "quests"),
    where("heroId", "==", heroId),
    where("deletedAt", "==", null),
    where("status", "in", ["pending", "inProgress"]),
    orderBy("deadlineDate", "asc"),
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests: Quest[] = [];
    querySnapshot.forEach((doc) => {
      quests.push(doc.data() as Quest);
    });
    callback(quests);
  });
}

/**
 * Subscribes to a single quest's real-time updates.
 * @param questId The ID of the quest.
 * @param callback Callback function to receive quest updates.
 * @returns An unsubscribe function.
 */
export function subscribeToQuest(
  questId: string,
  callback: (quest: Quest | null) => void,
): () => void {
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
 * Updates the status of a quest.
 * @param questId The ID of the quest.
 * @param status The new status.
 */
export async function updateQuestStatus(
  questId: string,
  status: QuestStatus,
): Promise<void> {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, { status });
}

/**
 * Soft deletes a quest by setting its `deletedAt` timestamp.
 * @param questId The ID of the quest to delete.
 */
export async function softDeleteQuest(questId: string): Promise<void> {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, { deletedAt: serverTimestamp() });
}

// ---------------------------------------------------------------------------
// Battle Session Operations
// ---------------------------------------------------------------------------

/**
 * Creates a new battle session record.
 * @param userId The ID of the user who initiated the battle.
 * @param questId The ID of the quest associated with the battle.
 * @param data The battle session data.
 */
export async function createBattleSession(
  userId: string,
  questId: string,
  data: Omit<BattleSession, "id" | "userId" | "questId">,
): Promise<string> {
  const sessionsCollectionRef = collection(db, "battleSessions");
  const newSessionRef = doc(sessionsCollectionRef);
  await setDoc(newSessionRef, {
    ...data,
    id: newSessionRef.id,
    userId: userId,
    questId: questId,
    createdAt: new Date().toISOString(),
  });
  return newSessionRef.id;
}

/**
 * Subscribes to recent battle sessions for a user.
 * @param userId The ID of the user.
 * @param callback Callback function to receive battle session updates.
 * @param limitCount The maximum number of sessions to retrieve (default: 5).
 * @returns An unsubscribe function.
 */
export function subscribeToRecentBattleSessions(
  userId: string,
  callback: (sessions: BattleSession[]) => void,
  limitCount: number = 5,
): () => void {
  const q = query(
    collection(db, "battleSessions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );
  return onSnapshot(q, (querySnapshot) => {
    const sessions: BattleSession[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push(doc.data() as BattleSession);
    });
    callback(sessions);
  });
}

