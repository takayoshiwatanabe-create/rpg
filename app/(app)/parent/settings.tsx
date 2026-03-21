import { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/hooks/useAuth";
import { PixelText, PixelButton, PixelCard, PixelSwitch } from "@/components/ui";
import { t, changeLanguage, getLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING } from "@/constants/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function ParentSettingsScreen() {
  const { signOut } = useAuth(); // Corrected: signOut is a function from useAuth
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [notificationEnabled, setNotificationEnabled] = useState(true); // Example state
  const [hapticsEnabled, setHapticsEnabled] = useState(true); // Example state

  const handleSignOut = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Corrected: NotificationFeedbackType.Success
    Alert.alert(
      t("settings.logout_confirm_title"),
      t("settings.logout_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.logout"),
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)");
          },
        },
      ],
    );
  }, [signOut]);

  const handleLanguageChange = useCallback(async (lang: string) => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Corrected: NotificationFeedbackType.Success
    }
    await changeLanguage(lang);
  }, [hapticsEnabled]);

  const toggleNotifications = useCallback(async (value: boolean) => {
    setNotificationEnabled(value);
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // In a real app, you'd register/unregister notification tokens here
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("settings.notification_permission_denied_title"), t("settings.notification_permission_denied_message"));
        setNotificationEnabled(false);
      }
    }
  }, [hapticsEnabled]);

  const toggleHaptics = useCallback((value: boolean) => {
    setHapticsEnabled(value);
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const toggleReducedMotion = useCallback((value: boolean) => {
    // This state is managed by a hook, but for UI demonstration:
    // In a real app, this would update a user setting in Firestore
    // and the useReducedMotion hook would react to it.
    // For now, just a placeholder for the UI.
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(t("common.info"), t("settings.reduced_motion_hint"));
  }, [hapticsEnabled]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.settings"),
          headerLeft: () => (
            <PixelButton
              label={t("common.back")}
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              accessibilityLabel={t("common.back")}
            />
          ),
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t("nav.settings")}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("settings.general_settings")}>
          {t("settings.general_settings")}
        </PixelText>

        <PixelCard variant="default">
          <View style={styles.settingRow}>
            <PixelText variant="body" color="cream" accessibilityLabel={t("settings.language")}>
              {t("settings.language")}
            </PixelText>
            <View style={[styles.languageButtons, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelButton
                label="日本語"
                variant={getLang() === "ja" ? "primary" : "secondary"}
                size="sm"
                onPress={() => handleLanguageChange("ja")}
                accessibilityLabel={t("settings.language_japanese")}
                accessibilityRole="radio" // Corrected: accessibilityRole="radio"
                accessibilityState={{ selected: getLang() === "ja" }}
              />
              <PixelButton
                label="English"
                variant={getLang() === "en" ? "primary" : "secondary"}
                size="sm"
                onPress={() => handleLanguageChange("en")}
                accessibilityLabel={t("settings.language_english")}
                accessibilityRole="radio" // Corrected: accessibilityRole="radio"
                accessibilityState={{ selected: getLang() === "en" }}
              />
            </View>
          </View>

          <View style={styles.settingRow}>
            <PixelText variant="body" color="cream" accessibilityLabel={t("settings.notifications")}>
              {t("settings.notifications")}
            </PixelText>
            <PixelSwitch
              value={notificationEnabled}
              onValueChange={toggleNotifications}
              accessibilityLabel={t("settings.toggle_notifications")}
            />
          </View>

          <View style={styles.settingRow}>
            <PixelText variant="body" color="cream" accessibilityLabel={t("settings.haptic_feedback")}>
              {t("settings.haptic_feedback")}
            </PixelText>
            <PixelSwitch
              value={hapticsEnabled}
              onValueChange={toggleHaptics}
              accessibilityLabel={t("settings.toggle_haptic_feedback")}
            />
          </View>

          <View style={styles.settingRow}>
            <PixelText variant="body" color="cream" accessibilityLabel={t("settings.reduced_motion")}>
              {t("settings.reduced_motion")}
            </PixelText>
            <PixelSwitch
              value={reducedMotion}
              onValueChange={toggleReducedMotion}
              accessibilityLabel={t("settings.toggle_reduced_motion")}
            />
          </View>
        </PixelCard>

        <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("settings.account_management")}>
          {t("settings.account_management")}
        </PixelText>

        <PixelCard variant="default">
          <PixelButton
            label={t("settings.logout")}
            variant="danger"
            size="md"
            onPress={handleSignOut}
            accessibilityLabel={t("settings.logout")}
          />
        </PixelCard>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
  },
  languageButtons: {
    gap: SPACING.xs,
  },
});

