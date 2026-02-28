import { useEffect, useState } from "react";
import { onAuthStateChange, type LocalUser } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import type { UserProfile } from "@/types";

export type AuthState = {
  user: (LocalUser & UserProfile) | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
};

/**
 * Custom hook to manage authentication state.
 * Listens to local auth changes and fetches the user profile from AsyncStorage.
 */
export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChange(async (localUser) => {
      if (!mounted) return;

      if (localUser) {
        try {
          const userProfile = await getUserProfile(localUser.uid);
          if (!mounted) return;
          if (userProfile) {
            setAuthState({
              user: { ...localUser, ...userProfile },
              userProfile,
              isLoading: false,
            });
          } else {
            // User auth exists but no profile yet
            setAuthState({ user: null, userProfile: null, isLoading: false });
          }
        } catch {
          if (mounted) {
            setAuthState({ user: null, userProfile: null, isLoading: false });
          }
        }
      } else {
        setAuthState({ user: null, userProfile: null, isLoading: false });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return authState;
}
