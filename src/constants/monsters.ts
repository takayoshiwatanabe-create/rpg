```diff
--- a/src/constants/monsters.ts
+++ b/src/constants/monsters.ts
@@ -1,6 +1,6 @@
 import type { Subject, Difficulty } from "@/types";
 
-type MonsterInfo = {
+export type MonsterInfo = { // Exported for use in other components
   nameKey: string;
   emoji: string;
 };
```
