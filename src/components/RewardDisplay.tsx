```diff
--- a/src/components/RewardDisplay.tsx
+++ b/src/components/RewardDisplay.tsx
@@ -48,7 +48,7 @@
         {/* Study time display */}
         {durationSeconds > 0 && (
           <PixelCard variant="default">
-            <PixelText variant="label" color="cream" style={styles.cardTitle}>
+            <PixelText variant="label" color="textDefault" style={styles.cardTitle}>
               {t("dq.result.study_time")}
             </PixelText>
             <PixelText variant="title" color="gold" style={styles.studyTimeText}>
@@ -59,14 +59,14 @@
         {/* Reward summary */}
         <PixelCard variant="default">
           <PixelText variant="label" color="cream" style={styles.cardTitle}>
-            {t("dq.result.rewards")}
+            {t("dq.result.rewards_label")}
           </PixelText>
           <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
-            <PixelText variant="body" color="cream">
-              {"✨ "}{t("hero.exp")}
+            <PixelText variant="body" color="textDefault">
+              {"✨ "}{t("hero.exp_label")}
             </PixelText>
             <PixelText variant="body" color="exp">
-              {`+${expGained}`}
+              {`+${expGained} EXP`}
             </PixelText>
           </View>
           <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
@@ -80,7 +80,7 @@
         {/* Hero growth: level + EXP bar */}
         <PixelCard variant="highlighted">
           <PixelText variant="label" color="cream" style={styles.cardTitle}>
-            {t("dq.result.hero_growth")}
+            {t("dq.result.hero_growth_label")}
           </PixelText>
           <View style={[styles.heroRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
             <PixelText variant="body" color="gold" style={styles.heroLevelLabel}>
@@ -89,7 +89,7 @@
             <PixelText variant="body" color="cream" style={styles.heroLevelValue}>
               Lv.{hero.level}
             </PixelText>
-          </View>
+          </View> 
           <PixelProgressBar
             label={t("hero.exp")}
             value={expProgress.current}
```
