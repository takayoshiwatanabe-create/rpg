import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { PixelText, PixelButton, PixelInput } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const DQ_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!email || !password) {
      Alert.alert(t("common.error"), t("login.error.empty_fields"));
      return;
    }

    try {
      await signIn(email, password);
      // Auth hook handles redirection after successful login
    } catch (error: any) {
      console.error("Login failed:", error);
      Alert.alert(t("common.error"), error.message || t("login.error.failed"));
    }
  }, [email, password, signIn]);

  const handleGoToRegister = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/register");
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" accessibilityLabel={t("common.loading")} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + SPACING.md,
          paddingBottom: insets.bottom + SPACING.xxl,
          direction: isRTL ? "rtl" : "ltr",
        },
      ]}
      accessibilityLabel={t("login.accessibility.login_screen")}
    >
      <PixelText variant="heading" color="gold" style={styles.title} accessibilityLabel={t("login.title")}>
        {t("login.title")}
      </PixelText>

      <View style={styles.formContainer}>
        <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("login.email_label")}>
          {t("login.email_label")}
        </PixelText>
        <PixelInput
          value={email}
          onChangeText={setEmail}
          placeholder={t("login.email_placeholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel={t("login.email_label")}
        />

        <PixelText variant="label" color="cream" style={styles.inputLabel} accessibilityLabel={t("login.password_label")}>
          {t("login.password_label")}
        </PixelText>
        <PixelInput
          value={password}
          onChangeText={setPassword}
          placeholder={t("login.password_placeholder")}
          secureTextEntry
          accessibilityLabel={t("login.password_label")}
        />

        <PixelButton
          label={t("login.login_button")}
          variant="primary"
          size="lg"
          onPress={handleLogin}
          style={styles.loginButton}
          accessibilityLabel={t("login.login_button")}
        />

        <PixelButton
          label={t("login.register_prompt")}
          variant="secondary"
          size="md"
          onPress={handleGoToRegister}
          style={styles.registerButton}
          accessibilityLabel={t("login.register_prompt")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
  },
  title: {
    marginBottom: SPACING.xxl,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },
  inputLabel: {
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  loginButton: {
    marginTop: SPACING.xxl,
  },
  registerButton: {
    marginTop: SPACING.md,
  },
});

