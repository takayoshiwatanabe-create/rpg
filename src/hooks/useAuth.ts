```diff
--- a/src/hooks/useAuth.ts
+++ b/src/hooks/useAuth.ts
@@ -1,6 +1,6 @@
 import { useContext } from "react";
 import { AuthContext, type AuthState } from "@/contexts/AuthContext";
-
+// Re-export AuthState for convenience
 export type { AuthState };
 
 /**
```
