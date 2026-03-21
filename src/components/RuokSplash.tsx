```diff
--- a/src/components/RuokSplash.tsx
+++ b/src/components/RuokSplash.tsx
@@ -34,7 +34,7 @@
   overlay: {
     ...StyleSheet.absoluteFillObject,
     zIndex: 9999,
-    backgroundColor: "#FFFFFF",
+    backgroundColor: COLORS.white, // Use COLORS.white from theme
     alignItems: "center",
     justifyContent: "center",
   },
```
