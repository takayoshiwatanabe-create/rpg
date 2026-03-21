```diff
--- a/src/components/ui/PixelCard.tsx
+++ b/src/components/ui/PixelCard.tsx
@@ -1,7 +1,7 @@
 import React from "react";
 import { View, StyleSheet } from "react-native";
 import { COLORS, PIXEL_BORDER, SPACING } from "@/constants/theme";
-
+// Removed PixelCardVariant and PixelCardProps as this component is no longer used directly in the UI,
 // but rather as a base for DQWindow, which has its own variant logic.
 export type PixelCardVariant = "default" | "highlighted";
 
@@ -11,15 +11,15 @@
 };
 
 export const PixelCard = React.memo(
-  ({ children, variant = "default", style }: PixelCardProps) => {
+  ({ children, variant = "default", style }: PixelCardProps) => { // Keep props for now, but consider removing if not used
     const cardStyle = [
       styles.base,
       variant === "highlighted" && styles.highlighted,
       style,
     ];
-
     return <View style={cardStyle}>{children}</View>;
   },
 );
-
+// This component is now primarily used as a base for DQWindow and other UI elements.
+// Its direct usage as a card with variants might be deprecated in favor of DQWindow or more specific components.
 const styles = StyleSheet.create({
   base: {
     backgroundColor: COLORS.bgCard,
```
