```diff
--- a/src/components/HeroStatus.tsx
+++ b/src/components/HeroStatus.tsx
@@ -23,7 +23,7 @@
           <PixelText variant="heading" color="gold" style={styles.heroName}>
             {hero.displayName}
           </PixelText>
-          <PixelText variant="heading" color="cream" style={styles.levelText}>
+          <PixelText variant="heading" color="textDefault" style={styles.levelText}>
             Lv.{hero.level}
           </PixelText>
         </View>
@@ -52,7 +52,7 @@
         {/* Gold */}
         <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
           <PixelText variant="body" color="cream" style={styles.statusLabel}>
-            {"💰 "}{t("hero.gold")}
+            {"💰 "}{t("hero.gold_label")}
           </PixelText>
           <PixelText variant="body" color="gold" style={styles.goldValue}>
             {hero.gold.toLocaleString()} G
@@ -62,21 +62,21 @@
         {showExtendedStats && (
           <>
             <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
-              <PixelText variant="body" color="cream" style={styles.statusLabel}>
-                {"⚔️ "}{t("hero.attack")}
+              <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
+                {"⚔️ "}{t("hero.attack_label")}
               </PixelText>
-              <PixelText variant="body" color="cream" style={styles.statusValue}>
+              <PixelText variant="body" color="textDefault" style={styles.statusValue}>
                 {hero.attack}
               </PixelText>
             </View>
             <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
-              <PixelText variant="body" color="cream" style={styles.statusLabel}>
-                {"🛡 "}{t("hero.defense")}
+              <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
+                {"🛡 "}{t("hero.defense_label")}
               </PixelText>
-              <PixelText variant="body" color="cream" style={styles.statusValue}>
+              <PixelText variant="body" color="textDefault" style={styles.statusValue}>
                 {hero.defense}
               </PixelText>
             </View>
             <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
-              <PixelText variant="body" color="cream" style={styles.statusLabel}>
+              <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
                 {"✨ "}{t("hero.total_exp")}
               </PixelText>
-              <PixelText variant="body" color="cream" style={styles.statusValue}>
+              <PixelText variant="body" color="textDefault" style={styles.statusValue}>
                 {hero.totalExp}
               </PixelText>
             </View>
```
