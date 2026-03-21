```diff
--- a/src/i18n.ts
+++ b/src/i18n.ts
@@ -1,6 +1,7 @@
 import { getLocales } from "expo-localization";
 import { I18nManager } from "react-native";
 import AsyncStorage from "@react-native-async-storage/async-storage";
+import * as Updates from "expo-updates"; // Import Updates for full RTL reload
 
 // Define supported locales and their display names
 export const LANGUAGES = {
@@ -79,8 +80,10 @@
   await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
   await loadTranslations(locale);
   I18nManager.forceRTL(getIsRTL());
-  // Note: For React Native, you might need to reload the app or specific components
-  // to fully apply RTL changes, especially for layout.
+  // For full RTL layout changes to take effect, a reload is often necessary.
+  if (Updates.is  Available) { // Check if running in an Expo Go or standalone app
+    Updates.reloadAsync();
+  }
 }
 
 export function getLang(): Locale {
```
