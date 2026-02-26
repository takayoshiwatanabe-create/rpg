import { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, I18nManager } from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { getIsRTL } from "@/i18n";
import { COLORS, PIXEL_BORDER } from "@/constants/theme";

/**
 * Layout for the authenticated route group: dashboard, quests, battle, etc.
 *
 * Behaviour:
 * - Shows a pixel-themed loading indicator while auth state resolves.
 * - Redirects unauthenticated users to /(auth).
 * - Authenticated users see the Stack of app screens.
 * - Writing direction switches to RTL when Arabic is active.
 * - Stack header uses the retro pixel art palette.
 */
export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const isRTL = getIsRTL();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/(auth)");
    }
  }, [user, isLoading]);

  // Apply RTL layout if necessary. This is a fallback/double-check,
  // as the root layout already tries to set it.
  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // On native, forceRTL requires a reload to take full effect.
      // For simplicity in this demo, we'll let the user experience it on next app launch.
      // In a real app, you might prompt the user to restart or handle it more gracefully.
    }
  }, [isRTL]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  // Block render until redirect completes.
  if (!user) return null;

  return (
    <View style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }]}>
      <Stack
        screenOptions={{
          headerStyle: styles.header,
          headerTintColor: COLORS.cream,
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
          contentStyle: styles.screen,
          animation: isRTL ? "slide_from_left" : "slide_from_right",
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
  header: {
    backgroundColor: COLORS.bgMid,
    borderBottomWidth: PIXEL_BORDER.borderWidth,
    borderBottomColor: PIXEL_BORDER.borderColor,
  },
  headerTitle: {
    fontFamily: "monospace",
    color: COLORS.cream,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  screen: {
    backgroundColor: COLORS.bgDark,
  },
});
