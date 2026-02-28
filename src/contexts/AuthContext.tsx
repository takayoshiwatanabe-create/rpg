import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChange, type LocalUser } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import type { UserProfile } from "@/types";

export type AuthState = {
  user: (LocalUser & UserProfile) | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
};

const initialState: AuthState = {
  user: null,
  userProfile: null,
  isLoading: true,
};

export const AuthContext = createContext<AuthState>(initialState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState);

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

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}
