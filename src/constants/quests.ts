```diff
--- a/src/constants/quests.ts
+++ b/src/constants/quests.ts
@@ -1,6 +1,7 @@
 import type { Subject, Difficulty } from "@/types";
 
 export const QUEST_SUBJECTS: Subject[] = [
+  // Aligned with src/constants/game.ts
   "math",
   "japanese",
   "english",
@@ -12,6 +13,7 @@
 ];
 
 export const QUEST_DIFFICULTIES: Difficulty[] = [
+  // Aligned with src/constants/game.ts
   "easy",
   "normal",
   "hard",
```
