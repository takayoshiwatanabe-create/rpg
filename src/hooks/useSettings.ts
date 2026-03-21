```diff
--- a/src/hooks/useSettings.ts
+++ b/src/hooks/useSettings.ts
@@ -1,11 +1,13 @@
 import { useState, useEffect, useCallback } from "react";
 import AsyncStorage from "@react-native-async-storage/async-storage";
 import { useAuth } from "./useAuth";
-import { Locale } from "@/i18n";
+import { Locale, getIsRTL, setLang } from "@/i18n"; // Import setLang and getIsRTL
+import { getUserSettings, updateUserSettings, createUserSettings } from "@/lib/firestore"; // Import Firestore functions
 
 export type UserSettings = {
   language: Locale;
   notificationsEnabled: boolean;
+  prefersReducedMotion: boolean; // Added prefersReducedMotion setting
   // Add other settings here
 };
 
@@ -15,46 +17,67 @@
 export function useSettings() {
   const { user, isLoading: authLoading } = useAuth();
   const [settings, setSettings] = useState<UserSettings | null>(null);
-  const [isLoading, setIsLoading] = useState(true);
+  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
 
   const settingsKey = user ? `${SETTINGS_KEY_PREFIX}${user.uid}` : null;
 
   const defaultSettings: UserSettings = {
     language: "ja", // Default to Japanese
     notificationsEnabled: true,
+    prefersReducedMotion: false, // Default to false
   };
 
   const loadSettings = useCallback(async () => {
-    if (!settingsKey) {
+    if (!user) {
+      // If no user, use default settings and stop loading
       setSettings(defaultSettings);
-      setIsLoading(false);
+      setIsLoadingSettings(false);
       return;
     }
+
     try {
-      const storedSettings = await AsyncStorage.getItem(settingsKey);
-      if (storedSettings) {
-        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
+      // Try to load from Firestore first
+      let firestoreSettings = await getUserSettings(user.uid);
+
+      if (firestoreSettings) {
+        setSettings({ ...defaultSettings, ...firestoreSettings });
       } else {
+        // If no settings in Firestore, create them with defaults
+        await createUserSettings(user.uid, defaultSettings);
         setSettings(defaultSettings);
-        await AsyncStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
       }
     } catch (error) {
-      console.error("Failed to load settings from AsyncStorage:", error);
+      console.error("Failed to load or create settings from Firestore:", error);
       setSettings(defaultSettings);
     } finally {
-      setIsLoading(false);
+      setIsLoadingSettings(false);
     }
-  }, [settingsKey]);
+  }, [user]);
 
   useEffect(() => {
     if (!authLoading) {
       loadSettings();
     }
   }, [authLoading, loadSettings]);
+
+  // Apply language setting when it changes
+  useEffect(() => {
+    if (settings?.language && settings.language !== getLang()) {
+      setLang(settings.language);
+    }
+  }, [settings?.language]);
 
   const updateSetting = useCallback(
     async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
-      if (!settingsKey) return;
+      if (!user) {
+        console.warn("Cannot update settings: User not authenticated.");
+        return;
+      }
+
       setSettings((prev) => {
         const newSettings = { ...prev, [key]: value } as UserSettings;
-        AsyncStorage.setItem(settingsKey, JSON.stringify(newSettings)).catch(
-          (error) => console.error("Failed to save settings to AsyncStorage:", error),
-        );
+        // Persist to Firestore
+        updateUserSettings(user.uid, { [key]: value })
+          .catch((error) => console.error("Failed to save settings to Firestore:", error));
         return newSettings;
       });
     },
     [settingsKey],
   );
 
-  return { settings, updateSetting, isLoading };
+  return { settings, updateSetting, isLoading: isLoadingSettings };
 }
```
