import { useState, useRef, useEffect } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { t, getLang } from "@/i18n";
import { signInAsGuest, signInWithEmail, refreshAuthState } from "@/lib/firebase";
import { setUserProfile, setHeroProfile } from "@/lib/firestore";
import { createHeroProfile } from "@/lib/gameLogic";
import { PixelButton, PixelCard, PixelText } from "@/components/ui";
import { COLORS, FONT_SIZES, PIXEL_BORDER, SPACING } from "@/constants/theme";

type Step = "title" | "consent" | "heroName" | "creating" | "emailLogin";

export default function LoginScreen() {
  const [step, setStep] = useState<Step>("title");
  const [heroName, setHeroName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email login (hidden, for returning users only)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Fade-in animation for each step
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function transitionTo(nextStep: Step) {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      setError(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }

  // ── Create guest hero ──
  async function handleCreateHero() {
    const name = heroName.trim() || t("hero.defaultName");
    setIsLoading(true);
    setError(null);
    transitionTo("creating");
    try {
      const credential = await signInAsGuest();
      const uid = credential.user.uid;

      await setUserProfile(uid, {
        role: "child",
        locale: getLang(),
        createdAt: new Date().toISOString(),
      });

      const hero = createHeroProfile(uid, name);
      const { id: _heroId, ...heroData } = hero;
      await setHeroProfile(uid, uid, heroData);

      // Re-trigger auth state now that profile is saved.
      // AuthContext's handler will find the profile and set user correctly.
      // The auth layout will then redirect to /(app).
      await refreshAuthState();
    } catch {
      setError(t("common.error"));
      setIsLoading(false);
      transitionTo("heroName");
    }
  }

  // ── Email login for returning users ──
  async function handleEmailLogin() {
    if (!email.trim() || !password) {
      setError(t("auth.login_error"));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
      // useAuth in auth layout will redirect
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
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* ──────── STEP 1: Title Screen ──────── */}
          {step === "title" && (
            <View style={styles.stepContainer}>
              <View style={styles.titleSection}>
                <PixelText variant="body" color="gold" style={styles.emoji}>
                  {"⚔️  🛡️  ⚔️"}
                </PixelText>
                <PixelText variant="title" color="gold" style={styles.title}>
                  {t("app.name")}
                </PixelText>
                <View style={styles.tagline}>
                  <PixelText variant="caption" color="cream" style={styles.taglineText}>
                    {t("auth.welcome")}
                  </PixelText>
                </View>
              </View>

              <PixelCard style={styles.featureCard}>
                <PixelText variant="body" color="cream" style={styles.featureText}>
                  {"🗡️ " + t("camp.questDescription")}
                </PixelText>
                <View style={styles.featureList}>
                  <PixelText variant="caption" color="gold" style={styles.featureItem}>
                    {"✨ " + t("hero.levelUp")}
                  </PixelText>
                  <PixelText variant="caption" color="gold" style={styles.featureItem}>
                    {"💰 " + t("hero.earnGold")}
                  </PixelText>
                  <PixelText variant="caption" color="gold" style={styles.featureItem}>
                    {"⚔️ " + t("hero.battleMonsters")}
                  </PixelText>
                </View>
              </PixelCard>

              <PixelButton
                label={"⚔️ " + t("auth.startAdventure")}
                variant="primary"
                size="lg"
                onPress={() => transitionTo("consent")}
                style={styles.fullWidth}
              />

              <Pressable
                style={styles.returningUser}
                onPress={() => transitionTo("emailLogin")}
              >
                <PixelText variant="caption" color="gray" style={styles.linkText}>
                  {t("auth.have_account")}
                </PixelText>
              </Pressable>
            </View>
          )}

          {/* ──────── STEP 2: Parent Consent ──────── */}
          {step === "consent" && (
            <View style={styles.stepContainer}>
              <View style={styles.titleSection}>
                <PixelText variant="body" color="gold" style={styles.emoji}>
                  {"🛡️"}
                </PixelText>
                <PixelText variant="heading" color="gold" style={styles.stepTitle}>
                  {t("auth.coppa_notice_title")}
                </PixelText>
              </View>

              <PixelCard style={styles.consentCard}>
                <PixelText variant="body" color="cream" style={styles.consentText}>
                  {t("auth.coppa_notice_short")}
                </PixelText>
              </PixelCard>

              <PixelButton
                label={"✅ " + t("auth.coppa_agree")}
                variant="primary"
                size="lg"
                onPress={() => transitionTo("heroName")}
                style={styles.fullWidth}
              />

              <Pressable
                style={styles.backLink}
                onPress={() => transitionTo("title")}
              >
                <PixelText variant="caption" color="gray" style={styles.linkText}>
                  {t("common.back")}
                </PixelText>
              </Pressable>
            </View>
          )}

          {/* ──────── STEP 3: Hero Name (Tutorial) ──────── */}
          {step === "heroName" && (
            <View style={styles.stepContainer}>
              <View style={styles.titleSection}>
                <PixelText variant="body" color="gold" style={styles.emoji}>
                  {"📜"}
                </PixelText>
                <PixelText variant="heading" color="gold" style={styles.stepTitle}>
                  {t("tutorial.greeting")}
                </PixelText>
              </View>

              <PixelCard style={styles.tutorialCard}>
                <PixelText variant="body" color="cream" style={styles.tutorialNarration}>
                  {t("tutorial.ask_name")}
                </PixelText>

                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={heroName}
                    onChangeText={setHeroName}
                    placeholder={t("tutorial.name_placeholder")}
                    placeholderTextColor={COLORS.grayDark}
                    maxLength={12}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleCreateHero}
                  />
                </View>

                <PixelText variant="caption" color="gray" style={styles.nameHint}>
                  {t("tutorial.name_hint")}
                </PixelText>
              </PixelCard>

              {error && (
                <View style={styles.errorBox}>
                  <PixelText variant="caption" color="danger">{error}</PixelText>
                </View>
              )}

              <PixelButton
                label={isLoading ? t("common.loading") : "⚔️ " + t("tutorial.start_quest")}
                variant="primary"
                size="lg"
                disabled={isLoading}
                onPress={handleCreateHero}
                style={styles.fullWidth}
              />

              <Pressable
                style={styles.backLink}
                onPress={() => transitionTo("consent")}
              >
                <PixelText variant="caption" color="gray" style={styles.linkText}>
                  {t("common.back")}
                </PixelText>
              </Pressable>
            </View>
          )}

          {/* ──────── STEP 4: Creating... ──────── */}
          {step === "creating" && (
            <View style={styles.stepContainer}>
              <View style={styles.titleSection}>
                <PixelText variant="body" color="gold" style={styles.emoji}>
                  {"⚔️"}
                </PixelText>
                <PixelText variant="heading" color="gold" style={styles.stepTitle}>
                  {t("tutorial.creating_hero")}
                </PixelText>
                <LoadingDots />
              </View>
            </View>
          )}

          {/* ──────── Email Login (returning users) ──────── */}
          {step === "emailLogin" && (
            <View style={styles.stepContainer}>
              <View style={styles.titleSection}>
                <PixelText variant="heading" color="gold" style={styles.stepTitle}>
                  {t("auth.login")}
                </PixelText>
              </View>

              <PixelCard style={styles.loginCard}>
                <View style={styles.fieldGroup}>
                  <PixelText variant="label" color="cream" style={styles.fieldLabel}>
                    {t("auth.email")}
                  </PixelText>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    placeholder={t("auth.email_placeholder")}
                    placeholderTextColor={COLORS.grayDark}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <PixelText variant="label" color="cream" style={styles.fieldLabel}>
                    {t("auth.password")}
                  </PixelText>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleEmailLogin}
                    placeholder={t("auth.password_placeholder")}
                    placeholderTextColor={COLORS.grayDark}
                  />
                </View>

                {error && (
                  <View style={styles.errorBox}>
                    <PixelText variant="caption" color="danger">{error}</PixelText>
                  </View>
                )}

                <PixelButton
                  label={isLoading ? t("common.loading") : t("auth.login")}
                  variant="secondary"
                  size="md"
                  disabled={isLoading}
                  onPress={handleEmailLogin}
                />
              </PixelCard>

              <Pressable
                style={styles.backLink}
                onPress={() => transitionTo("title")}
              >
                <PixelText variant="caption" color="gray" style={styles.linkText}>
                  {t("common.back")}
                </PixelText>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Simple loading dots animation ──
function LoadingDots() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <PixelText variant="body" color="cream" style={styles.loadingDots}>
      {dots || " "}
    </PixelText>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  stepContainer: {
    gap: SPACING.md,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  emoji: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  title: {
    textAlign: "center",
    textShadowColor: COLORS.goldDark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  tagline: {
    borderWidth: 1,
    borderColor: COLORS.goldDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  taglineText: {
    textAlign: "center",
  },
  stepTitle: {
    textAlign: "center",
  },
  featureCard: {
    gap: SPACING.sm,
  },
  featureText: {
    textAlign: "center",
    lineHeight: 22,
  },
  featureList: {
    gap: SPACING.xs,
  },
  featureItem: {
    textAlign: "center",
  },
  fullWidth: {
    width: "100%",
  },
  returningUser: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  backLink: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  linkText: {
    textDecorationLine: "underline",
    textAlign: "center",
  },
  // Consent
  consentCard: {
    gap: SPACING.sm,
  },
  consentText: {
    textAlign: "center",
    lineHeight: 24,
  },
  // Tutorial
  tutorialCard: {
    gap: SPACING.md,
  },
  tutorialNarration: {
    textAlign: "center",
    lineHeight: 26,
    fontSize: FONT_SIZES.lg,
  },
  nameInputContainer: {
    borderWidth: 3,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.bgMid,
  },
  nameInput: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.xl,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    letterSpacing: 2,
  },
  nameHint: {
    textAlign: "center",
  },
  // Loading
  loadingDots: {
    textAlign: "center",
    fontSize: FONT_SIZES.xl,
    marginTop: SPACING.sm,
    minHeight: 30,
  },
  // Error
  errorBox: {
    backgroundColor: "#3A0000",
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.hp,
    padding: SPACING.sm,
  },
  // Email login
  loginCard: {
    gap: SPACING.sm,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  fieldLabel: {},
  input: {
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    color: COLORS.cream,
    fontSize: FONT_SIZES.md,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
});
