import { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, Stack } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebase";
import { updateUserProfile } from "@/lib/firestore";
import { PixelText, PixelButton, PixelCard } from "@/components/ui";
import { t, getLang, setLang, getIsRTL, SUPPORTED_LANGUAGES } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER, FONT_SIZES } from "@/constants/theme";
import type { Locale } from "@/types";

type LanguageOptionProps = {
  locale: Locale;
  label: string;
  currentLocale: Locale;
  onSelect: (locale: Locale) => void;
  isRTL: boolean;
};

function LanguageOption({
  locale,
  label,
  currentLocale,
  onSelect,
  isRTL,
}: LanguageOptionProps) {
  const isActive = locale === currentLocale;
  return (
    <PixelButton
      label={label}
      variant={isActive ? "primary" : "secondary"}
      size="md"
      onPress={() => onSelect(locale)}
      style={isActive ? { ...languageOptionStyles.button, ...languageOptionStyles.activeButton } : languageOptionStyles.button}
      accessibilityRole="radio"
      accessibilityState={{ checked: isActive }}
    />
  );
}

const languageOptionStyles = StyleSheet.create({
  button: {
    flex: 1,
  },
  activeButton: {
    borderColor: COLORS.gold,
  },
  rtlText: {
    textAlign: "right",
  },
});

export default function ParentSettingsScreen() {
  const { user, userProfile, isLoading } = useAuth();
  const isRTL = getIsRTL();
  const currentLocale = getLang();

  const [isSaving, setIsSaving] = useState(false);

  const isParent = userProfile?.role === "parent";

  useEffect(() => {
    if (!isLoading && !isParent) {
      // Redirect if not a parent or not authenticated
      router.replace("/(app)/camp");
    }
  }, [isLoading, isParent]);

  const handleLanguageChange = useCallback(
    async (newLocale: Locale) => {
      if (!user || isSaving) return;

      setIsSaving(true);
      try {
        await updateUserProfile(user.uid, { locale: newLocale });
        setLang(newLocale); // Update i18n instance immediately
        Alert.alert(t("common.success"), t("settings.language_updated"));
      } catch (error) {
        console.error("Failed to update language:", error);
        Alert.alert(t("common.error"), t("error.unknown"));
      } finally {
        setIsSaving(false);
      }
    },
    [user, isSaving],
  );

  const handleLogout = useCallback(async () => {
    Alert.alert(
      t("settings.logout"),
      t("settings.logout_confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.logout"),
          style: "destructive",
          onPress: async () => {
            try {
              await signOutUser();
              router.replace("/(auth)/login"); // Redirect to login after logout
            } catch (error) {
              console.error("Failed to log out:", error);
              Alert.alert(t("common.error"), t("error.unknown"));
            }
          },
        },
      ],
    );
  }, []);

  if (isLoading || !isParent) {
    return (
      <View style={styles.center} testID="activity-indicator">
        <ActivityIndicator color={COLORS.gold} size="large" />
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
          {t("settings.general_settings")}
        </PixelText>

        {/* Language Selection */}
        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.settingLabel}>
            {t("settings.language")}
          </PixelText>
          <View style={styles.languageOptions}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <LanguageOption
                key={lang.locale}
                locale={lang.locale}
                label={lang.label}
                currentLocale={currentLocale}
                onSelect={handleLanguageChange}
                isRTL={isRTL}
              />
            ))}
          </View>
          {isSaving && (
            <PixelText variant="caption" color="gray" style={styles.savingText}>
              {t("common.saving")}...
            </PixelText>
          )}
        </PixelCard>

        {/* Account Actions */}
        <PixelText variant="heading" color="gold" style={styles.sectionTitle}>
          {t("settings.account_actions")}
        </PixelText>
        <PixelCard variant="default">
          <PixelButton
            label={t("settings.logout")}
            variant="danger"
            size="lg"
            onPress={handleLogout}
            style={styles.actionButton}
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
  },
  savingText: {
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  actionButton: {
    width: "100%",
  },
});
