```diff
--- a/src/components/ui/DQWindow.tsx
+++ b/src/components/ui/DQWindow.tsx
@@ -37,7 +37,7 @@
     elevation: 4,
   },
   titleContainer: {
-    position: "absolute",
+    position: "absolute", // Position the title outside the main window border
     top: -FONT_SIZES.md / 2 - PIXEL_BORDER.borderWidth,
     backgroundColor: COLORS.bgCard,
     paddingHorizontal: SPACING.xs,
```
