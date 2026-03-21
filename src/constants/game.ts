```diff
--- a/src/constants/game.ts
+++ b/src/constants/game.ts
@@ -1,6 +1,7 @@
 import { Subject, Difficulty } from "@/types";
 
 export const QUEST_SUBJECTS: Subject[] = [
+  // Aligned with src/constants/quests.ts
   "math",
   "japanese",
   "english",
@@ -12,6 +13,7 @@
 ];
 
 export const QUEST_DIFFICULTIES: Difficulty[] = [
+  // Aligned with src/constants/quests.ts
   "easy",
   "normal",
   "hard",
@@ -66,10 +68,10 @@
     hard: { emoji: "🔬", nameKey: "monster.science.hard" },
     very_hard: { emoji: "🔭", nameKey: "monster.science.very_hard" },
   },
-  social_studies: {
-    easy: { emoji: "🗺️", nameKey: "monster.social_studies.easy" },
-    normal: { emoji: "🏛️", nameKey: "monster.social_studies.normal" },
-    hard: { emoji: "🌍", nameKey: "monster.social_studies.hard" },
-    very_hard: { emoji: "👑", nameKey: "monster.social_studies.very_hard" },
+  social: { // Changed to 'social' to align with src/constants/quests.ts
+    easy: { emoji: "🗺️", nameKey: "monster.social.easy" },
+    normal: { emoji: "🏛️", nameKey: "monster.social.normal" },
+    hard: { emoji: "🌍", nameKey: "monster.social.hard" },
+    very_hard: { emoji: "👑", nameKey: "monster.social.very_hard" },
   },
   art: {
     easy: { emoji: "🎨", nameKey: "monster.art.easy" },
```
