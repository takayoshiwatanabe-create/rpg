```diff
--- a/src/hooks/useReducedMotion.ts
+++ b/src/hooks/useReducedMotion.ts
@@ -1,6 +1,7 @@
 import { useEffect, useState } from "react";
 import { AccessibilityInfo } from "react-native";
 
+// This hook is used to respect the user's system-wide "Reduce Motion" setting.
 /**
  * Returns true when the system "Reduce Motion" accessibility setting is enabled.
  * Use this to skip or simplify animations for users who prefer reduced motion.
```
