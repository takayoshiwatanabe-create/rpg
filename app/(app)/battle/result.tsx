import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View, Text, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToHero } from "@/lib/firestore";
import { DQMessageBox, DQCommandMenu, DQWindow } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { expProgressInCurrentLevel } from "@/lib/expCalculator";
import type { HeroProfile } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const DQ_BG = "#000000";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

function formatStudyTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function BattleResultScreen() {
  const { questId, exp, gold, duration, overdue, monsterName } = useLocalSearchParams();
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  const parsedExp = typeof exp === "string" ? parseInt(exp, 10) : 0;
  const parsedGold = typeof gold === "string" ? parseInt(gold, 10) : 0;
  const parsedDuration = typeof duration === "string" ? parseInt(duration, 10) : 0;
  const monster = typeof monsterName === "string" ? monsterName : "???";

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageStep, setMessageStep] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const expBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const unsub = subscribeToHero(user.uid, user.uid, (h: HeroProfile | null) => {
      if (h) {
        setHero(h);

        // Animate EXP bar fill
        const progress = expProgressInCurrentLevel(h.totalExp);
        const ratio = progress.required > 0 ? progress.current / progress.required : 1;
        if (!reducedMotion) {
          Animated.timing(expBarAnim, {
            toValue: ratio,
            duration: 1200,
            useNativeDriver: false,
          }).start();
        } else {
          expBarAnim.setValue(ratio);
        }
      }
      setIsLoading(false);

      if (!reducedMotion) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        fadeAnim.setValue(1);
      }
    });
    return unsub;
  }, [user, fadeAnim, expBarAnim, reducedMotion]);

  const handleReturnToCamp = () => {
    router.replace("/(app)/camp");
  };

  // Build message sequence
  const messages: string[] = [];
  messages.push(t("dq.result.defeated", { monster }));
  messages.push(t("dq.result.exp", { exp: parsedExp }));
  messages.push(t("dq.result.gold", { gold: parsedGold }));
  if (hero && hero.level > 1) {
    messages.push(t("dq.result.levelup", { name: hero.displayName, level: hero.level }));
  }

  const currentMessage = messages[messageStep] ?? messages[messages.length - 1];
  const isLastMessage = messageStep >= messages.length - 1;

  const handleMessageComplete = () => {
    if (!isLastMessage) {
      setMessageStep((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t("common.loading")}...</Text>
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={t("error.hero_not_found")} />
        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: handleReturnToCamp }]}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const expProgress = expProgressInCurrentLevel(hero.totalExp);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: fadeAnim,
          direction: isRTL ? "rtl" : "ltr",
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Victory fanfare area */}
      <View style={styles.victoryArea}>
        <Text style={styles.victoryEmoji}>{"🎉"}</Text>
        <Text style={styles.victoryTitle}>{t("dq.result.defeated", { monster })}</Text>
      </View>

      {/* Study time display */}
      {parsedDuration > 0 && (
        <DQWindow title={t("dq.result.study_time")}>
          <Text style={styles.studyTimeText}>
            {"📚 "}{formatStudyTime(parsedDuration)}
          </Text>
        </DQWindow>
      )}

      {/* Reward summary */}
      <DQWindow title={t("dq.result.rewards")}>
        <View style={styles.rewardRow}>
          <Text style={styles.rewardLabel}>{"✨ "}{t("hero.exp")}</Text>
          <Text style={styles.rewardValue}>{`+${parsedExp}`}</Text>
        </View>
        <View style={styles.rewardRow}>
          <Text style={styles.rewardLabel}>{"💰 "}{t("hero.gold")}</Text>
          <Text style={styles.rewardGold}>{`+${parsedGold}`}</Text>
        </View>
      </DQWindow>

      {/* Hero growth: level + EXP bar */}
      <DQWindow title={t("dq.result.hero_growth")}>
        <View style={styles.rewardRow}>
          <Text style={styles.heroLevelLabel}>{hero.displayName}</Text>
          <Text style={styles.heroLevelValue}>Lv.{hero.level}</Text>
        </View>
        <View style={styles.expBarRow}>
          <Text style={styles.expBarLabel}>EXP</Text>
          <View style={styles.expBarContainer}>
            <Animated.View
              style={[
                styles.expBarFill,
                {
                  width: expBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.expBarValue}>
            {expProgress.current}/{expProgress.required}
          </Text>
        </View>
      </DQWindow>

      {/* DQ Message Box with sequential messages */}
      <DQMessageBox
        key={messageStep}
        text={currentMessage ?? ""}
        speed={40}
        onComplete={handleMessageComplete}
      />

      {/* Return command */}
      {isLastMessage && (
        <DQCommandMenu
          items={[{ label: t("dq.result.next"), onPress: handleReturnToCamp }]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BG,
    padding: 16,
    gap: 12,
    justifyContent: "flex-end",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BG,
    padding: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: FONT_FAMILY,
  },
  victoryArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  victoryEmoji: {
    fontSize: 72,
    textAlign: "center",
  },
  victoryTitle: {
    color: "#FFD700",
    fontSize: 28,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
    textShadowColor: "#B8860B",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  // Study time
  studyTimeText: {
    color: "#FFD700",
    fontSize: 32,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Rewards
  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  rewardLabel: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
  },
  rewardValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  rewardGold: {
    color: "#FFD700",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  // Hero growth
  heroLevelLabel: {
    color: "#FFD700",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  heroLevelValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  expBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  expBarLabel: {
    color: "#32CD32",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
  expBarContainer: {
    flex: 1,
    height: 14,
    backgroundColor: "#333366",
    borderRadius: 2,
    overflow: "hidden",
  },
  expBarFill: {
    height: "100%",
    backgroundColor: "#32CD32",
    borderRadius: 2,
  },
  expBarValue: {
    color: "#AAAACC",
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    width: 80,
    textAlign: "right",
  },
});
