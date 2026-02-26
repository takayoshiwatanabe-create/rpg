import { useState, useEffect, useCallback } from "react";
import { type User } from "firebase/auth";
import { onAuthStateChange, signOut as firebaseSignOut } from "@/src/lib/firebase";
import { getUserProfile } from "@/src/lib/firestore";
import { type UserProfile } from "@/types";

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

