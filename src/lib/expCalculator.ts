```diff
--- a/src/lib/expCalculator.ts
+++ b/src/lib/expCalculator.ts
@@ -1,4 +1,4 @@
-import { HERO_EXP_CURVE, MAX_LEVEL } from "@/constants/game";
+import { HERO_EXP_CURVE, MAX_LEVEL } from "@/constants/game"; // Ensure MAX_LEVEL is imported
 
 /**
  * Calculates the hero's current level based on their total experience points.
```
