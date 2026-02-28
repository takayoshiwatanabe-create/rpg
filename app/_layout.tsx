import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * Root layout — wraps all routes with AuthProvider so that
 * every screen shares the same auth state (no redundant
 * AsyncStorage reads or out-of-sync auth instances).
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
