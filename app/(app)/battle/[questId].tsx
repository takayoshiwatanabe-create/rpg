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
import { useAuth } from "../../../hooks/useAuth"; // Corrected import path
import {
  subscribeToQuest,
  updateQuestStatus,
  updateHeroStats,
  createBattleSession,
} from "../../../lib/firestore"; // Corrected import path
import {
  isQuestOverdue,
  calculateQuestRewards,
  applyExpPenalty,
  applyGoldPenalty,
} from "../../../lib/gameLogic"; // Corrected import path
import { DQWindow, DQCommandMenu, DQMessageBox } from "../../../components/ui"; // Corrected import path
import { t, getIsRTL } from "../../../i18n"; // Corrected import path
import { getMonster } from "../../../constants/monsters"; // Corrected import path
import type { Quest } from "../../../types"; // Corrected import path
import { useReducedMotion } from "../../../hooks/useReducedMotion"; // Corrected import path
import { COLORS } from "../../../constants/theme"; // Corrected import path

const DQ_BATTLE_BG = COLORS.bgDark;
const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

type BattleState = "loading" | "ready" | "inProgress" | "completed" | "failed" | "error";

// Attack messages that cycle during battle
const ATTACK_MESSAGES = [
  "dq.battle.hero_attack",
  "dq.battle.critical",
  "dq.battle.keep_going",
  "dq.battle.almost",
];

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [attackMessage, setAttackMessage] = useState("");
  const [showAttackFlash, setShowAttackFlash] = useState(false);
  const battleStartTime = useRef<number | null>(null);
  const attackMsgIndex = useRef(0);

  const monsterShakeAnim = useRef(new Animated.Value(0)).current;
  const monsterHpAnim = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const damageAnim = useRef(new Animated.Value(0)).current;

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

  // Count-up timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Periodic attack animation every 30 seconds during battle
  useEffect(() => {
    if (!isTimerRunning || reducedMotion) return;
    if (elapsedSeconds > 0 && elapsedSeconds % 30 === 0) {
      triggerAttackAnimation();
    }
  }, [elapsedSeconds, isTimerRunning, reducedMotion]);

  // Monster shake animation
  const shakeMonster = useCallback(() => {
    if (reducedMotion) {
      monsterShakeAnim.setValue(0); // Ensure it's reset
      return;
    }
    Animated.sequence([
      Animated.timing(monsterShakeAnim, { toValue: 12, duration: 40, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: -12, duration: 40, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(monsterShakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [monsterShakeAnim, reducedMotion]);

  // Attack flash + monster shake + HP bar decrease + message
  const triggerAttackAnimation = useCallback(() => {
    if (reducedMotion) {
      setAttackMessage(t(ATTACK_MESSAGES[attackMsgIndex.current % ATTACK_MESSAGES.length]!));
      setShowAttackFlash(true);
      setTimeout(() => setShowAttackFlash(false), 2000);
      monsterHpAnim.setValue(Math.max(1 - (elapsedSeconds / (quest?.estimatedMinutes ? quest.estimatedMinutes * 60 : 1800)), 0.05));
      damageAnim.setValue(0); // Reset for no animation
      return;
    }

    // Show attack message
    const msgKey = ATTACK_MESSAGES[attackMsgIndex.current % ATTACK_MESSAGES.length]!;
    attackMsgIndex.current++;
    setAttackMessage(t(msgKey));
    setShowAttackFlash(true);

    // Flash screen white briefly (attack effect)
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    // Shake monster
    shakeMonster();

    // Decrease monster HP bar visually
    const estimatedTotal = quest?.estimatedMinutes ? quest.estimatedMinutes * 60 : 1800;
    const progress = Math.min(elapsedSeconds / estimatedTotal, 0.95);
    Animated.timing(monsterHpAnim, {
      toValue: Math.max(1 - progress, 0.05),
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Show damage number
    damageAnim.setValue(1);
    Animated.timing(damageAnim, { toValue: 0, duration: 1500, useNativeDriver: true }).start();

    // Hide attack message after 2s
    setTimeout(() => setShowAttackFlash(false), 2000);
  }, [shakeMonster, flashOpacity, monsterHpAnim, damageAnim, elapsedSeconds, quest, reducedMotion]);

  const handleStartBattle = useCallback(async () => {
    if (!quest || !user) return;
    setBattleState("inProgress");
    setIsTimerRunning(true);
    setElapsedSeconds(0);
    battleStartTime.current = Date.now();
    monsterHpAnim.setValue(1);

    // Initial attack animation
    if (!reducedMotion) {
      shakeMonster();
      setAttackMessage(t("dq.battle.hero_attack"));
      setShowAttackFlash(true);
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue: 0.6, duration: 60, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      damageAnim.setValue(1);
      Animated.timing(damageAnim, { toValue: 0, duration: 1500, useNativeDriver: true }).start();
      setTimeout(() => setShowAttackFlash(false), 2000);
    } else {
      setAttackMessage(t("dq.battle.hero_attack"));
      setShowAttackFlash(true);
      setTimeout(() => setShowAttackFlash(false), 2000);
      monsterShakeAnim.setValue(0);
      flashOpacity.setValue(0);
      damageAnim.setValue(0);
    }

    try {
      await updateQuestStatus(quest.id, "inProgress");
    } catch (error) {
      console.error("Failed to update quest status:", error);
      Alert.alert(t("common.error"), t("common.unknown"));
    }
  }, [quest, user, shakeMonster, flashOpacity, monsterHpAnim, damageAnim, reducedMotion]);

  const handleCompleteQuest = useCallback(async () => {
    if (!quest || !user || !battleStartTime.current) return;

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
          duration: duration,
          overdue: overdue ? "true" : "false",
          monsterName: t(getMonster(quest.subject, quest.difficulty).nameKey),
        },
      });
    } catch (error) {
      console.error("Failed to complete quest:", error);
      Alert.alert(t("common.error"), t("common.unknown"));
      setBattleState("error");
    }
  }, [quest, user]);

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
          items={[{ label: t("common.back"), onPress: () => router.back(), accessibilityLabel: t("common.back") }]}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const monster = getMonster(quest.subject, quest.difficulty);
  const monsterName = t(monster.nameKey);

  // --- READY state: monster appeared → 「たたかう！」 ---
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

        {/* Commands: たたかう / にげる */}
        <DQCommandMenu
          items={[
            { label: t("dq.battle.fight"), onPress: handleStartBattle, accessibilityLabel: t("dq.battle.fight") },
            { label: t("dq.battle.run"), onPress: () => router.back(), accessibilityLabel: t("dq.battle.run") },
          ]}
        />
      </View>
    );
  }

  // --- IN PROGRESS state: battle in progress ---
  if (battleState === "inProgress") {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, direction: isRTL ? "rtl" : "ltr" }]}>
        {/* Attack flash overlay */}
        <Animated.View
          style={[styles.flashOverlay, { opacity: flashOpacity }]}
          pointerEvents="none"
        />

        {/* Monster with HP bar */}
        <View style={styles.battleField}>
          {/* Monster HP bar */}
          <View style={styles.monsterHpContainer}>
            <Text style={styles.monsterHpLabel}>{monsterName}</Text>
            <View style={styles.monsterHpBar}>
              <Animated.View
                style={[
                  styles.monsterHpFill,
                  {
                    width: monsterHpAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Monster */}
          <Animated.Text style={[styles.monsterEmoji, { transform: [{ translateX: monsterShakeAnim }] }]}>
            {monster.emoji}
          </Animated.Text>

          {/* Damage number floating up */}
          <Animated.Text
            style={[
              styles.damageText,
              {
                opacity: damageAnim,
                transform: [{
                  translateY: damageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 0],
                  }),
                }],
              },
            ]}
          >
            {"💥"}
          </Animated.Text>
        </View>

        {/* Attack message */}
        {showAttackFlash && (
          <DQWindow>
            <Text style={styles.attackMessageText}>{attackMessage}</Text>
          </DQWindow>
        )}

        {/* Timer: battle duration */}
        <DQWindow>
          <Text style={styles.timerLabel}>{t("dq.battle.battle_time")}</Text>
          <Text style={styles.timerText}>
            {"⏱ "}{formatTime(elapsedSeconds)}
          </Text>
        </DQWindow>

        {/* できた！ = finishing blow */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleCompleteQuest}
          activeOpacity={0.7}
          accessibilityLabel={t("dq.battle.done")}
        >
          <Text style={styles.doneButtonText}>{t("dq.battle.done")}</Text>
        </TouchableOpacity>
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
          items={[{ label: t("common.back"), onPress: () => router.replace("/(app)/camp"), accessibilityLabel: t("common.back") }]}
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
    fontSize: 18,
    fontFamily: FONT_FAMILY,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
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
    fontSize: 28,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
  },
  // Monster HP bar
  monsterHpContainer: {
    width: "80%",
    marginBottom: 16,
  },
  monsterHpLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    marginBottom: 4,
  },
  monsterHpBar: {
    height: 12,
    backgroundColor: "#333333",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#666666",
    overflow: "hidden",
  },
  monsterHpFill: {
    height: "100%",
    backgroundColor: "#FF4500",
    borderRadius: 1,
  },
  // Damage text
  damageText: {
    fontSize: 36,
    position: "absolute",
    top: "30%",
  },
  // Attack message
  attackMessageText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Timer
  timerLabel: {
    color: "#AAAACC",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
    marginBottom: 4,
  },
  timerText: {
    color: "#FFD700",
    fontSize: 48,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Done button
  doneButton: {
    backgroundColor: "#228B22",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
  },
});

