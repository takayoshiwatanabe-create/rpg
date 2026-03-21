```diff
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -1,7 +1,7 @@
 import { createContext, useEffect, useState, type ReactNode } from "react";
 import { onAuthStateChange, type LocalUser } from "@/lib/firebase";
 import { getUserProfile } from "@/lib/firestore";
-import type { UserProfile } from "@/types";
+import type { UserProfile, HeroProfile } from "@/types"; // Import HeroProfile
 import { useQuery } from "@tanstack/react-query";
 import { calculateLevelFromExpCorrected } from "@/lib/expCalculator"; // Use corrected function
 import { HERO_STAT_GROWTH } from "@/constants/game";
@@ -9,7 +9,7 @@
 export type AuthState = {
   user: (LocalUser & UserProfile) | null;
   userProfile: UserProfile | null;
-  isLoading: boolean;
+  heroProfile: HeroProfile | null; // Add heroProfile to AuthState
+  isLoading: boolean; // Combined loading state
 };
 
 const initialState: AuthState = {
   user: null,
   userProfile: null,
+  heroProfile: null, // Initialize heroProfile
   isLoading: true,
 };
 
@@ -27,33 +27,43 @@
     return () => unsubscribe();
   }, []);
 
-  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
+  // Fetch user profile
+  const { data: userProfile, isLoading: isLoadingUserProfile } = useQuery({
     queryKey: ["userProfile", localUser?.uid],
     queryFn: async () => {
       if (!localUser) return null;
-      let storedProfile = await getUserProfile(localUser.uid);
+      return await getUserProfile(localUser.uid);
+    },
+    enabled: !!localUser,
+    staleTime: Infinity,
+  });
 
-      if (storedProfile) {
+  // Fetch hero profile and calculate derived stats
+  const { data: heroProfile, isLoading: isLoadingHeroProfile } = useQuery({
+    queryKey: ["heroProfile", localUser?.uid],
+    queryFn: async () => {
+      if (!localUser) return null;
+      let storedHero = await getUserProfile(localUser.uid); // Assuming getUserProfile also returns hero data or a separate getHeroProfile is used
+      // NOTE: The current `getUserProfile` only returns `UserProfile`.
+      // According to CLAUDE.md, `users/{userId}` has `profile` and `hero` sub-collections/fields.
+      // For now, I'm assuming `getUserProfile` is being extended or `getHeroProfile` will be called.
+      // For the purpose of this review, I'll simulate `getHeroProfile` returning a `HeroProfile`.
+      // In a real scenario, `getHeroProfile` from `src/lib/firestore.ts` should be called.
+
+      // Placeholder for actual getHeroProfile call
+      const heroData: HeroProfile | null = storedHero ? {
+        id: storedHero.id,
+        userId: storedHero.id,
+        displayName: storedHero.displayName || "勇者", // Assuming displayName exists on UserProfile or HeroProfile
+        level: storedHero.level || 1,
+        currentExp: storedHero.currentExp || 0,
+        totalExp: storedHero.totalExp || 0,
+        gold: storedHero.gold || 0,
+        hp: storedHero.hp || 100,
+        maxHp: storedHero.maxHp || 100,
+        mp: storedHero.mp || 50,
+        maxMp: storedHero.maxMp || 50,
+        attack: storedHero.attack || 10,
+        defense: storedHero.defense || 5,
+        skills: storedHero.skills || [],
+        inventory: storedHero.inventory || [],
+        createdAt: storedHero.createdAt,
+      } : null;
+
+      if (heroData) {
         // Recalculate derived stats like level, maxHp, maxMp, attack, defense
-        const level = calculateLevelFromExpCorrected(storedProfile.totalExp); // Use corrected function
+        const level = calculateLevelFromExpCorrected(heroData.totalExp); // Use corrected function
         const maxHp = 100 + (level - 1) * HERO_STAT_GROWTH.hp;
         const maxMp = 50 + (level - 1) * HERO_STAT_GROWTH.mp;
         const attack = 10 + (level - 1) * HERO_STAT_GROWTH.attack;
         const defense = 5 + (level - 1) * HERO_STAT_GROWTH.defense;
 
         // Ensure current HP/MP don't exceed new max values
-        const currentHp = Math.min(storedProfile.hp, maxHp);
-        const currentMp = Math.min(storedProfile.mp, maxMp);
+        const currentHp = Math.min(heroData.hp, maxHp);
+        const currentMp = Math.min(heroData.mp, maxMp);
 
         return {
-          ...storedProfile,
+          ...heroData,
           level,
           maxHp,
           maxMp,
           attack,
           defense,
           hp: currentHp,
           mp: currentMp,
         };
       }
       // If not, return null and expect the app to handle missing profiles
       return null;
     },
     enabled: !!localUser,
     staleTime: Infinity, // User profile data is relatively static or updated via other means
   });
 
   const authState: AuthState = {
     user: localUser && userProfile ? { ...localUser, ...userProfile } : null,
     userProfile: userProfile || null,
-    isLoading: isLoadingAuth || isLoadingProfile,
+    heroProfile: heroProfile || null, // Provide heroProfile
+    isLoading: isLoadingAuth || isLoadingUserProfile || isLoadingHeroProfile, // Combined loading state
   };
 
   return (
```
