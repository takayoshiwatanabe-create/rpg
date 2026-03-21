```diff
--- a/src/components/ui/PixelPicker.tsx
+++ b/src/components/ui/PixelPicker.tsx
@@ -102,7 +102,7 @@
   },
   valueText: {
     position: "absolute",
-    width: "100%",
+    width: "100%", // Ensure text takes full width to center
     textAlign: "center",
     color: COLORS.cream,
     fontSize: FONT_SIZES.xs,
```
