import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  View,
  BackHandler,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import {
  subscribeToQuest,
  updateQuestStatus,
  updateHeroStats,
  createBattleSession,
} from "@/src/lib/firestore";
import {
  isQuestOverdue,
  calculateQuestRewards,
  applyExpPenalty,
  applyGoldPenalty,
} from "@/src/lib/gameLogic";
import { PixelButton, PixelText } from "@/src/components/ui";
import { t, getIsRTL } from "@/i18n";
import { COLORS, SPACING } from "@/constants/theme";
import type { Quest } from "@/types";
import { BattleScene } from "@/src/components/BattleScene";
import { useReducedMotion } from "@/src/hooks/useReducedMotion";

// Battle states for the UI and logic flow
type BattleState =
  | "loading"
  | "ready"
  | "inProgress"
  | "completed"
  | "failed"
  | "error";

export default function BattleScreen() {
  const { questId: questIdParam } = useLocalSearchParams();
  const questId = typeof questIdParam === "string" ? questIdParam : undefined;

  const { user } = useAuth();
  const isRTL = getIsRTL();
  const reducedMotion = useReducedMotion();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [battleState, setBattleState] = useState<BattleState>("loading");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isQuestCompleted, setIsQuestCompleted] = useState(false); // Checkbox state
  const battleStartTime = useRef<number | null>(null); // To record battle start time for session

  // Animation for battle scene entry
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Prevent back button during battle
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (battleState === "inProgress") {
          Alert.alert(
            t("battle.exit_confirm_title"),
            t("battle.exit_confirm_message"),
            [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("common.exit"),
                style: "destructive",
                onPress: () => router.back(),
              },
            ],
            { cancelable: false },
          );
          return true; // Prevent default back action
        }
        return false; // Allow default back action
      },
    );
    return () => backHandler.remove();
  }, [battleState]);

  useEffect(() => {
    if (!questId) {
      setBattleState("error");
      return;
    }

    const unsub = subscribeToQuest(questId, (q) => {
      if (q) {
        setQuest(q);
        setTimeRemaining(q.estimatedMinutes * 60); // Convert minutes to seconds
        if (q.status === "completed") {
          setBattleState("completed");
        } else if (q.status === "pending" || q.status === "inProgress") {
          setBattleState("ready");
        } else {
          setBattleState("error"); // e.g., deleted quest
        }

        // Animate in when quest data is loaded
        if (!reducedMotion) {
          Animated.spring(animatedValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 10,
            bounciness: 8,
          }).start();
        } else {
          animatedValue.setValue(1); // Instantly show if reduced motion is preferred
        }
      } else {
        setBattleState("error");
      }
    });

    return unsub;
  }, [questId, animatedValue, reducedMotion]);

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (!isQuestCompleted) {
        setBattleState("failed"); // Time ran out, quest not completed
      }
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining, isQuestCompleted]);

  const handleStartBattle = useCallback(async () => {
    if (!quest || !user) return;
    setBattleState("inProgress");
    setIsTimerRunning(true);
    battleStartTime.current = Date.now(); // Record start time
    try {
      await updateQuestStatus(quest.id, "inProgress");
    } catch (error) {
      console.error("Failed to update quest status to inProgress:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
    }
  }, [quest, user]);

  const handleCompleteQuest = useCallback(async () => {
    if (!quest || !user || !isQuestCompleted || !battleStartTime.current) return;

    setIsTimerRunning(false);
    setBattleState("completed");

    const overdue = isQuestOverdue(quest.deadlineDate);
    const baseRewards = calculateQuestRewards(quest.difficulty, overdue);
    const finalExp = applyExpPenalty(baseRewards.exp, overdue);
    const finalGold = applyGoldPenalty(baseRewards.gold, overdue);
    const endTime = Date.now();
    const duration = Math.floor((endTime - battleStartTime.current) / 1000); // Duration in seconds

    try {
      await updateQuestStatus(quest.id, "completed");
      await updateHeroStats(user.uid, {
        totalExp: finalExp, // Corrected property name
        gold: finalGold,
      });
      await createBattleSession(user.uid, quest.id, {
        // Corrected properties to match BattleSession type
        startTime: new Date(battleStartTime.current).toISOString(),
        endTime: new Date(endTime).toISOString(),
        durationSeconds: duration, // Changed from 'duration' to 'durationSeconds'
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
        },
      });
    } catch (error) {
      console.error("Failed to complete quest or update hero stats:", error);
      Alert.alert(t("common.error"), t("error.unknown"));
      setBattleState("error");
    }
  }, [quest, user, isQuestCompleted]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const cardAnimation = {
    opacity: animatedValue,
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  if (battleState === "loading") {
    return (
      <View style={styles.center}>
        <PixelText variant="body" color="cream">
          {t("common.loading")}...
        </PixelText>
      </View>
    );
  }

  if (battleState === "error" || !quest) {
    return (
      <View style={styles.center}>
        <PixelText variant="body" color="danger">
          {t("battle.error.notFound")}
        </PixelText>
        <PixelButton
          label={t("common.back")}
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const isOverdue = isQuestOverdue(quest.deadlineDate);
  const rewards = calculateQuestRewards(quest.difficulty, isOverdue);

  return (
    <>
      <Stack.Screen options={{ title: t("battle.title") }} />
      <Animated.View
        style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }, cardAnimation]}
      >
        <BattleScene
          quest={quest}
          battleState={battleState}
          timeRemaining={timeRemaining}
          isTimerRunning={isTimerRunning}
          isQuestCompleted={isQuestCompleted}
          onStartBattle={handleStartBattle}
          onCompleteQuest={handleCompleteQuest}
          onToggleQuestCompleted={() => setIsQuestCompleted((prev) => !prev)}
          onExitBattle={() => router.back()}
          rewards={rewards}
          isRTL={isRTL}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    padding: SPACING.md,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bgDark,
  },
  backButton: {
    marginTop: SPACING.md,
  },
});

