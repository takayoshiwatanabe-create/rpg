import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QuerySnapshot,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore";
import { app } from "@/src/lib/firebase";
import type { HeroProfile, Quest, UserProfile } from "@/types";

const db = getFirestore(app);

// ---------------------------------------------------------------------------
// User Profile Operations
// ---------------------------------------------------------------------------

/**
 * Sets or updates a user's profile in Firestore.
 * @param userId The Firebase Auth UID of the user.
 * @param data The UserProfile data to set.
 */
export async function setUserProfile(
  userId: string,
  data: Omit<UserProfile, "id">,
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { ...data, id: userId }, { merge: true });
}

/**
 * Retrieves a user's profile from Firestore.
 * @param userId The Firebase Auth UID of the user.
 * @returns The UserProfile or null if not found.
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
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
 * @param userId The Firebase Auth UID of the owner.
 * @param heroId The ID of the hero (usually same as userId for primary hero).
 * @param data The HeroProfile data to set.
 */
export async function setHeroProfile(
  userId: string,
  heroId: string,
  data: Omit<HeroProfile, "id" | "userId">,
): Promise<void> {
  const heroRef = doc(db, "users", userId, "hero", heroId);
  await setDoc(heroRef, { ...data, id: heroId, userId }, { merge: true });
}

/**
 * Retrieves a hero's profile from Firestore.
 * @param userId The Firebase Auth UID of the owner.
 * @param heroId The ID of the hero.
 * @returns The HeroProfile or null if not found.
 */
export async function getHeroProfile(
  userId: string,
  heroId: string,
): Promise<HeroProfile | null> {
  const heroRef = doc(db, "users", userId, "hero", heroId);
  const docSnap = await getDoc(heroRef);
  if (docSnap.exists()) {
    return docSnap.data() as HeroProfile;
  }
  return null;
}

/**
 * Subscribes to a hero's profile changes in real-time.
 * @param userId The Firebase Auth UID of the owner.
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive HeroProfile updates.
 * @returns An unsubscribe function.
 */
export function subscribeToHero(
  userId: string,
  heroId: string,
  callback: (hero: HeroProfile | null) => void,
): Unsubscribe {
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
 * Updates a hero's profile with partial data.
 * @param userId The Firebase Auth UID of the owner.
 * @param heroId The ID of the hero.
 * @param data Partial HeroProfile data to update.
 */
export async function updateHeroProfile(
  userId: string,
  heroId: string,
  data: Partial<Omit<HeroProfile, "id" | "userId">>,
): Promise<void> {
  const heroRef = doc(db, "users", userId, "hero", heroId);
  await updateDoc(heroRef, data);
}

// ---------------------------------------------------------------------------
// Quest Operations
// ---------------------------------------------------------------------------

/**
 * Creates a new quest in Firestore.
 * @param data The Quest data to create.
 * @returns The ID of the newly created quest.
 */
export async function createQuest(
  data: Omit<Quest, "id" | "createdAt" | "deletedAt"> & {
    createdAt?: string;
    deletedAt?: string | null;
  },
): Promise<string> {
  const questsCollectionRef = collection(db, "quests");
  const newQuestRef = doc(questsCollectionRef); // Let Firestore generate a new ID
  await setDoc(newQuestRef, {
    ...data,
    id: newQuestRef.id,
    createdAt: data.createdAt || new Date().toISOString(),
    deletedAt: data.deletedAt === undefined ? null : data.deletedAt, // Ensure deletedAt is null by default
  });
  return newQuestRef.id;
}

/**
 * Subscribes to a single quest's changes in real-time.
 * @param questId The ID of the quest.
 * @param callback Callback function to receive Quest updates.
 * @returns An unsubscribe function.
 */
export function subscribeToQuest(
  questId: string,
  callback: (quest: Quest | null) => void,
): Unsubscribe {
  const questRef = doc(db, "quests", questId);
  return onSnapshot(questRef, (docSnap) => {
    if (docSnap.exists() && docSnap.data().deletedAt === null) {
      callback(docSnap.data() as Quest);
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribes to a list of quests for a given hero, ordered by deadline.
 * Excludes soft-deleted quests.
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive Quest[] updates.
 * @returns An unsubscribe function.
 */
export function subscribeToQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
): Unsubscribe {
  const questsCollectionRef = collection(db, "quests");
  const q = query(
    questsCollectionRef,
    where("heroId", "==", heroId),
    where("deletedAt", "==", null), // Only fetch non-deleted quests
    orderBy("deadlineDate", "asc"),
  );

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const quests: Quest[] = querySnapshot.docs.map(
      (doc) => doc.data() as Quest,
    );
    callback(quests);
  });
}

/**
 * Subscribes to active quests (pending or inProgress) for a given hero.
 * Excludes soft-deleted quests.
 * @param heroId The ID of the hero.
 * @param callback Callback function to receive Quest[] updates.
 * @returns An unsubscribe function.
 */
export function subscribeToActiveQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
): Unsubscribe {
  const questsCollectionRef = collection(db, "quests");
  const q = query(
    questsCollectionRef,
    where("heroId", "==", heroId),
    where("status", "in", ["pending", "inProgress"]),
    where("deletedAt", "==", null), // Only fetch non-deleted quests
    orderBy("deadlineDate", "asc"),
    limit(5), // Limit to a reasonable number for the dashboard
  );

  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const quests: Quest[] = querySnapshot.docs.map(
      (doc) => doc.data() as Quest,
    );
    callback(quests);
  });
}

/**
 * Updates a quest with partial data.
 * @param questId The ID of the quest.
 * @param data Partial Quest data to update.
 */
export async function updateQuest(
  questId: string,
  data: Partial<Omit<Quest, "id" | "userId" | "heroId" | "createdAt">>,
): Promise<void> {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, data);
}

/**
 * Soft-deletes a quest by setting its `deletedAt` timestamp.
 * This makes the quest invisible to most queries but preserves it for auditing.
 * @param questId The ID of the quest to soft-delete.
 */
export async function softDeleteQuest(questId: string): Promise<void> {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, {
    deletedAt: new Date().toISOString(), // Use ISO string for consistency
  });
}

/**
 * Marks a quest as completed and updates hero stats.
 * @param questId The ID of the quest to complete.
 * @param heroId The ID of the hero completing the quest.
 * @param userId The ID of the user owning the hero.
 * @param expGained The EXP awarded for the quest.
 * @param goldGained The Gold awarded for the quest.
 */
export async function completeQuest(
  questId: string,
  heroId: string,
  userId: string,
  expGained: number,
  goldGained: number,
): Promise<void> {
  const questRef: DocumentReference<DocumentData> = doc(db, "quests", questId);
  const heroRef: DocumentReference<DocumentData> = doc(
    db,
    "users",
    userId,
    "hero",
    heroId,
  );

  // Use a batch write for atomicity
  // const batch = writeBatch(db);

  // Update quest status
  await updateDoc(questRef, {
    status: "completed",
    completedAt: new Date().toISOString(),
  });

  // Update hero stats
  // This should ideally be handled by a Cloud Function triggered by quest completion
  // to prevent client-side tampering and ensure complex game logic (leveling up, etc.)
  // is executed securely on the server. For now, we'll do a direct update.
  const heroSnap = await getDoc(heroRef);
  if (heroSnap.exists()) {
    const currentHero = heroSnap.data() as HeroProfile;
    await updateDoc(heroRef, {
      totalExp: currentHero.totalExp + expGained,
      gold: currentHero.gold + goldGained,
      // Other stats like level, attack, defense would be derived or updated here
      // based on the new totalExp. This is simplified for now.
    });
  }
}

