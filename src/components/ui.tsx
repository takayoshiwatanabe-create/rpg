```diff
--- a/src/components/ui.tsx
+++ b/src/components/ui.tsx
@@ -15,6 +15,7 @@
   AccessibilityRole,
   AccessibilityState,
 } from "react-native";
+import { Switch } from "react-native"; // Import Switch for PixelSwitch
 import * as Haptics from "expo-haptics";
 import { Audio } from "expo-av";
 import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
@@ -35,7 +36,7 @@
   | "body"
   | "label"
   | "caption"
-  | "title"
+  | "title" // Renamed from 'title' to 'heading' in theme.ts, but kept here for now
   | "subheading" // Added 'subheading' to align with common UI patterns
   | "subtitle";
 type PixelTextColor =
@@ -48,7 +49,7 @@
   | "info"
   | "gray"
   | "exp"
-  | "hp"
+  | "hp" // Renamed to 'danger' in theme.ts, but kept here for now
   | "textDefault" // Added textDefault for general text color
   | "mp";
 
@@ -69,7 +70,7 @@
   ellipsizeMode,
   accessibilityLabel,
 }) => {
-  const textColor = COLORS[color] || COLORS.white;
+  const textColor = COLORS[color] || COLORS.textDefault; // Use textDefault as fallback
 
   const textStyles = StyleSheet.flatten([
     styles.baseText,
```
