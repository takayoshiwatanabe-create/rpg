import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChange, type LocalUser } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import type { UserProfile } from "@/types";
import { useQuery } from "@tanstack/react-query";

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
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setLocalUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", localUser?.uid],
    queryFn: async () => {
      if (!localUser) return null;
      // Check if user profile already exists in local storage (mock Firestore)
      const storedProfile = await getUserProfile(localUser.uid);
      if (storedProfile) {
        return storedProfile;
      }
      // If not, create a default profile (this logic should ideally be in a separate setup function)
      // For now, we'll return null and expect the app to handle missing profiles
      return null;
    },
    enabled: !!localUser,
    staleTime: Infinity, // User profile data is relatively static or updated via other means
  });

  const authState: AuthState = {
    user: localUser && userProfile ? { ...localUser, ...userProfile } : null,
    userProfile: userProfile || null,
    isLoading: isLoadingAuth || isLoadingProfile,
  };

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}

