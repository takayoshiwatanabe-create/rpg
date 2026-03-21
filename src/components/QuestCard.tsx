```diff
--- a/src/components/QuestCard.tsx
+++ b/src/components/QuestCard.tsx
@@ -53,7 +53,7 @@
             </PixelText>
           </View>
 
-          <PixelText variant="body" color="cream" style={styles.title}>
+          <PixelText variant="body" color="textDefault" style={styles.title}>
             {quest.title}
           </PixelText>
 
```
