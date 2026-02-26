import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/src/lib/firebase";
import { getUserProfile } from "@/src/lib/firestore"; // Ensure getUserProfile is exported
import type { UserProfile } from "@/types";

export type AuthState = {
  user: (FirebaseUser & UserProfile) | null;
  isLoading: boolean;
};

/**
 * Custom hook to manage authentication state.
 * It listens to Firebase Auth changes and fetches the user's profile from Firestore.
 */
export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          if (userProfile) {
            setAuthState({
              user: { ...firebaseUser, ...userProfile },
              isLoading: false,
            });
          } else {
            // User exists in Auth but no profile in Firestore (shouldn't happen with proper registration)
            console.warn("User profile not found for UID:", firebaseUser.uid);
            setAuthState({ user: null, isLoading: false });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setAuthState({ user: null, isLoading: false });
        }
      } else {
        setAuthState({ user: null, isLoading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
}

