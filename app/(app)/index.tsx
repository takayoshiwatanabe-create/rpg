import { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { COLORS } from "@/constants/theme";

/**
 * Index route for the authenticated group.
 *
 * Redirects users to the appropriate screen based on their role:
 * - "parent" → Parent Dashboard
 * - "child" (or any other) → Camp (hero home screen)
 *
 * This prevents a black screen when navigating to /(app) after login.
 */
export default function AppIndexRedirect() {
  const { user, userProfile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;

    // Wait for userProfile to be available before redirecting.
    // Without this, a parent user could be prematurely sent to camp
    // because userProfile is still null during initial auth resolution.
    if (!userProfile) return;

    if (userProfile.role === "parent") {
      router.replace("/(app)/parent");
    } else {
      router.replace("/(app)/camp");
    }
  }, [user, userProfile, isLoading]);

  return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.gold} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bgDark,
  },
});
