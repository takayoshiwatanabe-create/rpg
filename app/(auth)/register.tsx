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
import {
  registerUserWithEmail, // Corrected import
  createHeroProfile, // Corrected import
  createUserProfile, // Corrected import
} from "@/lib/firebase";
import { PixelText, PixelButton, PixelInput } from "@/components/ui"; // Corrected import
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import { UserRole } from "@/types"; // Corrected import

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function RegisterScreen() {
  const isRTL = getIsRTL();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("child");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = useCallback(async () => {
    if (!email || !password || !displayName) {
      Alert.alert(t("common.error"), t("register.error.empty_fields"));
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await registerUserWithEmail(email, password);
      const uid = userCredential.user.uid;

      await createUserProfile(uid, {
        email,
        role,
        displayName,
        createdAt: new Date().toISOString(),
      });

      if (role === "child") {
        await createHeroProfile(uid, {
          userId: uid,
          displayName,
          level: 1,
          currentExp: 0,
          totalExp: 0,
          gold: 0,
          hp: 100,
          maxHp: 100,
          mp: 0, // Added MP for consistency with CampScreen
          maxMp: 0, // Added Max MP
          attack: 10,
          defense: 5,
          skills: [],
          inventory: [],
          createdAt: new Date().toISOString(),
        });
      }

      Alert.alert(t("common.success"), t("register.success"));
      router.replace("/(app)"); // Redirect to app after successful registration
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert(t("common.error"), t("register.error.failed"));
    } finally {
      setIsLoading(false);
    }
  }, [email, password, displayName, role]);

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
        {t("register.title")}
      </PixelText>

      <View style={styles.form}>
        <PixelInput
          label={t("register.display_name")}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          placeholder={t("register.display_name_placeholder")}
          editable={!isLoading}
        />
        <PixelInput
          label={t("register.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder={t("register.email_placeholder")}
          editable={!isLoading}
        />
        <PixelInput
          label={t("register.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={t("register.password_placeholder")}
          editable={!isLoading}
        />

        <View style={[styles.roleSelection, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="label" color="cream">
            {t("register.account_type")}:
          </PixelText>
          <View style={[styles.roleButtons, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelButton
              label={t("register.role_child")}
              variant={role === "child" ? "primary" : "secondary"}
              size="sm"
              onPress={() => setRole("child")}
              disabled={isLoading}
              style={styles.roleButton}
            />
            <PixelButton
              label={t("register.role_parent")}
              variant={role === "parent" ? "primary" : "secondary"}
              size="sm"
              onPress={() => setRole("parent")}
              disabled={isLoading}
              style={styles.roleButton}
            />
          </View>
        </View>

        <PixelButton
          label={isLoading ? t("common.loading") : t("register.register_button")}
          onPress={handleRegister}
          variant="primary"
          size="lg"
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading && <ActivityIndicator color={COLORS.white} size="small" />}
        </PixelButton>

        <Link href="/(auth)/login" asChild>
          <PixelButton
            label={t("register.login_link")}
            variant="secondary"
            size="md"
            style={styles.loginButton}
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
  roleSelection: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  roleButtons: {
    gap: SPACING.xs,
  },
  roleButton: {
    flex: 1,
  },
  button: {
    marginTop: SPACING.md,
  },
  loginButton: {
    marginTop: SPACING.sm,
  },
});

