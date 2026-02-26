import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { getIsRTL } from "@/i18n";
import { COLORS } from "@/constants/theme";

/**
 * Layout for the unauthenticated route group: login, signup.
 *
 * Behaviour:
 * - While auth state is loading, renders nothing (prevents flash of login UI).
 * - Once resolved, redirects authenticated users to /(app).
 * - Unauthenticated users see the Stack of auth screens with no header.
 * - Writing direction switches to RTL when Arabic is active.
 */
export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const isRTL = getIsRTL();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/(app)");
    }
  }, [user, isLoading]);

  // Block render until the session check resolves or redirect completes.
  if (isLoading || user) return null;

  return (
    <View style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: styles.screen,
          animation: "fade",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  screen: {
    backgroundColor: COLORS.bgDark,
  },
});
