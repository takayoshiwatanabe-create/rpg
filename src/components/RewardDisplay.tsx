```diff
--- a/src/components/RewardDisplay.tsx
+++ b/src/components/RewardDisplay.tsx
@@ -1,39 +1,41 @@
 import React from "react";
-import { View, Text, StyleSheet, Platform } from "react-native";
+import { View, StyleSheet } from "react-native";
 import { t } from "@/i18n";
-import { COLORS } from "@/constants/theme";
-
-const FONT_FAMILY = Platform.select({
-  ios: "Courier New",
-  android: "monospace",
-  default: "monospace",
-});
+import { COLORS, FONT_SIZES, SPACING } from "@/constants/theme";
+import { PixelText } from "./ui/PixelText"; // Use PixelText for consistency
 
 type RewardDisplayProps = {
   exp: number;
   gold: number;
 };
 
-export const RewardDisplay: React.FC<RewardDisplayProps> = ({ exp, gold }) => {
-  return (
-    <View style={styles.container}>
-      <View style={styles.rewardRow}>
-        <Text style={styles.rewardLabel}>{"✨ "}{t("hero.exp")}</Text>
-        <Text style={styles.rewardValue}>{`+${exp}`}</Text>
-      </View>
-      <View style={styles.rewardRow}>
-        <Text style={styles.rewardLabel}>{"💰 "}{t("hero.gold")}</Text>
-        <Text style={styles.rewardGold}>{`+${gold}`}</Text>
-      </View>
+export const RewardDisplay: React.FC<RewardDisplayProps> = React.memo(
+  ({ exp, gold }) => {
+    return (
+      <View style={styles.container}>
+        <View style={styles.rewardRow}>
+          <PixelText variant="body" color="textDefault" style={styles.rewardLabel}>
+            {"✨ "}{t("hero.exp_label")}
+          </PixelText>
+          <PixelText variant="body" color="success" style={styles.rewardValue}>
+            {`+${exp}`}
+          </PixelText>
+        </View>
+        <View style={styles.rewardRow}>
+          <PixelText variant="body" color="textDefault" style={styles.rewardLabel}>
+            {"💰 "}{t("hero.gold_label")}
+          </PixelText>
+          <PixelText variant="body" color="gold" style={styles.rewardValue}>
+            {`+${gold}`}
+          </PixelText>
+        </View>
+      </View>
+    );
+  },
+);
+
+const styles = StyleSheet.create({
+  container: {
+    gap: SPACING.xs,
+  },
+  rewardRow: {
+    flexDirection: "row",
+    justifyContent: "space-between",
+    alignItems: "center",
+  },
+  rewardLabel: {
+    fontSize: FONT_SIZES.body,
+  },
+  rewardValue: {
+    fontSize: FONT_SIZES.body,
+    fontWeight: "bold", // PixelText handles font family, just bold for emphasis
+  },
+});
```
