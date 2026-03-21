```diff
--- a/src/components/ui/PixelText.tsx
+++ b/src/components/ui/PixelText.tsx
@@ -1,6 +1,6 @@
 import React from "react";
 import { Text, StyleSheet, TextProps, Platform } from "react-native";
-import { FONT_SIZES, COLORS, FONT_FAMILY_MAIN, FONT_FAMILY_SUB } from "@/constants/theme";
+import { FONT_SIZES, COLORS, FONT_FAMILY_MAIN, FONT_FAMILY_SUB } from "@/constants/theme"; // Ensure FONT_FAMILY_MAIN is imported
 
 type PixelTextVariant = "heading" | "body" | "label" | "caption" | "title" | "stat";
 type PixelTextColor = keyof typeof COLORS;
@@ -15,7 +15,7 @@
   children,
   ...rest
 }: PixelTextProps) {
-  const textColor = COLORS[color] || COLORS.cream;
+  const textColor = COLORS[color] || COLORS.textDefault; // Use textDefault as fallback
 
   const fontStyle =
     variant === "title" || variant === "heading"
```
