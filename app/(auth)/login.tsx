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
  Text,
} from "react-native";
import { t, getLang } from "@/i18n";
import { signInAsGuest, signInWithEmail, refreshAuthState } from "@/lib/firebase";
import { setUserProfile, setHeroProfile } from "@/lib/firestore";
import { createHeroProfile } from "@/lib/gameLogic";
import { DQWindow, DQCommandMenu, DQMessageBox } from "@/components/ui";

const DQ_BG = "#000000";
const DQ_BLUE = "#0000AA";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

type Step = "title" | "consent" | "heroName" | "creating" | "emailLogin";

export default function LoginScreen() {
  const [step, setStep] = useState<Step>("title");
  const [heroName, setHeroName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      await refreshAuthState();
    } catch {
      setError(t("common.error"));
      setIsLoading(false);
      transitionTo("heroName");
    }
  }

  async function handleEmailLogin() {
    if (!email.trim() || !password) {
      setError(t("auth.login_error"));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
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
          {/* ──── TITLE SCREEN (DQ Opening) ──── */}
          {step === "title" && (
            <View style={styles.stepContainer}>
              <View style={styles.titleArea}>
                <Text style={styles.titleEmoji}>{"⚔️"}</Text>
                <Text style={styles.titleText}>{t("app.name")}</Text>
                <View style={styles.subtitleBox}>
                  <Text style={styles.subtitleText}>{t("auth.welcome")}</Text>
                </View>
              </View>

              <DQCommandMenu
                items={[
                  { label: t("dq.login.start"), onPress: () => transitionTo("consent") },
                  { label: t("dq.login.continue"), onPress: () => transitionTo("emailLogin") },
                ]}
              />
            </View>
          )}

          {/* ──── CONSENT (Parent notice) ──── */}
          {step === "consent" && (
            <View style={styles.stepContainer}>
              <DQMessageBox
                text={t("auth.coppa_notice_short")}
                speed={30}
              />

              <DQCommandMenu
                items={[
                  { label: t("auth.coppa_agree"), onPress: () => transitionTo("heroName") },
                  { label: t("common.back"), onPress: () => transitionTo("title") },
                ]}
              />
            </View>
          )}

          {/* ──── HERO NAME (DQ name entry) ──── */}
          {step === "heroName" && (
            <View style={styles.stepContainer}>
              <DQMessageBox text={t("dq.login.name_prompt")} speed={40} />

              <DQWindow>
                <TextInput
                  style={styles.nameInput}
                  value={heroName}
                  onChangeText={setHeroName}
                  placeholder={t("tutorial.name_placeholder")}
                  placeholderTextColor="#666688"
                  maxLength={12}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreateHero}
                />
                <Text style={styles.nameHint}>{t("tutorial.name_hint")}</Text>
              </DQWindow>

              {error && (
                <DQWindow>
                  <Text style={styles.errorText}>{error}</Text>
                </DQWindow>
              )}

              <DQCommandMenu
                items={[
                  {
                    label: isLoading ? t("common.loading") : t("tutorial.start_quest"),
                    onPress: handleCreateHero,
                    disabled: isLoading,
                  },
                  { label: t("common.back"), onPress: () => transitionTo("consent") },
                ]}
              />
            </View>
          )}

          {/* ──── CREATING... ──── */}
          {step === "creating" && (
            <View style={styles.stepContainer}>
              <View style={styles.titleArea}>
                <Text style={styles.titleEmoji}>{"⚔️"}</Text>
                <Text style={styles.creatingText}>{t("tutorial.creating_hero")}</Text>
                <LoadingDots />
              </View>
            </View>
          )}

          {/* ──── EMAIL LOGIN ──── */}
          {step === "emailLogin" && (
            <View style={styles.stepContainer}>
              <DQWindow title={t("auth.login")}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("auth.email")}</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    placeholder={t("auth.email_placeholder")}
                    placeholderTextColor="#666688"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("auth.password")}</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleEmailLogin}
                    placeholder={t("auth.password_placeholder")}
                    placeholderTextColor="#666688"
                  />
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}
              </DQWindow>

              <DQCommandMenu
                items={[
                  {
                    label: isLoading ? t("common.loading") : t("auth.login"),
                    onPress: handleEmailLogin,
                    disabled: isLoading,
                  },
                  { label: t("common.back"), onPress: () => transitionTo("title") },
                ]}
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LoadingDots() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <Text style={styles.loadingDots}>{dots || " "}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  stepContainer: {
    gap: 16,
  },
  titleArea: {
    alignItems: "center",
    marginBottom: 16,
  },
  titleEmoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 12,
  },
  titleText: {
    color: "#FFD700",
    fontSize: 28,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "#B8860B",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitleBox: {
    borderWidth: 1,
    borderColor: "#B8860B",
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },
  subtitleText: {
    color: "#F5F5DC",
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
  },
  creatingText: {
    color: "#FFD700",
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingDots: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
    marginTop: 8,
    minHeight: 30,
  },
  nameInput: {
    color: "#FFD700",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    letterSpacing: 2,
    borderWidth: 2,
    borderColor: "#4444AA",
    backgroundColor: "#000044",
    borderRadius: 2,
  },
  nameHint: {
    color: "#888899",
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
    marginTop: 8,
  },
  fieldGroup: {
    gap: 4,
    marginBottom: 8,
  },
  fieldLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
  input: {
    backgroundColor: "#000044",
    borderWidth: 2,
    borderColor: "#4444AA",
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 2,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    marginTop: 4,
  },
});
