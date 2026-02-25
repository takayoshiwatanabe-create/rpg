import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  runTransaction,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
  type Unsubscribe,
  type FirestoreDataConverter,
} from "firebase/firestore";

import { db } from "./firebase";

import type {
  UserProfile,
  HeroProfile,
  Quest,
  BattleSession,
  Subscription,
  AppSettings,
  QuestStatus,
  BattleOutcome,
  Language,
} from "@/types";

// ---------------------------------------------------------------------------
// Collection paths
// ---------------------------------------------------------------------------

const COL = {
  users: "users",
  quests: "quests",
  battleSessions: "battleSessions",
  heroes: (userId: string) => `users/${userId}/heroes`,
  settings: (userId: string) => `users/${userId}/settings`,
  subscription: (userId: string) => `users/${userId}/subscription`,
} as const;

const DOC = {
  settings: "preferences",
  subscription: "active",
} as const;

// ---------------------------------------------------------------------------
// Generic Firestore converter
// Strips the client-side `id` field on write; injects it on read.
// ---------------------------------------------------------------------------

function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = data;
      return rest;
    },
    fromFirestore(snap: QueryDocumentSnapshot): T {
      return { id: snap.id, ...(snap.data() as Omit<T, "id">) } as T;
    },
  };
}

const converters = {
  user: makeConverter<UserProfile>(),
  hero: makeConverter<HeroProfile>(),
  quest: makeConverter<Quest>(),
  battleSession: makeConverter<BattleSession>(),
} as const;

// ---------------------------------------------------------------------------
// Typed document refs
// ---------------------------------------------------------------------------

const refs = {
  user: (userId: string) =>
    doc(db, COL.users, userId).withConverter(converters.user),

  hero: (userId: string, heroId: string) =>
    doc(db, COL.heroes(userId), heroId).withConverter(converters.hero),

  quest: (questId: string) =>
    doc(db, COL.quests, questId).withConverter(converters.quest),

  battleSession: (sessionId: string) =>
    doc(db, COL.battleSessions, sessionId).withConverter(
      converters.battleSession,
    ),

  settings: (userId: string) =>
    doc(db, COL.settings(userId), DOC.settings),

  subscription: (userId: string) =>
    doc(db, COL.subscription(userId), DOC.subscription),
} as const;

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const snap = await getDoc(refs.user(userId));
  return snap.exists() ? snap.data() : null;
}

export async function setUserProfile(
  userId: string,
  data: Omit<UserProfile, "id">,
): Promise<void> {
  await setDoc(refs.user(userId), { id: userId, ...data });
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<UserProfile, "locale" | "parentId">>,
): Promise<void> {
  await updateDoc(refs.user(userId), data);
}

// ---------------------------------------------------------------------------
// Hero Profile
// ---------------------------------------------------------------------------

export async function getHeroProfile(
  userId: string,
  heroId: string,
): Promise<HeroProfile | null> {
  const snap = await getDoc(refs.hero(userId, heroId));
  return snap.exists() ? snap.data() : null;
}

export async function setHeroProfile(
  userId: string,
  heroId: string,
  data: Omit<HeroProfile, "id">,
): Promise<void> {
  await setDoc(refs.hero(userId, heroId), { id: heroId, ...data });
}

export async function updateHeroProfile(
  userId: string,
  heroId: string,
  data: Partial<
    Pick<
      HeroProfile,
      | "displayName"
      | "avatarId"
      | "level"
      | "totalExp"
      | "hp"
      | "maxHp"
      | "mp"
      | "maxMp"
      | "attack"
      | "defense"
      | "gold"
    >
  >,
): Promise<void> {
  await updateDoc(refs.hero(userId, heroId), data);
}

export function subscribeToHero(
  userId: string,
  heroId: string,
  onData: (hero: HeroProfile | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    refs.hero(userId, heroId),
    (snap) => onData(snap.exists() ? snap.data() : null),
    (err) => onError?.(err),
  );
}

// ---------------------------------------------------------------------------
// App Settings
// ---------------------------------------------------------------------------

export async function getSettings(userId: string): Promise<AppSettings | null> {
  const snap = await getDoc(refs.settings(userId));
  return snap.exists() ? (snap.data() as AppSettings) : null;
}

export async function setSettings(
  userId: string,
  data: AppSettings,
): Promise<void> {
  await setDoc(refs.settings(userId), data);
}

export async function updateSettings(
  userId: string,
  data: Partial<AppSettings>,
): Promise<void> {
  await updateDoc(refs.settings(userId), data as DocumentData);
}

// ---------------------------------------------------------------------------
// Subscription  (client: read-only; writes via Admin SDK / Cloud Functions)
// ---------------------------------------------------------------------------

export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  const snap = await getDoc(refs.subscription(userId));
  return snap.exists() ? (snap.data() as Subscription) : null;
}

export function subscribeToSubscription(
  userId: string,
  onData: (sub: Subscription | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    refs.subscription(userId),
    (snap) => onData(snap.exists() ? (snap.data() as Subscription) : null),
    (err) => onError?.(err),
  );
}

// ---------------------------------------------------------------------------
// Quests
// `userId` is stored alongside quest data to enable security rule enforcement.
// ---------------------------------------------------------------------------

type CreateQuestInput = Omit<Quest, "id"> & { userId: string };

export async function getQuest(questId: string): Promise<Quest | null> {
  const snap = await getDoc(refs.quest(questId));
  return snap.exists() ? snap.data() : null;
}

export async function createQuest(data: CreateQuestInput): Promise<string> {
  const ref = await addDoc(
    collection(db, COL.quests).withConverter(converters.quest),
    { id: "", ...data },
  );
  return ref.id;
}

export async function updateQuest(
  questId: string,
  data: Partial<Pick<Quest, "status" | "completedAt" | "estimatedMinutes">>,
): Promise<void> {
  await updateDoc(refs.quest(questId), data);
}

export async function completeQuest(questId: string): Promise<void> {
  const update: Partial<Pick<Quest, "status" | "completedAt">> = {
    status: "completed" satisfies QuestStatus,
    completedAt: new Date().toISOString(),
  };
  await updateDoc(refs.quest(questId), update);
}

export async function deleteQuest(questId: string): Promise<void> {
  await deleteDoc(refs.quest(questId));
}

/** Real-time listener for all quests belonging to a hero, newest first. */
export function subscribeToQuests(
  heroId: string,
  onData: (quests: Quest[]) => void,
  onError?: (err: Error) => void,
  extraConstraints: QueryConstraint[] = [],
): Unsubscribe {
  const q = query(
    collection(db, COL.quests).withConverter(converters.quest),
    where("heroId", "==", heroId),
    orderBy("createdAt", "desc"),
    ...extraConstraints,
  );

  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  );
}

// ---------------------------------------------------------------------------
// Battle Sessions
// `userId` is stored alongside session data for security rule enforcement.
// ---------------------------------------------------------------------------

type CreateBattleSessionInput = Omit<BattleSession, "id"> & { userId: string };

export async function getBattleSession(
  sessionId: string,
): Promise<BattleSession | null> {
  const snap = await getDoc(refs.battleSession(sessionId));
  return snap.exists() ? snap.data() : null;
}

export async function createBattleSession(
  data: CreateBattleSessionInput,
): Promise<string> {
  const ref = await addDoc(
    collection(db, COL.battleSessions).withConverter(converters.battleSession),
    { id: "", ...data },
  );
  return ref.id;
}

export async function updateBattleSession(
  sessionId: string,
  data: Partial<
    Pick<BattleSession, "completedAt" | "outcome" | "expEarned" | "goldEarned">
  >,
): Promise<void> {
  await updateDoc(refs.battleSession(sessionId), data);
}

export async function completeBattleSession(
  sessionId: string,
  outcome: BattleOutcome,
  rewards: Pick<BattleSession, "expEarned" | "goldEarned">,
): Promise<void> {
  const update: Partial<
    Pick<BattleSession, "completedAt" | "outcome" | "expEarned" | "goldEarned">
  > = {
    outcome,
    expEarned: rewards.expEarned,
    goldEarned: rewards.goldEarned,
    completedAt: new Date().toISOString(),
  };
  await updateDoc(refs.battleSession(sessionId), update);
}

/**
 * Real-time listener restricted to pending/in-progress quests, ordered by
 * deadline ascending — the primary list shown on the Camp screen.
 *
 * Builds its own query (not derived from subscribeToQuests) to ensure the
 * sort order is deadlineDate ASC, not the createdAt DESC used for history.
 * Requires a composite index on (heroId ASC, status ASC, deadlineDate ASC).
 */
export function subscribeToActiveQuests(
  heroId: string,
  onData: (quests: Quest[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const activeStatuses: QuestStatus[] = ["pending", "inProgress"];
  const q = query(
    collection(db, COL.quests).withConverter(converters.quest),
    where("heroId", "==", heroId),
    where("status", "in", activeStatuses),
    orderBy("deadlineDate", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  );
}

/**
 * Fetches the most recent battle sessions for a hero (default: last 20).
 * Used on the Result and Bestiary screens.
 */
export async function getRecentBattleSessions(
  heroId: string,
  maxResults = 20,
): Promise<BattleSession[]> {
  const q = query(
    collection(db, COL.battleSessions).withConverter(converters.battleSession),
    where("heroId", "==", heroId),
    orderBy("startedAt", "desc"),
    limit(maxResults),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

// ---------------------------------------------------------------------------
// Push Token — stored per-user so the server can target devices via FCM.
// Call after `registerPushToken()` resolves to a non-null value.
// ---------------------------------------------------------------------------

/** Document shape stored under users/{userId}/pushTokens/{token} */
interface PushTokenRecord {
  token: string;
  platform: string;
  locale: Language;
  updatedAt: string;
}

/**
 * Upserts the device push token for the given user.
 * Using the token itself as the document ID makes writes idempotent and
 * avoids accumulating stale tokens when the user reinstalls the app.
 *
 * @param platform - pass `Platform.OS` from `react-native` at the call site.
 */
export async function storePushToken(
  userId: string,
  token: string,
  locale: Language,
  platform: string,
): Promise<void> {
  const record: PushTokenRecord = {
    token,
    platform,
    locale,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(
    doc(db, "users", userId, "pushTokens", encodeURIComponent(token)),
    record,
  );
}

/**
 * Removes a push token when the user logs out or revokes notification
 * permission, preventing notifications from being sent to that device.
 */
export async function removePushToken(
  userId: string,
  token: string,
): Promise<void> {
  await deleteDoc(
    doc(db, "users", userId, "pushTokens", encodeURIComponent(token)),
  );
}

// ---------------------------------------------------------------------------
// Hero listing — used by the parent dashboard to enumerate all heroes for a child
// ---------------------------------------------------------------------------

/** One-shot fetch of every hero belonging to a user. */
export async function listHeroes(userId: string): Promise<HeroProfile[]> {
  const snap = await getDocs(
    collection(db, COL.heroes(userId)).withConverter(converters.hero),
  );
  return snap.docs.map((d) => d.data());
}

/**
 * Real-time listener for all heroes belonging to a user.
 * Fires immediately with the current list and again on any change.
 */
export function subscribeToHeroes(
  userId: string,
  onData: (heroes: HeroProfile[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, COL.heroes(userId)).withConverter(converters.hero),
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  );
}

// ---------------------------------------------------------------------------
// Parent dashboard — query quests across all children of the signed-in parent
// ---------------------------------------------------------------------------

/**
 * Real-time listener for all quests owned by a specific user (child).
 * Designed for the parent dashboard; queries by `userId` field rather than
 * `heroId` so a single subscription covers all heroes.
 *
 * Requires a composite Firestore index: quests(userId ASC, createdAt DESC).
 * Create it in the Firebase Console or via `firebase deploy --only firestore:indexes`.
 */
export function subscribeToQuestsByUser(
  userId: string,
  onData: (quests: Quest[]) => void,
  onError?: (err: Error) => void,
  extraConstraints: QueryConstraint[] = [],
): Unsubscribe {
  const q = query(
    collection(db, COL.quests).withConverter(converters.quest),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    ...extraConstraints,
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  );
}

// ---------------------------------------------------------------------------
// Soft delete — spec forbids hard deletes on quests; use `deletedAt` sentinel
// ---------------------------------------------------------------------------

/**
 * Marks a quest as deleted by setting `deletedAt` without removing the document.
 * Queries should filter with `where("deletedAt", "==", null)` to exclude
 * soft-deleted documents. Prefer this over `deleteQuest` in production flows.
 */
export async function softDeleteQuest(questId: string): Promise<void> {
  // Use an untyped ref so we can add the out-of-schema `deletedAt` field.
  await updateDoc(doc(db, COL.quests, questId), {
    deletedAt: new Date().toISOString(),
  } as DocumentData);
}

// ---------------------------------------------------------------------------
// Atomic quest completion + hero reward — prevents split-brain state where
// the quest is marked done but the hero never receives EXP/gold (or vice-versa)
// ---------------------------------------------------------------------------

/**
 * Atomically marks a quest as completed and applies the pre-computed hero
 * state in a single Firestore transaction.
 *
 * Usage:
 * ```ts
 * const reward = calculateQuestRewards(quest.difficulty, isQuestOverdue(quest.deadlineDate));
 * const newHero = applyRewardsToHero(hero, reward);
 * await completeQuestWithRewards(quest.id, hero.id, userId, newHero);
 * ```
 *
 * Throws if either the quest or hero document no longer exists, or if the
 * transaction is aborted due to a concurrent write after the configured number
 * of retries (Firestore default: 5 attempts).
 */
export async function completeQuestWithRewards(
  questId: string,
  heroId: string,
  userId: string,
  updatedHero: Omit<HeroProfile, "id">,
): Promise<void> {
  const questRef = refs.quest(questId);
  const heroRef = refs.hero(userId, heroId);
  const completedAt = new Date().toISOString();

  await runTransaction(db, async (t) => {
    const questSnap = await t.get(questRef);
    if (!questSnap.exists()) throw new Error(`Quest ${questId} not found`);

    const heroSnap = await t.get(heroRef);
    if (!heroSnap.exists()) throw new Error(`Hero ${heroId} not found`);

    // Prevent double-completion (race condition guard)
    if (questSnap.data().status === "completed") {
      throw new Error(`Quest ${questId} is already completed`);
    }

    t.update(questRef, {
      status: "completed" satisfies QuestStatus,
      completedAt,
    });

    // `t.set` with the typed ref invokes the converter which strips `id`
    // before writing, then re-injects it on read.
    t.set(heroRef, { id: heroId, ...updatedHero });
  });
}
