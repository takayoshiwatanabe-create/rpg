```diff
--- a/src/components/BattleScene.tsx
+++ b/src/components/BattleScene.tsx
@@ -1,6 +1,6 @@
 import React, { useRef, useEffect, useCallback } from "react";
 import { View, Animated, StyleSheet, Text, Platform } from "react-native";
-import { useReducedMotion } from "@/hooks/useReducedMotion";
+import { useReducedMotion } from "@/hooks/useReducedMotion";
 import { PIXEL_BORDER, FONT_FAMILY_MAIN, FONT_FAMILY_SUB, COLORS, FONT_SIZES, SPACING } from "@/constants/theme"; // Added SPACING
 import { t } from "@/i18n"; // Import t for i18n
 
@@ -16,7 +16,6 @@
   monsterMaxHp: number;
   message: string;
   showAttackFlash?: boolean;
-  // onMessageComplete?: () => void; // This prop is not used in the component
 }
 
 const BattleScene: React.FC<BattleSceneProps> = ({
@@ -28,7 +27,6 @@
   monsterMaxHp,
   message,
   showAttackFlash = false,
-  // onMessageComplete, // Removed unused prop
 }) => {
   const reducedMotion = useReducedMotion();
 
@@ -124,7 +122,7 @@
   },
   flashOverlay: {
     ...StyleSheet.absoluteFillObject,
-    backgroundColor: COLORS.cream, // White flash
+    backgroundColor: COLORS.white, // White flash
     zIndex: 10,
   },
   topPanel: {
@@ -167,7 +165,7 @@
     marginBottom: SPACING.xxs, // Use SPACING.xxs
   },
   hpBarLabel: {
-    color: COLORS.cream,
+    color: COLORS.textDefault,
     fontSize: FONT_SIZES.sm, // Use FONT_SIZES.sm
     fontFamily: FONT_FAMILY,
     width: 40, // Fixed width for label
@@ -190,7 +188,7 @@
     backgroundColor: COLORS.exp, // Green for hero HP
   },
   hpValue: {
-    color: COLORS.cream,
+    color: COLORS.textDefault,
     fontSize: FONT_SIZES.caption, // Use FONT_SIZES.caption
     fontFamily: FONT_FAMILY,
     width: 60, // Fixed width for HP value
@@ -204,7 +202,7 @@
     justifyContent: "center",
   },
   messageText: {
-    color: COLORS.cream,
+    color: COLORS.textDefault,
     fontSize: FONT_SIZES.body, // Use FONT_SIZES.body
     fontFamily: FONT_FAMILY,
     textAlign: "center",
```
