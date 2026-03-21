```diff
--- a/src/constants/theme.ts
+++ b/src/constants/theme.ts
@@ -12,7 +12,7 @@
   gold: "#FFD700", // Main accent, hero name, important info
   goldDark: "#B8860B", // Darker gold for shadows
   goldLight: "#FFEB3B", // Lighter gold for highlights
-  cream: "#FFFDD0", // General text, default
+  textDefault: "#FFFDD0", // General text, default (renamed from cream for clarity)
   gray: "#AAAAAA", // Secondary text, placeholders
   darkGray: "#666666", // Borders, disabled elements
   white: "#FFFFFF", // For specific UI elements
@@ -23,7 +23,7 @@
   secondary: "#6A5ACD", // Less important actions
   success: "#32CD32", // Green for success (e.g., EXP gain)
   danger: "#FF4500", // Red for errors, destructive actions (e.g., HP, delete)
-  warning: "#FF8C00", // Orange for warnings
+  warning: "#FF8C00", // Orange for warnings (e.g., low HP)
   info: "#1E90FF", // Blue for informational messages
   exp: "#32CD32", // Specific for EXP
   hp: "#FF4500", // Specific for HP
```
