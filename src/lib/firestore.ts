import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import {
  UserProfile,
  HeroProfile,
  Quest,
  QuestStatus,
  BattleSession,
} from "@/types";
import { calculateQuestRewards } from "./gameLogic";

// ---------------------------------------------------------------------------
// User Profile (Parent/Child)
// ---------------------------------------------------------------------------

export async function createUserProfile(
  userId: string,
  email: string,
  role: UserProfile["role"],
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    userId,
    email,
    role,
    createdAt: serverTimestamp(),
  });

  // If a child user is created, also create their hero profile
  if (role === "child") {
    await createHeroProfile(userId, "名もなき勇者"); // Default name
  }
}

export function subscribeToUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void,
): () => void {
  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  });
}

// ---------------------------------------------------------------------------
// Hero Profile
// ---------------------------------------------------------------------------

export async function createHeroProfile(
  userId: string,
  displayName: string,
): Promise<void> {
  const heroRef = doc(db, "heroes", userId); // Hero ID is same as User ID
  await setDoc(heroRef, {
    id: userId,
    userId,
    displayName,
    level: 1,
    currentExp: 0,
    totalExp: 0,
    gold: 0,
    hp: 100,
    maxHp: 100,
    mp: 0,
    maxMp: 0,
    attack: 10,
    defense: 5,
    skills: [],
    inventory: [],
    createdAt: serverTimestamp(),
  });
}

export function subscribeToHero(
  userId: string,
  heroId: string,
  callback: (hero: HeroProfile | null) => void,
): () => void {
  const heroRef = doc(db, "heroes", heroId);
  return onSnapshot(heroRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as HeroProfile);
    } else {
      callback(null);
    }
  });
}

export async function updateHeroStats(
  userId: string,
  updates: Partial<HeroProfile>,
): Promise<void> {
  const heroRef = doc(db, "heroes", userId);
  await updateDoc(heroRef, updates);
}

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

export async function createQuest(
  userId: string,
  questData: Omit<Quest, "id" | "userId" | "heroId" | "status" | "expReward" | "goldReward" | "createdAt" | "deletedAt">,
): Promise<string> {
  const questsCollection = collection(db, "quests");
  const rewards = calculateQuestRewards(questData.difficulty, false); // Calculate initial rewards

  const newQuestRef = await addDoc(questsCollection, {
    ...questData,
    userId,
    heroId: userId, // For now, heroId is same as userId
    status: "pending",
    expReward: rewards.exp,
    goldReward: rewards.gold,
    createdAt: serverTimestamp(),
    deletedAt: null,
  });
  return newQuestRef.id;
}

export function subscribeToQuest(
  questId: string,
  callback: (quest: Quest | null) => void,
): () => void {
  const questRef = doc(db, "quests", questId);
  return onSnapshot(questRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Quest);
    } else {
      callback(null);
    }
  });
}

export function subscribeToActiveQuests(
  heroId: string,
  callback: (quests: Quest[]) => void,
): () => void {
  const q = query(
    collection(db, "quests"),
    where("heroId", "==", heroId),
    where("status", "in", ["pending", "inProgress"]),
    where("deletedAt", "==", null),
    orderBy("deadlineDate", "asc"),
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests: Quest[] = [];
    querySnapshot.forEach((doc) => {
      quests.push({ id: doc.id, ...doc.data() } as Quest);
    });
    callback(quests);
  });
}

export function subscribeToQuestsByParent(
  childId: string,
  callback: (quests: Quest[]) => void,
): () => void {
  const q = query(
    collection(db, "quests"),
    where("userId", "==", childId),
    where("deletedAt", "==", null),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests: Quest[] = [];
    querySnapshot.forEach((doc) => {
      quests.push({ id: doc.id, ...doc.data() } as Quest);
    });
    callback(quests);
  });
}

export function subscribeToCompletedQuests(
  userId: string,
  callback: (quests: Quest[]) => void,
): () => void {
  const q = query(
    collection(db, "quests"),
    where("userId", "==", userId),
    where("status", "==", "completed"),
    where("deletedAt", "==", null),
    orderBy("createdAt", "desc"),
    limit(20), // Limit to recent completed quests
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests: Quest[] = [];
    querySnapshot.forEach((doc) => {
      quests.push({ id: doc.id, ...doc.data() } as Quest);
    });
    callback(quests);
  });
}

export async function updateQuestStatus(
  questId: string,
  status: QuestStatus,
): Promise<void> {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, { status });
}

export async function updateQuest(
  questId: string,
  updates: Partial<Omit<Quest, "id" | "userId" | "heroId" | "createdAt" | "deletedAt" | "status">>,
): Promise<void> {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, updates);
}

export async function deleteQuest(questId: string): Promise<void> {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, { deletedAt: serverTimestamp() });
}

// ---------------------------------------------------------------------------
// Battle Sessions
// ---------------------------------------------------------------------------

export async function createBattleSession(
  userId: string,
  questId: string,
  sessionData: Omit<BattleSession, "id" | "userId" | "questId" | "createdAt">,
): Promise<string> {
  const sessionsCollection = collection(db, "battleSessions");
  const newSessionRef = await addDoc(sessionsCollection, {
    ...sessionData,
    userId,
    questId,
    createdAt: serverTimestamp(),
  });
  return newSessionRef.id;
}

export function subscribeToBattleSessions(
  userId: string,
  callback: (sessions: BattleSession[]) => void,
): () => void {
  const q = query(
    collection(db, "battleSessions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20), // Limit to recent sessions
  );
  return onSnapshot(q, (querySnapshot) => {
    const sessions: BattleSession[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() } as BattleSession);
    });
    callback(sessions);
  });
}

