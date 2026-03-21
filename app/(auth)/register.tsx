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
import { signUp } from "@/lib/auth";
import { createUserProfile } from "@/lib/firestore";
import { PixelText, PixelInput, PixelButton, PixelPicker } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import { FIREBASE_AUTH_ERRORS } from "@/constants/firebaseErrors";
import * as Haptics from "expo-haptics";
import type { UserRole } from "@/types";

const AUTH_BG = require("@/assets/auth_bg.png");

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const isRTL = getIsRTL();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("child");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = useCallback(async () => {
    if (!email || !password || !confirmPassword || !role) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), t("quest.new.error.fields_required"));
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), t("auth.register.error.password_mismatch"));
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const userCredential = await signUp(email, password);
      if (userCredential.user) {
        await createUserProfile(userCredential.user.uid, email, role);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t("auth.register.success.title"), t("auth.register.success.message"));
        router.replace("/(app)");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage =
        FIREBASE_AUTH_ERRORS[error.code as keyof typeof FIREBASE_AUTH_ERRORS] ||
        t("auth.register.error.generic");
      Alert.alert(t("common.error"), errorMessage);
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, confirmPassword, role]);

  const handleLoginPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/login");
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
          accessibilityLabel={t("auth.register.title")}
        >
          <View style={styles.card}>
            <PixelText variant="heading" color="gold" style={styles.title} accessibilityLabel={t("auth.register.title")}>
              {t("auth.register.title")}
            </PixelText>

            <PixelInput
              label={t("auth.register.email")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t("auth.register.email")}
              editable={!isLoading}
              accessibilityLabel={t("auth.register.email")}
              style={styles.input}
            />
            <PixelInput
              label={t("auth.register.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t("auth.register.password")}
              editable={!isLoading}
              accessibilityLabel={t("auth.register.password")}
              style={styles.input}
            />
            <PixelInput
              label={t("auth.register.confirm_password")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder={t("auth.register.confirm_password")}
              editable={!isLoading}
              accessibilityLabel={t("auth.register.confirm_password")}
              style={styles.input}
            />

            <PixelPicker
              label={t("auth.register.role")}
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue as UserRole)}
              items={[
                { label: t("auth.register.role.child"), value: "child" },
                { label: t("auth.register.role.parent"), value: "parent" },
              ]}
              enabled={!isLoading}
              accessibilityLabel={t("auth.register.role")}
              style={styles.input}
            />

            <PixelButton
              label={t("auth.register.button")}
              onPress={handleRegister}
              isLoading={isLoading}
              variant="primary"
              size="lg"
              style={styles.button}
              accessibilityLabel={t("auth.register.button")}
              accessibilityRole="button"
              accessibilityState={{ busy: isLoading }}
            />

            <View style={[styles.loginPrompt, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="body" color="cream" accessibilityLabel={t("auth.register.has_account")}>
                {t("auth.register.has_account")}
              </PixelText>
              <PixelButton
                label={t("auth.register.login_now")}
                onPress={handleLoginPress}
                variant="ghost"
                size="sm"
                style={styles.loginButton}
                accessibilityLabel={t("auth.register.login_now")}
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
  loginPrompt: {
    marginTop: SPACING.lg,
    alignItems: "center",
    gap: SPACING.xs,
  },
  loginButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

