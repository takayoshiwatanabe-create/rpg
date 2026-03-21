import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "@/contexts/AuthContext";
import { RuokSplash } from "@/components/RuokSplash";

SplashScreen.preventAutoHideAsync();

/**
 * Root layout — wraps all routes with AuthProvider so that
 * every screen shares the same auth state (no redundant
 * AsyncStorage reads or out-of-sync auth instances).
 */
export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
      {!splashDone && (
        <RuokSplash
          onFinish={() => {
            setSplashDone(true);
            SplashScreen.hideAsync();
          }}
        />
      )}
    </AuthProvider>
  );
}
