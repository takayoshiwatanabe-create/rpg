import { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, I18nManager } from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getIsRTL } from "@/i18n";

const DQ_BLUE = "#0000AA";
const DQ_BG = "#000011";

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
    }
  }, [isRTL]);

  if (isLoading || !user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FFD700" size="large" />
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

