import { useState, useEffect, useCallback } from "react";
import { type User } from "firebase/auth";
import { onAuthStateChange, signOut as firebaseSignOut } from "@/src/lib/firebase";
import { getUserProfile } from "@/src/lib/firestore";
import { type UserProfile } from "@/types";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";
import { t } from "@/i18n";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

export interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
}

/**
 * Subscribes to Firebase auth state and resolves the matching Firestore
 * UserProfile. `isLoading` is true until the first auth event is received,
 * allowing layouts to block render until the session is confirmed or denied.
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setState({ user, profile, isLoading: false });
          // Register for push notifications if the user is authenticated
          registerForPushNotificationsAsync();
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          // Auth is valid but profile fetch failed — still mark loaded.
          setState({ user, profile: null, isLoading: false });
        }
      } else {
        setState({ user: null, profile: null, isLoading: false });
      }
    });

    return unsubscribe;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut();
  }, []);

  return { ...state, signOut };
}

async function registerForPushNotificationsAsync() {
  let token;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(t("common.error"), t("notifications.permission_denied"));
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", token);

  // You might want to send this token to your backend/Firestore to associate it with the user
  // For example: await savePushTokenToFirestore(user.uid, token);
}

