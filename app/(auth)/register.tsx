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

const REGISTER_BG = require("@/assets/register_bg.png");
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const isRTL = getIsRTL();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"child" | "parent">("child");

  const handleRegister = useCallback(async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert(t("common.error"), t("auth.error.all_fields_required"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.error.passwords_not_match"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password.length < 6) {
      Alert.alert(t("common.error"), t("auth.error.password_too_short"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);

    try {
      await register(email, password, displayName, role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t("common.success"), t("auth.register_success"));
      router.replace("/(app)");
    } catch (error: any) {
      console.error("Registration failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("common.error"), error.message || t("auth.error.register_failed"));
    }
  }, [email, password, confirmPassword, displayName, role, register]);

  const handleGoBack = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    router.back();
  }, []);

  return (
    <ImageBackground source={REGISTER_BG} style={styles.background}>
      <View style={[styles.overlay, { direction: isRTL ? "rtl" : "ltr" }]}>
        <PixelCard variant="default" style={styles.registerCard}>
          <PixelText variant="heading" color="gold" style={styles.title}>
            {t("auth.register_title")}
          </PixelText>

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("auth.display_name")}
          </PixelText>
          <PixelInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t("auth.placeholder.display_name")}
            autoCapitalize="words"
            style={styles.input}
          />

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

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("auth.confirm_password")}
          </PixelText>
          <PixelInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t("auth.placeholder.confirm_password")}
            secureTextEntry
            style={styles.input}
          />

          <PixelText variant="label" color="cream" style={styles.inputLabel}>
            {t("auth.account_type")}
          </PixelText>
          <View style={styles.roleToggle}>
            <PixelButton
              label={t("auth.role_child")}
              variant={role === "child" ? "primary" : "secondary"}
              onPress={() => setRole("child")}
              style={styles.roleButton}
            />
            <PixelButton
              label={t("auth.role_parent")}
              variant={role === "parent" ? "primary" : "secondary"}
              onPress={() => setRole("parent")}
              style={styles.roleButton}
            />
          </View>

          <PixelButton
            label={isLoading ? t("common.loading") : t("auth.register")}
            variant="primary"
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.registerButton}
          />

          <PixelButton
            label={t("auth.back_to_login")}
            variant="secondary"
            onPress={handleGoBack}
            disabled={isLoading}
            style={styles.backButton}
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
  registerCard: {
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
  roleToggle: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  roleButton: {
    flex: 1,
  },
  registerButton: {
    marginTop: SPACING.lg,
  },
  backButton: {
    marginTop: SPACING.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
});

