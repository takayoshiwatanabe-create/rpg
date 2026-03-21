```diff
--- a/src/components/ui/DQCommandMenu.tsx
+++ b/src/components/ui/DQCommandMenu.tsx
@@ -1,7 +1,7 @@
 import React from "react";
 import { View, StyleSheet } from "react-native";
 import { PixelButton } from "./PixelButton";
-import { PixelCard } from "./PixelCard";
+import { DQWindow } from "./DQWindow"; // Changed to DQWindow for consistency with DQ style
 import { SPACING } from "@/constants/theme";
 
 export type MenuItem = {
@@ -17,10 +17,10 @@
   style?: object;
 };
 
-export const DQCommandMenu = React.memo(
-  ({ items, style }: DQCommandMenuProps) => {
+export const DQCommandMenu: React.FC<DQCommandMenuProps> = React.memo(
+  ({ items, style }) => {
     return (
-      <PixelCard variant="default" style={[styles.container, style]}>
+      <DQWindow style={[styles.container, style]}>
         <View style={styles.menuItems}>
           {items.map((item, index) => (
             <PixelButton
@@ -33,7 +33,7 @@
             />
           ))}
         </View>
-      </PixelCard>
+      </DQWindow>
     );
   },
 );
```
