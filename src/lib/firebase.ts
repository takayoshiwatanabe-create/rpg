/**
 * Firebase initialization for Hero Homework Quest (Expo / React Native).
 *
 * Required packages — install before use:
 *   npx expo install firebase @react-native-async-storage/async-storage expo-notifications
 *
 * Required env vars (set in .env):
 *   EXPO_PUBLIC_FIREBASE_API_KEY
 *   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   EXPO_PUBLIC_FIREBASE_PROJECT_ID
 *   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   EXPO_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as _signOut,
  onAuthStateChanged,
  type Auth,
  type User,
  type UserCredential,
  type Unsubscribe as AuthUnsubscribe,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL as _getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// Config — values injected via Expo public environment variables at build time
// ---------------------------------------------------------------------------

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Maps FirebaseConfig keys to the exact EXPO_PUBLIC_ env var names so that
// the missing-vars warning is actionable and not misleading.
const ENV_VAR_NAMES: Record<keyof FirebaseConfig, string> = {
  apiKey: "EXPO_PUBLIC_FIREBASE_API_KEY",
  authDomain: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "EXPO_PUBLIC_FIREBASE_APP_ID",
};

function buildConfig(): FirebaseConfig {
  const config: FirebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  if (process.env.NODE_ENV !== "test") {
    const missing = (Object.entries(config) as [keyof FirebaseConfig, string][])
      .filter(([, v]) => v === "")
      .map(([k]) => ENV_VAR_NAMES[k]);

    if (missing.length > 0) {
      console.warn(`[Firebase] Missing env vars: ${missing.join(", ")}`);
    }
  }

  return config;
}

// ---------------------------------------------------------------------------
// Singletons — safe to import at module level (idempotent)
// ---------------------------------------------------------------------------

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(buildConfig()) : getApp();

/**
 * Auth with AsyncStorage-backed persistence so the user session survives
 * app restarts on iOS/Android.
 *
 * `initializeAuth` throws if called a second time on the same app instance,
 * so we fall back to `getAuth` when the app is already initialised (e.g. HMR).
 */
function buildAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth: Auth = buildAuth();
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export { app };

// ---------------------------------------------------------------------------
// Push Notifications
//
// Expo Notifications proxies to FCM (Android) and APNs (iOS) internally.
// Call `registerPushToken()` after login and persist the result to Firestore
// so your server can send targeted notifications via Firebase Admin SDK.
//
// On web, fall back to the Firebase Messaging JS SDK if supported.
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // iOS 14+ foreground presentation options (Expo SDK 51+)
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushToken = string;

/**
 * Requests notification permission and returns an Expo Push Token, or `null`
 * if the user denies permission or the environment does not support it.
 *
 * Requires `extra.eas.projectId` to be set in app.json / app.config.js.
 */
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

  if (!projectId) {
    console.warn(
      "[FCM] EAS projectId not found in app.json extra.eas.projectId. " +
        "Push notifications will not work without it.",
    );
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

// Module-level cache — isSupported() is expensive; only resolve once per session.
let _webMessaging: Awaited<ReturnType<typeof import("firebase/messaging").getMessaging>> | null =
  null;
let _webMessagingResolved = false;

async function resolveWebMessaging(): Promise<typeof _webMessaging> {
  if (_webMessagingResolved) return _webMessaging;
  _webMessagingResolved = true;

  if (typeof window === "undefined" || Platform.OS !== "web") return null;

  try {
    const { getMessaging, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return null;
    _webMessaging = getMessaging(app);
    return _webMessaging;
  } catch {
    return null;
  }
}

/**
 * Returns the Firebase Cloud Messaging instance for the web platform, or
 * `null` on native (iOS/Android) and unsupported browsers.
 *
 * The result is cached — subsequent calls are synchronous after the first.
 * React Native: use `registerPushToken` + `expo-notifications` instead.
 */
export async function getMessagingInstance() {
  return resolveWebMessaging();
}

/**
 * Requests browser notification permission and returns the FCM registration
 * token for web push (VAPID). Returns `null` on native platforms, unsupported
 * browsers, or when permission is denied.
 *
 * After obtaining a token, persist it to Firestore via `storePushToken` so
 * Cloud Functions can target this device.
 *
 * @param vapidKey - Web Push VAPID public key from the Firebase Console
 *                   (Project settings → Cloud Messaging → Web Push certificates).
 *                   Pass `process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY` here.
 */
export async function requestWebFcmToken(
  vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY ?? "",
): Promise<string | null> {
  const messaging = await resolveWebMessaging();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    const { getToken } = await import("firebase/messaging");
    return await getToken(messaging, { vapidKey });
  } catch {
    return null;
  }
}

/**
 * Subscribes to FCM messages received while the web app is in the foreground.
 *
 * Background messages (app not focused) are handled by the service worker at
 * `/public/firebase-messaging-sw.js` and do NOT trigger this handler.
 *
 * Returns a no-op cleanup function on native/unsupported platforms.
 */
export async function onWebForegroundMessage(
  handler: (payload: import("firebase/messaging").MessagePayload) => void,
): Promise<import("firebase/messaging").Unsubscribe> {
  const messaging = await resolveWebMessaging();
  if (!messaging) return () => undefined;

  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, handler);
}

/**
 * Subscribe to foreground notification events.
 * Call `.remove()` on the returned subscription in useEffect cleanup.
 */
export function onNotificationReceived(
  handler: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Subscribe to notification-tap events (background & terminated state).
 * Call `.remove()` on the returned subscription in useEffect cleanup.
 */
export function onNotificationResponse(
  handler: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// ---------------------------------------------------------------------------
// Auth helpers — centralise firebase/auth usage so callers never import it
// directly. This lets us swap auth providers in one place if needed.
// ---------------------------------------------------------------------------

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  await _signOut(auth);
}

/**
 * Subscribes to authentication state changes.
 * Call the returned unsubscribe function in useEffect cleanup.
 */
export function onAuthStateChange(
  handler: (user: User | null) => void,
): AuthUnsubscribe {
  return onAuthStateChanged(auth, handler);
}

// ---------------------------------------------------------------------------
// Storage helpers — sprite & asset management
// All sprites must be WebP per the performance spec (no individual PNGs).
// ---------------------------------------------------------------------------

/**
 * Uploads a WebP sprite/asset blob and returns its stable public download URL.
 * Path conventions:
 *   sprites/{spriteId}.webp        — shared enemy / avatar spritesheets
 *   avatars/{userId}/{avatarId}.webp — user-specific avatar overrides
 */
export async function uploadAsset(
  path: string,
  data: Blob | Uint8Array | ArrayBuffer,
  contentType = "image/webp",
): Promise<string> {
  const assetRef = ref(storage, path);
  await uploadBytes(assetRef, data, { contentType });
  return _getDownloadURL(assetRef);
}

/**
 * Returns the download URL for an already-uploaded asset.
 * The URL is stable — cache it in state rather than re-fetching on every render.
 */
export async function getAssetUrl(path: string): Promise<string> {
  return _getDownloadURL(ref(storage, path));
}

/**
 * Removes an asset from Firebase Storage.
 * Shared spritesheets referenced by multiple users must never be deleted here.
 */
export async function deleteAsset(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
