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
