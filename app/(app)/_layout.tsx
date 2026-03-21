import { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, I18nManager } from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { getIsRTL } from "../../src/i18n/i18n"; // Corrected import path
import { COLORS } from "../../src/constants/theme";

const DQ_BG = COLORS.bgPrimary; // Corrected property name

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const isRTL = getIsRTL();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/(auth)");
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // On web, we might need to re-render the whole app or refresh
      // For native, I18nManager.forceRTL usually takes effect on next layout pass
      // For Expo Go, a full app reload might be needed for I18nManager changes to fully apply.
      // For bare workflow, it's more consistent.
    }
  }, [isRTL]);

  if (isLoading || !user) {
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
          animation: isRTL ? "slide_from_left" : "slide_from_right",
        }}
      >
        <Stack.Screen name="camp" />
        <Stack.Screen name="quests/index" options={{ headerShown: false }} />
        <Stack.Screen name="quests/new" options={{ headerShown: false }} />
        <Stack.Screen name="battle/[questId]" options={{ headerShown: false }} />
        <Stack.Screen name="battle/result" options={{ headerShown: false }} />
        <Stack.Screen name="records" options={{ headerShown: false }} />
        <Stack.Screen name="parent/index" options={{ headerShown: false }} />
        <Stack.Screen name="parent/settings" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
  },
  loading: {
    flex: 1,
    backgroundColor: DQ_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  screen: {
    backgroundColor: DQ_BG,
  },
});

