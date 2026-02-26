import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  I18nManager,
} from "react-native";
import { router } from "expo-router";
import { t, getIsRTL } from "@/i18n";
import { signInWithEmail } from "@/src/lib/firebase";
import { PixelButton, PixelCard, PixelText } from "@/src/components/ui";
import { COLORS, FONT_SIZES, PIXEL_BORDER, SPACING } from "@/constants/theme";
import type { AccountRole } from "@/types";

export default function LoginScreen() {
  const isRTL = getIsRTL();

  const [role, setRole] = useState<AccountRole>("child");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError(t("error.required_field"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t("error.invalid_email"));
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // onAuthStateChange in useAuth will pick up the new user and the
      // (auth) layout will redirect to /(app) automatically.
    } catch {
      setError(t("auth.login_error"));
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
              onPress={() => setRole("child")}
              isRTL={isRTL}
            />
            <RoleTab
              label={t("auth.parent_account")}
              active={role === "parent"}
              onPress={() => setRole("parent")}
              isRTL={isRTL}
            />
          </View>

          {/* ── Form fields ── */}
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              placeholder={t("auth.password_placeholder")} // Added placeholder
              placeholderTextColor={COLORS.grayDark}
              accessibilityLabel={t("auth.password")}
            />
          </View>

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
              label={isLoading ? t("common.loading") : t("auth.login")}
              variant="primary"
              size="lg"
              disabled={isLoading}
              onPress={handleLogin}
              accessibilityLabel={t("auth.login")}
            />
          </View>

          {/* ── Forgot password ── */}
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push("/(auth)/forgot-password")}
            accessibilityRole="link"
          >
            <PixelText variant="caption" color="gray" style={styles.linkText}>
              {t("auth.forgot_password")}
            </PixelText>
          </Pressable>
        </PixelCard>

        {/* ── Navigate to register ── */}
        <Pressable
          style={styles.bottomLink}
          onPress={() => router.replace("/(auth)/register")}
          accessibilityRole="link"
        >
          <PixelText variant="caption" color="cream" style={styles.linkText}>
            {t("auth.no_account")}
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
        style={[styles.roleTabText, isRTL && styles.rtlText]}
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
  roleTabText: {
    letterSpacing: 0.5,
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
  errorBox: {
    backgroundColor: "#3A0000",
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.hp,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  linkRow: {
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  linkText: {
    textDecorationLine: "underline",
    textAlign: "center",
  },
  bottomLink: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
});

