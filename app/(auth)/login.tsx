import { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { PixelText, PixelButton, PixelInput, PixelCard } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const LOGIN_BG = require("@/assets/login_bg.png");
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const isRTL = getIsRTL();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), t("auth.error.email_password_required"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);

    try {
      await signIn(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(app)");
    } catch (error: any) {
      console.error("Login failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), error.message || t("auth.error.login_failed"));
    }
  }, [email, password, signIn]);

  const handleRegister = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    router.push("/(auth)/register");
  }, []);

  return (
    <ImageBackground source={LOGIN_BG} style={styles.background}>
      <View style={[styles.overlay, { direction: isRTL ? "rtl" : "ltr" }]}>
        <PixelCard variant="default" style={styles.loginCard}>
          <PixelText variant="heading" color="gold" style={styles.title}>
            {t("auth.login_title")}
          </PixelText>

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("auth.email")}
          </PixelText>
          <PixelInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.placeholder.email")}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("auth.password")}
          </PixelText>
          <PixelInput
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.placeholder.password")}
            secureTextEntry
            style={styles.input}
          />

          <PixelButton
            label={isLoading ? t("common.loading") : t("auth.login")}
            variant="primary"
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
          />

          <PixelButton
            label={t("auth.register_prompt")}
            variant="secondary"
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.registerButton}
          />
        </PixelCard>
      </View>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  loginCard: {
    width: "90%",
    maxWidth: 400,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  inputLabel: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.darkGray,
    color: COLORS.cream,
    padding: SPACING.sm,
    borderRadius: 4,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.body,
  },
  loginButton: {
    marginTop: SPACING.lg,
  },
  registerButton: {
    marginTop: SPACING.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
});

