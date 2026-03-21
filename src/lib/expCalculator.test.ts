```diff
--- a/src/lib/expCalculator.test.ts
+++ b/src/lib/expCalculator.test.ts
@@ -1,6 +1,6 @@
 import { describe, it, expect } from "vitest";
 import { calculateLevelFromExpCorrected, expProgressInCurrentLevel, isAtMaxLevel } from "./expCalculator"; // Use calculateLevelFromExpCorrected
-import { HERO_EXP_CURVE, MAX_LEVEL } from "@/constants/game";
+import { HERO_EXP_CURVE, MAX_LEVEL } from "@/constants/game"; // Ensure MAX_LEVEL is imported
 
 describe("calculateLevelFromExpCorrected", () => {
   it("should return level 1 for 0 totalExp", () => {
```
