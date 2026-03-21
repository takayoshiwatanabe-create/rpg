```diff
--- a/src/components/RewardDisplay.tsx
+++ b/src/components/RewardDisplay.tsx
@@ -20,12 +20,12 @@
   return (
     <View style={styles.container}>
       <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
-        <PixelText variant="body" color="cream" style={styles.rewardLabel} accessibilityLabel={t("hero.exp")}>
-          {"✨ "}{t("hero.exp")}
+        <PixelText variant="body" color="textDefault" style={styles.rewardLabel} accessibilityLabel={t("hero.exp_label")}>
+          {"✨ "}{t("hero.exp_label")}
         </PixelText>
-        <PixelText variant="body" color="exp" style={styles.rewardValue} accessibilityLabel={`${exp} ${t("hero.exp")}`}>
+        <PixelText variant="body" color="exp" style={styles.rewardValue} accessibilityLabel={`${exp} ${t("hero.exp_label")}`}>
           {`+${exp}`}
         </PixelText>
       </View>
       <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
-        <PixelText variant="body" color="cream" style={styles.rewardLabel} accessibilityLabel={t("hero.gold")}>
-          {"💰 "}{t("hero.gold")}
+        <PixelText variant="body" color="textDefault" style={styles.rewardLabel} accessibilityLabel={t("hero.gold_label")}>
+          {"💰 "}{t("hero.gold_label")}
         </PixelText>
-        <PixelText variant="body" color="gold" style={styles.rewardValue} accessibilityLabel={`${gold} ${t("hero.gold")}`}>
+        <PixelText variant="body" color="gold" style={styles.rewardValue} accessibilityLabel={`${gold} ${t("hero.gold_label")}`}>
           {`+${gold}`}
         </PixelText>
       </View>
```
