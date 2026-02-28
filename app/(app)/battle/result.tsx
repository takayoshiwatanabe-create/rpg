import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View, Text, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToHero } from "@/lib/firestore";
import { DQMessageBox, DQCommandMenu } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import type { HeroProfile } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const DQ_BG = "#000000";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export default function BattleResultScreen() {
  const { questId, exp, gold, overdue, monsterName } = useLocalSearchParams();
  const { user } = useAuth();
  const isRTL = getIsRTL();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  const parsedExp = typeof exp === "string" ? parseInt(exp, 10) : 0;
  const parsedGold = typeof gold === "string" ? parseInt(gold, 10) : 0;
  const monster = typeof monsterName === "string" ? monsterName : "???";

  const [hero, setHero] = useState<HeroProfile | null>(null);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageStep, setMessageStep] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    // Store previous level before hero data updates
    let firstLoad = true;
    const unsub = subscribeToHero(user.uid, user.uid, (h: HeroProfile | null) => {
      if (h) {
        if (firstLoad && prevLevel === null) {
          // We'll check for level up by comparing with the level that was before reward
          // Since rewards are already applied, we approximate
          setPrevLevel(h.level);
          firstLoad = false;
        }
        setHero(h);
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
  }, [user, fadeAnim, reducedMotion]);

  const handleReturnToCamp = () => {
    router.replace("/(app)/camp");
  };

  // Build message sequence
  const messages: string[] = [];
  messages.push(t("dq.result.defeated", { monster }));
  messages.push(t("dq.result.exp", { exp: parsedExp }));
  messages.push(t("dq.result.gold", { gold: parsedGold }));
  if (hero && hero.level > 1) {
    // Show level up message (we show current level as the "new" level)
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
        <Text style={styles.victoryTitle}>{t("result.quest_completed")}</Text>
      </View>

      {/* Reward summary */}
      <View style={styles.rewardArea}>
        <View style={styles.rewardRow}>
          <Text style={styles.rewardLabel}>{"✨ EXP"}</Text>
          <Text style={styles.rewardValue}>{`+${parsedExp}`}</Text>
        </View>
        <View style={styles.rewardRow}>
          <Text style={styles.rewardLabel}>{"💰 Gold"}</Text>
          <Text style={styles.rewardGold}>{`+${parsedGold}`}</Text>
        </View>
        {hero && (
          <View style={styles.rewardRow}>
            <Text style={styles.rewardLabel}>{"⚔️ Lv."}</Text>
            <Text style={styles.rewardValue}>{hero.level}</Text>
          </View>
        )}
      </View>

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
    gap: 16,
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
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  victoryArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  victoryEmoji: {
    fontSize: 64,
    textAlign: "center",
  },
  victoryTitle: {
    color: "#FFD700",
    fontSize: 32,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
    textShadowColor: "#B8860B",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  rewardArea: {
    backgroundColor: "#0000AA",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 4,
    padding: 16,
    gap: 8,
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
});
