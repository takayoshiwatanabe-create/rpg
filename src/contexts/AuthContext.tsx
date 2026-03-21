```diff
--- a/src/contexts/AuthContext.tsx
+++ b/src/contexts/AuthContext.tsx
@@ -1,6 +1,5 @@
 import React, {
   createContext,
-  useContext,
   useEffect,
   useState,
   useCallback,
@@ -10,6 +9,7 @@
 import { doc, onSnapshot } from "firebase/firestore";
 import { UserProfile } from "@/types";
 
+// Define the shape of the AuthContext
 interface AuthContextType {
   user: FirebaseUser | null;
   userProfile: UserProfile | null;
@@ -17,6 +17,7 @@
   logout: () => Promise<void>;
 }
 
+// Create the context with an initial undefined value
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
@@ -32,7 +33,7 @@
     const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
       setUser(firebaseUser);
       if (firebaseUser) {
-        const userProfileRef = doc(firestore, "userProfiles", firebaseUser.uid);
+        const userProfileRef = doc(firestore, "users", firebaseUser.uid, "profile"); // Corrected path to user profile
         const unsubscribeProfile = onSnapshot(userProfileRef, (docSnap) => {
           if (docSnap.exists()) {
             setUserProfile(docSnap.data() as UserProfile);
@@ -58,10 +59,10 @@
   );
 };
 
-export const useAuth = () => {
-  const context = useContext(AuthContext);
-  if (context === undefined) {
-    throw new Error("useAuth must be used within an AuthProvider");
-  }
-  return context;
-};
+// Custom hook to use the AuthContext
+export const useAuth = () => { // Export useAuth from here
+  const context = React.useContext(AuthContext); // Use React.useContext
+  if (context === undefined) {
+    throw new Error("useAuth must be used within an AuthProvider"); // Error for misuse
+  }
+  return context; // Return the context value
+};
```
