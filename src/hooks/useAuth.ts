import { useContext } from "react";
import { AuthContext, type AuthState } from "@/contexts/AuthContext";

export type { AuthState };

/**
 * Custom hook to access the shared authentication state.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}

