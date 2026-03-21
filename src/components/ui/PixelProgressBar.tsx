```diff
--- a/src/components/ui/PixelProgressBar.tsx
+++ b/src/components/ui/PixelProgressBar.tsx
@@ -74,7 +74,7 @@
         />
         {showValues && (
           <PixelText variant="caption" color="cream" style={styles.valueText}>
-            {value}/{max}
+            {value.toLocaleString()}/{max.toLocaleString()}
           </PixelText>
         )}
       </View>
```
