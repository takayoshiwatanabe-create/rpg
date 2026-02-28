import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  View,
  BackHandler,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToQuest,
  updateQuestStatus,
  updateHeroStats,
  createBattleSession,
} from "@/lib/firestore";
import {
  isQuestOverdue,
  calculateQuestRewards,
  applyExpPenalty,
  applyGoldPenalty,
} from "@/lib/gameLogic";
import { DQWindow, DQCommandMenu, DQMessageBox } from "@/components/ui";
import { t, getIsRTL } from "@/i18n";
import { getMonster } from "@/constants/monsters";
import type { Quest } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const DQ_BG = "#000011";
const DQ_BATTLE_BG = "#000000";
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

type BattleState = "loading" | "ready" | "inProgress" | "completed" | "failed" | "error";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function BattleScreen() {
  const { questId: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user } = useAuth();
  const isRTL = getIsRTL();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [battleState, setBattleState] = useState<BattleState>("loading");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isQuestCompleted, setIsQuestCompleted] = useState(false);
  const battleStartTime = useRef<number | null>(null);

  const monsterShakeAnim = useRef(new Animated.Value(0)).current;

  // Prevent back during battle
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (battleState === "inProgress") {
        Alert.alert(
          t("battle.exit_confirm_title"),
          t("battle.exit_confirm_message"),
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("common.exit"), style: "destructive", onPress: () => router.back() },
          ],
          { cancelable: false },
        );
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [battleState]);

  // Subscribe to quest data
  useEffect(() => {
    if (!questId) {
      setBattleState("error");
      return;
    }
    const unsub = subscribeToQuest(questId, (q: Quest | null) => {
      if (q) {
        setQuest(q);
        setTimeRemaining(q.estimatedMinutes * 60);
        if (q.status === "completed") {
          setBattleState("completed");
        } else if (q.status === "pending" || q.status === "inProgress") {
          setBattleState("ready");
        } else {
          setBattleState("error");
        }
      } else {
        setBattleState("error");
      }
    });
    return unsub;
  }, [questId]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (!isQuestCompleted) {
        setBattleState("failed");
      }
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining, isQuestCompleted]);

  // Monster shake animation on fight
  const shakeMonster = useCallback(() => {
    if (reducedMotion) return;
    Animated.sequence([
      Animated.timing(monsterShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [monsterShakeAnim, reducedMotion]);

  const handleStartBattle = useCallback(async () => {
    if (!quest || !user) return;
    setBattleState("inProgress");
    setIsTimerRunning(true);
    battleStartTime.current = Date.now();
    shakeMonster();
    try {
      await updateQuestStatus(quest.id, "inProgress");
    } catch (error) {
      console.error("Failed to update quest status:", error);
      Alert.alert(t("common.error"), t("common.unknown"));
    }
  }, [quest, user, shakeMonster]);

  const handleCompleteQuest = useCallback(async () => {
    if (!quest || !user || !isQuestCompleted || !battleStartTime.current) return;

    setIsTimerRunning(false);
    setBattleState("completed");

    const overdue = isQuestOverdue(quest.deadlineDate);
    const baseRewards = calculateQuestRewards(quest.difficulty, overdue);
    const finalExp = applyExpPenalty(baseRewards.exp, overdue);
    const finalGold = applyGoldPenalty(baseRewards.gold, overdue);
    const endTime = Date.now();
    const duration = Math.floor((endTime - battleStartTime.current) / 1000);

    try {
      await updateQuestStatus(quest.id, "completed");
      await updateHeroStats(user.uid, { totalExp: finalExp, gold: finalGold });
      await createBattleSession(user.uid, quest.id, {
        startTime: new Date(battleStartTime.current).toISOString(),
        endTime: new Date(endTime).toISOString(),
        durationSeconds: duration,
        status: "completed",
        rewards: { exp: finalExp, gold: finalGold },
      });
      router.replace({
        pathname: "/(app)/battle/result",
        params: {
          questId: quest.id,
          exp: finalExp,
          gold: finalGold,
          overdue: overdue ? "true" : "false",
          monsterName: t(getMonster(quest.subject, quest.difficulty).nameKey),
        },
      });
    } catch (error) {
      console.error("Failed to complete quest:", error);
      Alert.alert(t("common.error"), t("common.unknown"));
      setBattleState("error");
    }
  }, [quest, user, isQuestCompleted]);

  if (battleState === "loading") {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t("common.loading")}...</Text>
      </View>
    );
  }

  if (battleState === "error" || !quest) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <DQMessageBox text={t("battle.error.notFound")} />
        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: () => router.back() }]}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const monster = getMonster(quest.subject, quest.difficulty);
  const monsterName = t(monster.nameKey);

  // --- READY state: monster appeared ---
  if (battleState === "ready") {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, direction: isRTL ? "rtl" : "ltr" }]}>
        {/* Monster display area */}
        <View style={styles.battleField}>
          <Animated.Text style={[styles.monsterEmoji, { transform: [{ translateX: monsterShakeAnim }] }]}>
            {monster.emoji}
          </Animated.Text>
          <Text style={styles.monsterNameText}>{monsterName}</Text>
        </View>

        {/* Message */}
        <DQMessageBox
          text={t("dq.battle.appeared", { monster: monsterName })}
          speed={40}
        />

        {/* Command */}
        <DQCommandMenu
          items={[
            { label: t("dq.battle.fight"), onPress: handleStartBattle },
            { label: t("dq.battle.run"), onPress: () => router.back() },
          ]}
        />
      </View>
    );
  }

  // --- IN PROGRESS state: fighting ---
  if (battleState === "inProgress") {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, direction: isRTL ? "rtl" : "ltr" }]}>
        {/* Monster */}
        <View style={styles.battleField}>
          <Animated.Text style={[styles.monsterEmoji, { transform: [{ translateX: monsterShakeAnim }] }]}>
            {monster.emoji}
          </Animated.Text>
          <Text style={styles.monsterNameText}>{monsterName}</Text>
        </View>

        {/* Timer */}
        <DQWindow>
          <Text style={styles.timerText}>
            {"⏱ "}{t("dq.battle.timer", { time: formatTime(timeRemaining) })}
          </Text>
        </DQWindow>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsQuestCompleted((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.checkboxIcon}>{isQuestCompleted ? "☑" : "☐"}</Text>
          <Text style={styles.checkboxLabel}>{t("dq.battle.hw_done")}</Text>
        </TouchableOpacity>

        {/* Command */}
        <DQCommandMenu
          items={
            isQuestCompleted
              ? [
                  { label: t("dq.battle.finish"), onPress: handleCompleteQuest },
                  { label: t("dq.battle.run"), onPress: () => router.back() },
                ]
              : [
                  { label: t("dq.battle.finish"), onPress: () => {}, disabled: true },
                  { label: t("dq.battle.run"), onPress: () => router.back() },
                ]
          }
        />
      </View>
    );
  }

  // --- FAILED state ---
  if (battleState === "failed") {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, direction: isRTL ? "rtl" : "ltr" }]}>
        <View style={styles.battleField}>
          <Text style={styles.monsterEmoji}>{monster.emoji}</Text>
        </View>
        <DQMessageBox text={t("common.error")} speed={60} />
        <DQCommandMenu
          items={[{ label: t("common.back"), onPress: () => router.replace("/(app)/camp") }]}
        />
      </View>
    );
  }

  // --- COMPLETED state (redirect should happen, but fallback) ---
  return (
    <View style={styles.center}>
      <Text style={styles.loadingText}>{t("common.loading")}...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DQ_BATTLE_BG,
    padding: 16,
    gap: 12,
    justifyContent: "flex-end",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DQ_BATTLE_BG,
    padding: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  battleField: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  monsterEmoji: {
    fontSize: 80,
    textAlign: "center",
  },
  monsterNameText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
  },
  timerText: {
    color: "#FFD700",
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0000AA",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 4,
    padding: 12,
    gap: 10,
  },
  checkboxIcon: {
    color: "#FFD700",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
  },
  checkboxLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
});
