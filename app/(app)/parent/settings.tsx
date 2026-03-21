import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile, signOutUser } from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard, DQPicker } from "@/components/ui";
import { t, getIsRTL, changeLanguage, SUPPORTED_LANGUAGES, LanguageCode } from "@/i18n";
import { COLORS, SPACING } from "@/constants/theme";

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function ParentSettingsScreen() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("ja");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.language) {
      setCurrentLanguage(userProfile.language as LanguageCode);
    }
  }, [userProfile]);

  const handleLanguageChange = useCallback(async (lang: LanguageCode) => {
    if (!user || !userProfile) return;

    setCurrentLanguage(lang);
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { language: lang });
      await changeLanguage(lang);
      Alert.alert(t("common.success"), t("settings.language_saved"));
    } catch (error) {
      console.error("Failed to update language:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
    } finally {
      setIsSaving(false);
    }
  }, [user, userProfile]);

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      t("settings.sign_out_confirm_title"),
      t("settings.sign_out_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.sign_out"),
          style: "destructive",
          onPress: async () => {
            try {
              await signOutUser();
              router.replace("/(auth)");
            } catch (error) {
              console.error("Failed to sign out:", error);
              Alert.alert(t("common.error"), t("error.unknown"));
            }
          },
        },
      ],
    );
  }, []);

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  if (!user || userProfile?.role !== "parent") {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <PixelText variant="body" color="danger" accessibilityLabel={t("parent.access_denied")}>
          {t("parent.access_denied")}
        </PixelText>
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel={t("common.back")}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.parent_settings"),
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { direction: isRTL ? "rtl" : "ltr", paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={t("nav.parent_settings")}
      >
        <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("settings.general")}>
          {t("settings.general")}
        </PixelText>

        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.settingLabel} accessibilityLabel={t("settings.language")}>
            {t("settings.language")}
          </PixelText>
          <DQPicker
            selectedValue={currentLanguage}
            onValueChange={(itemValue: LanguageCode) => handleLanguageChange(itemValue)}
            items={SUPPORTED_LANGUAGES.map((lang) => ({
              label: t(`language.${lang}`),
              value: lang,
            }))}
            accessibilityLabel={t("settings.select_language")}
            enabled={!isSaving}
          />
          {isSaving && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator color={COLORS.gold} size="small" />
              <PixelText variant="caption" color="gray" accessibilityLabel={t("common.saving")}>
                {t("common.saving")}...
              </PixelText>
            </View>
          )}
        </PixelCard>

        <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("settings.account")}>
          {t("settings.account")}
        </PixelText>

        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.settingLabel} accessibilityLabel={t("settings.email")}>
            {t("settings.email")}:
          </PixelText>
          <PixelText variant="body" color="white" style={styles.settingValue} accessibilityLabel={user.email || t("common.not_set")}>
            {user.email || t("common.not_set")}
          </PixelText>

          <PixelButton
            label={t("settings.sign_out")}
            variant="danger"
            size="md"
            onPress={handleSignOut}
            style={styles.signOutButton}
            accessibilityLabel={t("settings.sign_out")}
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
    marginBottom: SPACING.xs,
  },
  settingValue: {
    marginBottom: SPACING.md,
    fontFamily: FONT_FAMILY,
  },
  signOutButton: {
    marginTop: SPACING.md,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
});

