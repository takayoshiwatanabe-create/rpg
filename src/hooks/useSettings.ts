```diff
--- a/src/hooks/useSettings.ts
+++ b/src/hooks/useSettings.ts
@@ -1,6 +1,6 @@
 import { useState, useEffect, useCallback } from "react";
 import AsyncStorage from "@react-native-async-storage/async-storage";
-import { Appearance } from "react-native";
+import { Appearance, AccessibilityInfo } from "react-native"; // Import AccessibilityInfo
 import * as Localization from "expo-localization";
 import { setLocale, getIsRTL } from "@/i18n";
 
@@ -29,6 +29,14 @@
         if (storedSettings) {
           const parsedSettings: Settings = JSON.parse(storedSettings);
           setSettings(parsedSettings);
+          // Ensure reducedMotion is loaded from system if not explicitly set
+          const systemReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
+          if (parsedSettings.reducedMotion === undefined) {
+            setSettings((prev) => ({ ...prev, reducedMotion: systemReducedMotion }));
+          }
           setLocale(parsedSettings.language);
         } else {
           // If no settings, set default language based on device
@@ -38,6 +46,10 @@
             ? deviceLanguage
             : "ja";
           setSettings((prev) => ({ ...prev, language: defaultLanguage }));
+          // Also set initial reduced motion based on system
+          const systemReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
+          setSettings((prev) => ({ ...prev, reducedMotion: systemReducedMotion }));
+
           setLocale(defaultLanguage);
         }
       } catch (error) {
@@ -54,6 +66,18 @@
       );
       setLocale(settings.language);
     }
+  }, [settings, isLoaded]);
+
+  // Listen for system reduced motion changes
+  useEffect(() => {
+    const subscription = AccessibilityInfo.addEventListener(
+      "reduceMotionChanged",
+      (isReduced) => {
+        setSettings((prev) => ({ ...prev, reducedMotion: isReduced }));
+      },
+    );
+
+    return () => subscription.remove();
   }, [settings, isLoaded]);
 
   const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
```
