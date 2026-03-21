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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  updateUserProfile,
  updateHeroProfile,
  subscribeToHero,
} from "@/lib/firestore";
import {
  PixelText,
  PixelButton,
  PixelCard,
  DQMessageBox,
  DQTextInput,
  DQPicker,
} from "@/components/ui";
import { t, getLang, setLang, getIsRTL } from "@/i18n";
import { COLORS, SPACING } from "@/constants/theme";
import type { UserProfile, HeroProfile } from "@/types";
import * as Haptics from "expo-haptics";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

const SUPPORTED_LANGUAGES = [
  { label: "日本語", value: "ja" },
  { label: "English", value: "en" },
  { label: "中文", value: "zh" },
  { label: "한국어", value: "ko" },
  { label: "Español", value: "es" },
  { label: "Français", value: "fr" },
  { label: "Deutsch", value: "de" },
  { label: "Português", value: "pt" },
  { label: "العربية", value: "ar" },
  { label: "हिन्दी", value: "hi" },
];

export default function ParentSettingsScreen() {
  const { user, userProfile, isLoading: authLoading, signOut } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(getLang());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isParent = userProfile?.role === "parent";

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isParent) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const childId = user.uid; // Assuming child's heroId is same as parent's uid for simplicity

    const unsubHero = subscribeToHero(user.uid, childId, (h: HeroProfile | null) => {
      if (h) {
        setHero(h);
        setDisplayName(h.displayName);
      } else {
        setError(t("error.hero_not_found"));
      }
      setDataLoading(false);
    });

    setSelectedLanguage(getLang()); // Ensure language is up-to-date

    return () => {
      unsubHero();
    };
  }, [user, isParent, authLoading]);

  const handleSaveSettings = useCallback(async () => {
    if (!user || !hero || isSaving) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    setError(null);

    try {
      // Update hero display name
      if (displayName !== hero.displayName) {
        await updateHeroProfile(user.uid, hero.id, { displayName });
      }

      // Update user profile language setting
      if (selectedLanguage !== getLang()) {
        await updateUserProfile(user.uid, { language: selectedLanguage });
        setLang(selectedLanguage); // Update i18n instance immediately
        Alert.alert(t("common.success"), t("settings.language_updated_restart"));
      } else {
        Alert.alert(t("common.success"), t("settings.saved_successfully"));
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(t("error.unknown"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [user, hero, displayName, selectedLanguage, isSaving]);

  const handleSignOut = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      t("settings.sign_out_confirm_title"),
      t("settings.sign_out_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.sign_out"),
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await signOut();
            router.replace("/(auth)");
          },
        },
      ],
    );
  }, [signOut]);

  if (authLoading || dataLoading) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  if (!isParent) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={t("parent.access_denied")} />
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
          title: t("nav.settings"),
          headerShown: false, // Custom header for DQ style
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
        <DQMessageBox text={t("settings.welcome_message")} />

        {error && (
          <DQMessageBox text={error} variant="danger" />
        )}

        {/* Hero Settings */}
        <PixelCard variant="default" style={styles.sectionCard}>
          <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("settings.hero_settings")}>
            {t("settings.hero_settings")}
          </PixelText>
          <PixelText variant="label" color="cream" style={styles.label} accessibilityLabel={t("settings.hero_name_label")}>
            {t("settings.hero_name_label")}
          </PixelText>
          <DQTextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t("settings.hero_name_placeholder")}
            maxLength={20}
            style={styles.input}
            accessibilityLabel={t("settings.hero_name_label")}
          />
        </PixelCard>

        {/* Language Settings */}
        <PixelCard variant="default" style={styles.sectionCard}>
          <PixelText variant="heading" color="gold" style={styles.sectionTitle} accessibilityLabel={t("settings.language_settings")}>
            {t("settings.language_settings")}
          </PixelText>
          <PixelText variant="label" color="cream" style={styles.label} accessibilityLabel={t("settings.app_language_label")}>
            {t("settings.app_language_label")}
          </PixelText>
          <DQPicker
            selectedValue={selectedLanguage}
            onValueChange={(itemValue) => setSelectedLanguage(itemValue as string)}
            items={SUPPORTED_LANGUAGES}
            accessibilityLabel={t("settings.app_language_label")}
          />
        </PixelCard>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <PixelButton
            label={t("common.save")}
            variant="primary"
            onPress={handleSaveSettings}
            disabled={isSaving}
            accessibilityLabel={t("common.save")}
          />
          <PixelButton
            label={t("settings.sign_out")}
            variant="danger"
            onPress={handleSignOut}
            accessibilityLabel={t("settings.sign_out")}
          />
          <PixelButton
            label={t("common.back")}
            variant="secondary"
            onPress={() => router.back()}
            accessibilityLabel={t("common.back")}
          />
        </View>
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
  sectionCard: {
    padding: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  label: {
    marginBottom: SPACING.xs,
  },
  input: {
    marginBottom: SPACING.md,
  },
  buttonGroup: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
});
