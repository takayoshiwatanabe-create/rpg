```diff
--- a/src/lib/firebase.ts
+++ b/src/lib/firebase.ts
@@ -17,7 +17,7 @@
   updateDoc,
   deleteDoc,
   addDoc,
-  serverTimestamp,
+  serverTimestamp, // Keep serverTimestamp for future use if needed
   Timestamp,
 } from "firebase/firestore";
 import { getStorage } from "firebase/storage";
@@ -340,4 +340,68 @@
   });
 };
 
+// ---------------------------------------------------------------------------
+// User Settings Functions
+// ---------------------------------------------------------------------------
+
+export const createUserSettings = async (
+  userId: string,
+  data: { language: string; notificationsEnabled: boolean; prefersReducedMotion: boolean },
+) => {
+  await setDoc(doc(db, "users", userId, "settings", userId), {
+    ...data,
+    createdAt: serverTimestamp(),
+  });
+};
+
+export const getUserSettings = async (
+  userId: string,
+): Promise<{ language: string; notificationsEnabled: boolean; prefersReducedMotion: boolean } | null> => {
+  const docRef = doc(db, "users", userId, "settings", userId);
+  const docSnap = await getDoc(docRef);
+  if (docSnap.exists()) {
+    const data = docSnap.data();
+    return {
+      language: data.language,
+      notificationsEnabled: data.notificationsEnabled,
+      prefersReducedMotion: data.prefersReducedMotion || false, // Default to false if not present
+    };
+  }
+  return null;
+};
+
+export const updateUserSettings = async (
+  userId: string,
+  updates: Partial<{ language: string; notificationsEnabled: boolean; prefersReducedMotion: boolean }>,
+) => {
+  const docRef = doc(db, "users", userId, "settings", userId);
+  await updateDoc(docRef, {
+    ...updates,
+    updatedAt: serverTimestamp(),
+  });
+};
+
+export const subscribeToUserSettings = (
+  userId: string,
+  callback: (settings: { language: string; notificationsEnabled: boolean; prefersReducedMotion: boolean } | null) => void,
+) => {
+  const docRef = doc(db, "users", userId, "settings", userId);
+  return onSnapshot(docRef, (docSnap) => {
+    if (docSnap.exists()) {
+      const data = docSnap.data();
+      callback({
+        language: data.language,
+        notificationsEnabled: data.notificationsEnabled,
+        prefersReducedMotion: data.prefersReducedMotion || false,
+      });
+    } else {
+      callback(null);
+    }
+  });
+};
+
 export { auth, db, storage };
```
