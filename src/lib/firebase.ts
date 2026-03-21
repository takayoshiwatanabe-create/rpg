import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import Constants from "expo-constants";
import { UserProfile, HeroProfile, Quest, BattleSession, UserRole } from "@/types";

// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// const messaging = getMessaging(app); // Only initialize if running in web environment

// ---------------------------------------------------------------------------
// Auth Functions
// ---------------------------------------------------------------------------

export const signInUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const registerUserWithEmail = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ---------------------------------------------------------------------------
// User Profile Functions
// ---------------------------------------------------------------------------

export const createUserProfile = async (
  uid: string,
  data: Omit<UserProfile, "id">,
) => {
  await setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: Timestamp.fromDate(new Date(data.createdAt)),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data.email,
      role: data.role as UserRole,
      createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    };
  }
  return null;
};

export const subscribeToUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void,
) => {
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        id: docSnap.id,
        email: data.email,
        role: data.role as UserRole,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
      });
    } else {
      callback(null);
    }
  });
};

// ---------------------------------------------------------------------------
// Hero Profile Functions
// ---------------------------------------------------------------------------

export const createHeroProfile = async (
  uid: string,
  data: Omit<HeroProfile, "id">,
) => {
  await setDoc(doc(db, "heroes", uid), {
    ...data,
    createdAt: Timestamp.fromDate(new Date(data.createdAt)),
  });
};

export const getHeroProfile = async (uid: string): Promise<HeroProfile | null> => {
  const docRef = doc(db, "heroes", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      displayName: data.displayName,
      level: data.level,
      currentExp: data.currentExp,
      totalExp: data.totalExp,
      gold: data.gold,
      hp: data.hp,
      maxHp: data.maxHp,
      mp: data.mp,
      maxMp: data.maxMp,
      attack: data.attack,
      defense: data.defense,
      skills: data.skills || [],
      inventory: data.inventory || [],
      createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    };
  }
  return null;
};

export const subscribeToHero = (
  userId: string,
  heroId: string,
  callback: (hero: HeroProfile | null) => void,
) => {
  const docRef = doc(db, "heroes", heroId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        id: docSnap.id,
        userId: data.userId,
        displayName: data.displayName,
        level: data.level,
        currentExp: data.currentExp,
        totalExp: data.totalExp,
        gold: data.gold,
        hp: data.hp,
        maxHp: data.maxHp,
        mp: data.mp,
        maxMp: data.maxMp,
        attack: data.attack,
        defense: data.defense,
        skills: data.skills || [],
        inventory: data.inventory || [],
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
      });
    } else {
      callback(null);
    }
  });
};

export const updateHeroStats = async (
  userId: string,
  updates: { totalExp?: number; gold?: number; level?: number },
) => {
  const heroRef = doc(db, "heroes", userId); // Assuming heroId is same as userId
  const heroSnap = await getDoc(heroRef);
  if (!heroSnap.exists()) {
    throw new Error("Hero not found");
  }
  const currentHero = heroSnap.data() as HeroProfile;

  const newTotalExp = (currentHero.totalExp || 0) + (updates.totalExp || 0);
  const newGold = (currentHero.gold || 0) + (updates.gold || 0);
  const newLevel = updates.level !== undefined ? updates.level : currentHero.level;

  await updateDoc(heroRef, {
    totalExp: newTotalExp,
    gold: newGold,
    level: newLevel,
    // currentExp will be calculated based on totalExp and level in client logic
  });
};

// ---------------------------------------------------------------------------
// Quest Functions
// ---------------------------------------------------------------------------

export const createQuest = async (
  userId: string,
  data: Omit<Quest, "id" | "userId" | "heroId" | "status" | "expReward" | "goldReward" | "createdAt" | "deletedAt"> & {
    expReward?: number;
    goldReward?: number;
  },
) => {
  const questsCollection = collection(db, "quests");
  const newQuest: Omit<Quest, "id"> = {
    userId: userId,
    heroId: userId, // Assuming 1:1 user-hero relationship
    title: data.title,
    subject: data.subject,
    difficulty: data.difficulty,
    status: "pending",
    deadlineDate: data.deadlineDate,
    estimatedMinutes: data.estimatedMinutes,
    expReward: data.expReward || 0, // Default or calculated
    goldReward: data.goldReward || 0, // Default or calculated
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };
  await addDoc(questsCollection, newQuest);
};

export const subscribeToQuest = (
  questId: string,
  callback: (quest: Quest | null) => void,
) => {
  const docRef = doc(db, "quests", questId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        id: docSnap.id,
        userId: data.userId,
        heroId: data.heroId,
        title: data.title,
        subject: data.subject,
        difficulty: data.difficulty,
        status: data.status,
        deadlineDate: data.deadlineDate,
        estimatedMinutes: data.estimatedMinutes,
        expReward: data.expReward,
        goldReward: data.goldReward,
        createdAt: data.createdAt,
        deletedAt: data.deletedAt || null,
      });
    } else {
      callback(null);
    }
  });
};

export const subscribeToQuests = (
  userId: string,
  callback: (quests: Quest[]) => void,
) => {
  const q = query(
    collection(db, "quests"),
    where("userId", "==", userId),
    where("deletedAt", "==", null),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests: Quest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quests.push({
        id: doc.id,
        userId: data.userId,
        heroId: data.heroId,
        title: data.title,
        subject: data.subject,
        difficulty: data.difficulty,
        status: data.status,
        deadlineDate: data.deadlineDate,
        estimatedMinutes: data.estimatedMinutes,
        expReward: data.expReward,
        goldReward: data.goldReward,
        createdAt: data.createdAt,
        deletedAt: data.deletedAt || null,
      });
    });
    callback(quests);
  });
};

export const subscribeToActiveQuests = (
  heroId: string,
  callback: (quests: Quest[]) => void,
) => {
  const q = query(
    collection(db, "quests"),
    where("heroId", "==", heroId),
    where("status", "in", ["pending", "inProgress"]), // Active quests are pending or in progress
    where("deletedAt", "==", null),
    orderBy("deadlineDate", "asc"),
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests: Quest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quests.push({
        id: doc.id,
        userId: data.userId,
        heroId: data.heroId,
        title: data.title,
        subject: data.subject,
        difficulty: data.difficulty,
        status: data.status,
        deadlineDate: data.deadlineDate,
        estimatedMinutes: data.estimatedMinutes,
        expReward: data.expReward,
        goldReward: data.goldReward,
        createdAt: data.createdAt,
        deletedAt: data.deletedAt || null,
      });
    });
    callback(quests);
  });
};

export const subscribeToQuestsByParent = (
  childId: string,
  callback: (quests: Quest[]) => void,
) => {
  const q = query(
    collection(db, "quests"),
    where("userId", "==", childId),
    where("deletedAt", "==", null),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (querySnapshot) => {
    const quests: Quest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quests.push({
        id: doc.id,
        userId: data.userId,
        heroId: data.heroId,
        title: data.title,
        subject: data.subject,
        difficulty: data.difficulty,
        status: data.status,
        deadlineDate: data.deadlineDate,
        estimatedMinutes: data.estimatedMinutes,
        expReward: data.expReward,
        goldReward: data.goldReward,
        createdAt: data.createdAt,
        deletedAt: data.deletedAt || null,
      });
    });
    callback(quests);
  });
};

export const updateQuestStatus = async (questId: string, status: Quest["status"]) => {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, { status });
};

export const updateQuest = async (questId: string, updates: Partial<Quest>) => {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, updates);
};

export const deleteQuest = async (questId: string) => {
  const questRef = doc(db, "quests", questId);
  await updateDoc(questRef, { deletedAt: new Date().toISOString() });
};

// ---------------------------------------------------------------------------
// Battle Session Functions
// ---------------------------------------------------------------------------

export const createBattleSession = async (
  userId: string,
  questId: string,
  data: Omit<BattleSession, "id" | "userId" | "questId" | "createdAt">,
) => {
  const sessionsCollection = collection(db, "battleSessions");
  const newSession: Omit<BattleSession, "id"> = {
    userId: userId,
    questId: questId,
    startTime: data.startTime,
    endTime: data.endTime,
    durationSeconds: data.durationSeconds,
    status: data.status,
    rewards: data.rewards,
    createdAt: new Date().toISOString(),
  };
  await addDoc(sessionsCollection, newSession);
};

export const subscribeToBattleSessions = (
  userId: string,
  callback: (sessions: BattleSession[]) => void,
) => {
  const q = query(
    collection(db, "battleSessions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (querySnapshot) => {
    const sessions: BattleSession[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        userId: data.userId,
        questId: data.questId,
        startTime: data.startTime,
        endTime: data.endTime,
        durationSeconds: data.durationSeconds,
        status: data.status,
        rewards: data.rewards,
        createdAt: data.createdAt,
      });
    });
    callback(sessions);
  });
};

export { auth, db, storage };

