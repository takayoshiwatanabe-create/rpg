import { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { signIn } from "@/lib/auth";
import { PixelText, PixelInput, PixelButton } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import { FIREBASE_AUTH_ERRORS } from "@/constants/firebaseErrors";
import * as Haptics from "expo-haptics";

const AUTH_BG = require("@/assets/auth_bg.png");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const isRTL = getIsRTL();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), t("auth.login.error.invalid_credentials"));
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await signIn(email, password);
      router.replace("/(app)");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage =
        FIREBASE_AUTH_ERRORS[error.code as keyof typeof FIREBASE_AUTH_ERRORS] ||
        t("auth.login.error.generic");
      Alert.alert(t("common.error"), errorMessage);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  const handleRegisterPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/register");
  }, []);

  return (
    <ImageBackground source={AUTH_BG} style={styles.background}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl, direction: isRTL ? "rtl" : "ltr" },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          accessibilityLabel={t("auth.login.title")}
        >
          <View style={styles.card}>
            <PixelText variant="heading" color="gold" style={styles.title} accessibilityLabel={t("auth.login.title")}>
              {t("auth.login.title")}
            </PixelText>

            <PixelInput
              label={t("auth.login.email")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t("auth.login.email")}
              editable={!isLoading}
              accessibilityLabel={t("auth.login.email")}
              style={styles.input}
            />
            <PixelInput
              label={t("auth.login.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t("auth.login.password")}
              editable={!isLoading}
              accessibilityLabel={t("auth.login.password")}
              style={styles.input}
            />

            <PixelButton
              label={t("auth.login.button")}
              onPress={handleLogin}
              isLoading={isLoading}
              variant="primary"
              size="lg"
              style={styles.button}
              accessibilityLabel={t("auth.login.button")}
              accessibilityRole="button"
              accessibilityState={{ busy: isLoading }}
            />

            <View style={[styles.registerPrompt, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="body" color="cream" accessibilityLabel={t("auth.login.no_account")}>
                {t("auth.login.no_account")}
              </PixelText>
              <PixelButton
                label={t("auth.login.register_now")}
                onPress={handleRegisterPress}
                variant="ghost"
                size="sm"
                style={styles.registerButton}
                accessibilityLabel={t("auth.login.register_now")}
                accessibilityRole="link"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.cardBg,
    borderRadius: PIXEL_BORDER.borderRadius,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 8,
  },
  title: {
    marginBottom: SPACING.xl,
    textAlign: "center",
  },
  input: {
    marginBottom: SPACING.md,
    width: "100%",
  },
  button: {
    marginTop: SPACING.md,
    width: "100%",
  },
  registerPrompt: {
    marginTop: SPACING.lg,
    alignItems: "center",
    gap: SPACING.xs,
  },
  registerButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

