import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { t, getLang, getIsRTL } from "@/i18n";
import { signUpWithEmail } from "@/src/lib/firebase";
import { setUserProfile, setHeroProfile } from "@/src/lib/firestore";
import { createHeroProfile } from "@/src/lib/gameLogic";
import { PixelButton, PixelCard, PixelText } from "@/src/components/ui";
import { COLORS, FONT_SIZES, PIXEL_BORDER, SPACING } from "@/constants/theme";
import type { AccountRole } from "@/types";

export default function RegisterScreen() {
  const isRTL = getIsRTL();

  const [role, setRole] = useState<AccountRole>("child");
  const [heroName, setHeroName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [coppaConsent, setCoppaConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isChildRole = role === "child";

  function validate(): string | null {
    if (!email.trim()) return t("error.required_field");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return t("error.invalid_email");

    if (!password) return t("error.required_field");
    if (password !== confirmPassword) return t("auth.password_mismatch");

    if (isChildRole && !heroName.trim()) return t("error.required_field");

    if (isChildRole && !coppaConsent) return t("auth.coppa_consent_required"); // Changed error message

    return null;
  }

  async function handleRegister() {
    const validationError = validate();
    if (validationError !== null) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const credential = await signUpWithEmail(email.trim(), password);
      const uid = credential.user.uid;
      await setUserProfile(uid, {
        role,
        locale: getLang(),
        createdAt: new Date().toISOString(),
      });
      if (isChildRole) {
        const { id: _heroId, ...heroData } = createHeroProfile(uid, heroName.trim());
        await setHeroProfile(uid, uid, heroData);
      }
      // Auth layout will redirect to /(app) once onAuthStateChange fires.
    } catch {
      setError(t("auth.register_error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { direction: isRTL ? "rtl" : "ltr" },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ── */}
        <View style={styles.header}>
          <PixelText variant="title" color="gold" style={styles.titleText}>
            {t("app.name")}
          </PixelText>
          <PixelText variant="body" color="cream" style={styles.subtitle}>
            {t("auth.welcome")}
          </PixelText>
        </View>

        {/* ── Account type toggle ── */}
        <PixelCard style={styles.card}>
          <PixelText variant="label" color="gray" style={styles.sectionLabel}>
            {t("auth.account_type")}
          </PixelText>
          <View style={styles.toggleRow}>
            <RoleTab
              label={t("auth.child_account")}
              active={role === "child"}
              onPress={() => {
                setRole("child");
                setError(null);
              }}
              isRTL={isRTL}
            />
            <RoleTab
              label={t("auth.parent_account")}
              active={role === "parent"}
              onPress={() => {
                setRole("parent");
                setCoppaConsent(false);
                setError(null);
              }}
              isRTL={isRTL}
            />
          </View>

          {/* ── Hero name (child only) ── */}
          {isChildRole && (
            <View style={styles.fieldGroup}>
              <PixelText
                variant="label"
                color="cream"
                style={styles.fieldLabel}
              >
                {t("auth.hero_name")}
              </PixelText>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
                value={heroName}
                onChangeText={setHeroName}
                placeholder={t("auth.hero_name_placeholder")}
                placeholderTextColor={COLORS.grayDark}
                autoCorrect={false}
                maxLength={20}
                returnKeyType="next"
                accessibilityLabel={t("auth.hero_name")}
              />
            </View>
          )}

          {/* ── Email ── */}
          <View style={styles.fieldGroup}>
            <PixelText variant="label" color="cream" style={styles.fieldLabel}>
              {t("auth.email")}
            </PixelText>
            <TextInput
              style={[
                styles.input,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              placeholder={t("auth.email_placeholder")} // Added placeholder
              placeholderTextColor={COLORS.grayDark}
              accessibilityLabel={t("auth.email")}
            />
          </View>

          {/* ── Password ── */}
          <View style={styles.fieldGroup}>
            <PixelText variant="label" color="cream" style={styles.fieldLabel}>
              {t("auth.password")}
            </PixelText>
            <TextInput
              style={[
                styles.input,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
              placeholder={t("auth.password_placeholder")} // Added placeholder
              placeholderTextColor={COLORS.grayDark}
              accessibilityLabel={t("auth.password")}
            />
          </View>

          {/* ── Confirm password ── */}
          <View style={styles.fieldGroup}>
            <PixelText variant="label" color="cream" style={styles.fieldLabel}>
              {t("auth.confirm_password")}
            </PixelText>
            <TextInput
              style={[
                styles.input,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              placeholder={t("auth.confirm_password_placeholder")} // Added placeholder
              placeholderTextColor={COLORS.grayDark}
              accessibilityLabel={t("auth.confirm_password")}
            />
          </View>

          {/* ── COPPA consent (child accounts only) ── */}
          {isChildRole && (
            <View style={styles.consentSection}>
              <View style={styles.noticeBanner}>
                <PixelText variant="caption" color="gold">
                  {t("auth.coppa_notice")}
                </PixelText>
              </View>

              <Pressable
                style={styles.checkboxRow}
                onPress={() => setCoppaConsent((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: coppaConsent }}
                accessibilityLabel={t("auth.coppa_consent")}
              >
                <View
                  style={[styles.checkbox, coppaConsent && styles.checkboxChecked]}
                >
                  {coppaConsent && (
                    <PixelText variant="label" color="gold">
                      ✓
                    </PixelText>
                  )}
                </View>
                <PixelText
                  variant="caption"
                  color="cream"
                  style={styles.consentText}
                >
                  {t("auth.coppa_consent")}
                </PixelText>
              </Pressable>
            </View>
          )}

          {/* ── Error banner ── */}
          {error !== null && (
            <View style={styles.errorBox}>
              <PixelText variant="caption" color="danger">
                {error}
              </PixelText>
            </View>
          )}

          {/* ── Primary action ── */}
          <View style={styles.buttonRow}>
            <PixelButton
              label={
                isLoading ? t("common.loading") : t("auth.createHero")
              }
              variant="primary"
              size="lg"
              disabled={isLoading}
              onPress={handleRegister}
              accessibilityLabel={t("auth.createHero")}
            />
          </View>
        </PixelCard>

        {/* ── Navigate to login ── */}
        <Pressable
          style={styles.bottomLink}
          onPress={() => router.replace("/(auth)/login")}
          accessibilityRole="link"
        >
          <PixelText variant="caption" color="cream" style={styles.linkText}>
            {t("auth.have_account")}
          </PixelText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Role tab sub-component ──────────────────────────────────────────────────

type RoleTabProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  isRTL: boolean;
};

function RoleTab({ label, active, onPress, isRTL }: RoleTabProps) {
  return (
    <Pressable
      style={[styles.roleTab, active && styles.roleTabActive]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <PixelText
        variant="caption"
        color={active ? "gold" : "gray"}
        style={isRTL ? styles.rtlText : undefined}
      >
        {label}
      </PixelText>
    </Pressable>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  titleText: {
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  card: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    marginBottom: SPACING.xs,
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
  },
  roleTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    backgroundColor: COLORS.bgMid,
  },
  roleTabActive: {
    backgroundColor: COLORS.buttonPrimary,
  },
  rtlText: {
    textAlign: "right",
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    borderRadius: 0,
    color: COLORS.cream,
    fontSize: FONT_SIZES.md,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    letterSpacing: 0.5,
  },
  consentSection: {
    marginBottom: SPACING.md,
  },
  noticeBanner: {
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.goldDark,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    backgroundColor: COLORS.bgMid,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: COLORS.buttonPrimary,
    borderColor: COLORS.gold,
  },
  consentText: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: "#3A0000",
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.hp,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    marginTop: SPACING.sm,
  },
  bottomLink: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  linkText: {
    textDecorationLine: "underline",
    textAlign: "center",
  },
});
