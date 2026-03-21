```diff
--- a/src/hooks/useAuth.ts
+++ b/src/hooks/useAuth.ts
@@ -1,6 +1,6 @@
-import { useContext } from "react";
-import { AuthContext, type AuthState } from "@/contexts/AuthContext";
-
-// Re-export AuthState for convenience
-export type { AuthState };
+import { useAuth as useAuthContext } from "@/contexts/AuthContext"; // Import the actual hook
 
 /**
  * Custom hook to access authentication state and user profile.
  * Throws an error if used outside of an AuthProvider.
  */
-export const useAuth = () => {
-  const context = useContext(AuthContext);
-  if (context === undefined) {
-    throw new Error("useAuth must be used within an AuthProvider");
-  }
-  return context;
-};
+export const useAuth = useAuthContext; // Re-export the hook directly
```
