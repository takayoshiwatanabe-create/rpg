import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, updateUserSettings } from "@/hooks/useSettings";
import { PixelText, PixelButton, PixelCard } from "@/components/ui";
import { t, getLang, setLang, getIsRTL, LANGUAGES } from "@/i18n";
import { COLORS, SPACING } from "@/constants/theme";
import * as Haptics from "expo-haptics";

export default function ParentSettingsScreen() {
  const { user, userProfile, isLoading: authLoading, signOut } = useAuth();
  const { settings, isLoading: settingsLoading } = useSettings();
  const isRTL = getIsRTL();

  const [selectedLanguage, setSelectedLanguage] = useState(getLang());

  useEffect(() => {
    if (settings && settings.language && settings.language !== selectedLanguage) {
      setSelectedLanguage(settings.language);
    }
  }, [settings, selectedLanguage]);

  const handleLanguageChange = useCallback(async (lang: string) => {
    setSelectedLanguage(lang);
    setLang(lang); // Update i18n immediately
    if (user?.uid) {
      await updateUserSettings(user.uid, { language: lang });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [user?.uid]);

  const handleSignOut = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  }, [signOut]);

  if (authLoading || settingsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  if (!user || userProfile?.role !== "parent") {
    return (
      <View style={styles.center}>
        <PixelText variant="body" color="danger">
          {t("parent.access_denied")}
        </PixelText>
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("nav.settings") }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("settings.general")}
        </PixelText>

        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.settingLabel}>
            {t("settings.language")}
          </PixelText>
          <View style={styles.languageOptions}>
            {Object.entries(LANGUAGES).map(([key, value]) => (
              <PixelButton
                key={key}
                label={value.nativeName}
                variant={selectedLanguage === key ? "primary" : "secondary"}
                size="sm"
                onPress={() => handleLanguageChange(key)}
                style={styles.languageButton}
                accessibilityRole="radio" // Changed from "radio"
                accessibilityState={{ selected: selectedLanguage === key }} // Changed from "checked"
              />
            ))}
          </View>
        </PixelCard>

        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("settings.account")}
        </PixelText>

        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.settingLabel}>
            {t("settings.email")}
          </PixelText>
          <PixelText variant="body" color="gray">
            {user.email}
          </PixelText>

          <PixelButton
            label={t("settings.logout")}
            variant="danger"
            onPress={handleSignOut}
            style={styles.logoutButton}
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
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bgDark,
  },
  backButton: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  settingLabel: {
    marginBottom: SPACING.sm,
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  languageButton: {
    minWidth: 80,
  },
  logoutButton: {
    marginTop: SPACING.lg,
  },
});

