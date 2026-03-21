import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { PixelText, PixelButton, PixelCard, DQMessageBox } from "@/components/ui";
import { t, getLang, setLang, getIsRTL, LANGUAGES, Locale } from "@/i18n";
import { COLORS, SPACING } from "@/constants/theme";
import { useSettings } from "@/hooks/useSettings"; // Corrected import
import * as Haptics from "expo-haptics";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function ParentSettingsScreen() {
  const { user, userProfile, isLoading: authLoading, signOut } = useAuth(); // Corrected signOut usage
  const isRTL = getIsRTL();
  const { settings, updateSetting, isLoading: settingsLoading } = useSettings();

  const [currentLanguage, setCurrentLanguage] = useState<Locale>(getLang());

  useEffect(() => {
    if (settings?.language && settings.language !== currentLanguage) {
      setCurrentLanguage(settings.language);
    }
  }, [settings?.language, currentLanguage]);

  const handleLanguageChange = useCallback(async (lang: Locale) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    setCurrentLanguage(lang);
    await setLang(lang);
    await updateSetting("language", lang);
  }, [updateSetting]);

  const handleSignOut = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t("settings.sign_out_confirm_title"),
      t("settings.sign_out_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.sign_out"),
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)");
          },
        },
      ],
    );
  }, [signOut]);

  const handleManageSubscription = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    Alert.alert(
      t("common.info"),
      t("parent.manage_subscription_hint"),
    );
  }, []);

  if (authLoading || settingsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  if (userProfile?.role !== "parent") {
    return (
      <View style={styles.center}>
        <DQMessageBox text={t("parent.access_denied")} />
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
      <Stack.Screen
        options={{
          title: t("nav.settings"),
          headerLeft: () => (
            <PixelButton
              label={t("common.back")}
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
            />
          ),
        }}
      />
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
          <PixelText variant="body" color="cream" style={styles.settingLabel}>
            {t("settings.language")}
          </PixelText>
          <View style={styles.languageGrid}>
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <PixelButton
                key={code}
                label={name}
                variant={currentLanguage === code ? "primary" : "secondary"}
                size="sm"
                onPress={() => handleLanguageChange(code as Locale)}
                style={styles.languageButton}
                accessibilityRole="radio"
                accessibilityState={{ checked: currentLanguage === code }}
              />
            ))}
          </View>
        </PixelCard>

        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("parent.subscription_status")}
        </PixelText>
        <PixelCard variant="default">
          <PixelText variant="body" color="cream">
            {t("parent.subscription_info")}
          </PixelText>
          <PixelText variant="caption" color="gray" style={styles.subInfo}>
            {t("parent.subscription_details")}
          </PixelText>
          <PixelButton
            label={t("parent.manage_subscription")}
            variant="secondary"
            size="md"
            onPress={handleManageSubscription}
            style={styles.manageSubButton}
          />
        </PixelCard>

        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("settings.account")}
        </PixelText>
        <PixelCard variant="default">
          <PixelButton
            label={t("settings.sign_out")}
            variant="danger"
            onPress={handleSignOut}
          />
        </PixelCard>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
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
    backgroundColor: DQ_BG,
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
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    justifyContent: "center",
  },
  languageButton: {
    flexBasis: "30%", // Roughly 3 items per row, adjust as needed
    minWidth: 80,
  },
  subInfo: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  manageSubButton: {
    marginTop: SPACING.sm,
  },
});

