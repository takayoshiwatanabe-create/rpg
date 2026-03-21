import { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signInUser } from "@/lib/firebase"; // Corrected import
import { PixelText, PixelButton, PixelInput } from "@/components/ui"; // Corrected import
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function LoginScreen() {
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), t("login.error.empty_fields"));
      return;
    }

    setIsLoading(true);
    try {
      await signInUser(email, password);
      router.replace("/(app)"); // Redirect to app after successful login
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(t("common.error"), t("login.error.failed"));
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + SPACING.md,
          paddingBottom: insets.bottom + SPACING.md,
          direction: isRTL ? "rtl" : "ltr",
        },
      ]}
    >
      <PixelText variant="heading" color="gold" style={styles.title}>
        {t("login.title")}
      </PixelText>

      <View style={styles.form}>
        <PixelInput
          label={t("login.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder={t("login.email_placeholder")}
          editable={!isLoading}
        />
        <PixelInput
          label={t("login.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={t("login.password_placeholder")}
          editable={!isLoading}
        />

        <PixelButton
          label={isLoading ? t("common.loading") : t("login.login_button")}
          onPress={handleLogin}
          variant="primary"
          size="lg"
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading && <ActivityIndicator color={COLORS.white} size="small" />}
        </PixelButton>

        <Link href="/(auth)/register" asChild>
          <PixelButton
            label={t("login.register_link")}
            variant="secondary"
            size="md"
            style={styles.registerButton}
            disabled={isLoading}
          />
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  title: {
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    gap: SPACING.md,
  },
  button: {
    marginTop: SPACING.md,
  },
  registerButton: {
    marginTop: SPACING.sm,
  },
});

