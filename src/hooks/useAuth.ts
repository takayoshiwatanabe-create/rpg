import { useAuth as useAuthContext } from "@/contexts/AuthContext";

/**
 * Custom hook to access authentication state and user profile.
 * Throws an error if used outside of an AuthProvider.
 * Re-exports the useAuth hook from AuthContext for cleaner imports.
 */
export const useAuth = useAuthContext;
