import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChange, type LocalUser } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import type { UserProfile } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { calculateLevelFromExpCorrected } from "@/lib/expCalculator"; // Use corrected function
import { HERO_STAT_GROWTH } from "@/constants/game";

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
      let storedProfile = await getUserProfile(localUser.uid);

      if (storedProfile) {
        // Recalculate derived stats like level, maxHp, maxMp, attack, defense
        const level = calculateLevelFromExpCorrected(storedProfile.totalExp); // Use corrected function
        const maxHp = 100 + (level - 1) * HERO_STAT_GROWTH.hp;
        const maxMp = 50 + (level - 1) * HERO_STAT_GROWTH.mp;
        const attack = 10 + (level - 1) * HERO_STAT_GROWTH.attack;
        const defense = 5 + (level - 1) * HERO_STAT_GROWTH.defense;

        // Ensure current HP/MP don't exceed new max values
        const currentHp = Math.min(storedProfile.hp, maxHp);
        const currentMp = Math.min(storedProfile.mp, maxMp);

        return {
          ...storedProfile,
          level,
          maxHp,
          maxMp,
          attack,
          defense,
          hp: currentHp,
          mp: currentMp,
        };
      }
      // If not, return null and expect the app to handle missing profiles
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
