import { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, I18nManager } from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getIsRTL } from "@/i18n";
import { COLORS } from "@/constants/theme";

/**
 * Layout for the unauthenticated route group: login, signup.
 *
 * Shows a loading indicator while auth state resolves.
 * Redirects authenticated users to /(app).
 */
export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const isRTL = getIsRTL();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/(app)");
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }
  }, [isRTL]);

  // Show loading indicator while auth state resolves
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  // Wait for redirect to complete
  if (user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

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
  loading: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    justifyContent: "center",
    alignItems: "center",
  },
  screen: {
    backgroundColor: COLORS.bgDark,
  },
});
