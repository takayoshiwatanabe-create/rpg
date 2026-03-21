import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import { PixelButton, PixelCard, PixelText } from "@/components/ui";
import { t } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER, FONT_SIZES } from "@/constants/theme";
import type { Quest, QuestReward } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getMonster } from "@/constants/monsters";

// Define battle states for the UI
type BattleState =
  | "loading"
  | "ready"
  | "inProgress"
  | "completed"
  | "failed"
  | "error";

export type BattleSceneProps = {
  quest: Quest;
  battleState: BattleState;
  timeRemaining: number;
  isTimerRunning: boolean;
  isQuestCompleted: boolean;
  onStartBattle: () => void;
  onCompleteQuest: () => void;
  onToggleQuestCompleted: () => void;
  onExitBattle: () => void;
  rewards: QuestReward;
  isRTL: boolean;
};

/**
 * The main battle scene component, orchestrating animations and UI for quest completion.
 * It displays the quest details, a timer, a monster sprite, and battle actions.
 */
export function BattleScene({
  quest,
  battleState,
  timeRemaining,
  isTimerRunning,
  isQuestCompleted,
  onStartBattle,
  onCompleteQuest,
  onToggleQuestCompleted,
  onExitBattle,
  rewards,
  isRTL,
}: BattleSceneProps) {
  const reducedMotion = useReducedMotion();

  // Animations
  const monsterShake = useRef(new Animated.Value(0)).current;
  const monsterOpacity = useRef(new Animated.Value(1)).current;
  const rewardTextOpacity = useRef(new Animated.Value(0)).current;

  const animateMonsterShake = () => {
    if (reducedMotion) return;
    monsterShake.setValue(0);
    Animated.sequence([
      Animated.timing(monsterShake, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(monsterShake, {
        toValue: -1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(monsterShake, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateMonsterDefeat = () => {
    if (reducedMotion) {
      monsterOpacity.setValue(0);
      return;
    }
    Animated.timing(monsterOpacity, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // After monster disappears, show rewards
      Animated.timing(rewardTextOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    if (battleState === "inProgress") {
      // Monster might periodically shake or animate during battle
      const interval = setInterval(() => {
        animateMonsterShake();
      }, 3000);
      return () => clearInterval(interval);
    }
    if (battleState === "completed") {
      animateMonsterDefeat();
    }
  }, [battleState, reducedMotion]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const monsterTransformStyle = {
    transform: [
      {
        translateX: monsterShake.interpolate({
          inputRange: [-1, 1],
          outputRange: [-5, 5],
        }),
      },
    ],
  };

  const monsterInfo = getMonster(quest.subject, quest.difficulty);

  return (
    <View style={styles.container}>
      {/* Top Panel: Quest Info */}
      <PixelCard variant="default" style={styles.questInfoCard}>
        <PixelText variant="heading" color="gold" style={styles.questTitle}>
          {quest.title}
        </PixelText>
        <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="label" color="cream">
            {t("quest.difficulty")}:
          </PixelText>
          <PixelText variant="body" color="gold">
            {t(`quest.difficulty.${quest.difficulty}`)}
          </PixelText>
        </View>
        <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="label" color="cream">
            {t("quest.estimatedTime")}:
          </PixelText>
          <PixelText variant="body" color="gray">
            {t("time.minutes", { n: quest.estimatedMinutes })}
          </PixelText>
        </View>
      </PixelCard>

      {/* Battle Area */}
      <View style={styles.battleArea}>
        {battleState === "ready" && (
          <View style={styles.centerContent}>
            <PixelText variant="body" color="cream">
              {t("battle.ready_message")}
            </PixelText>
            <PixelButton
              label={t("battle.start")}
              variant="primary"
              size="lg"
              onPress={onStartBattle}
              style={styles.actionButton}
            />
          </View>
        )}

        {(battleState === "inProgress" || battleState === "completed") && (
          <>
            <Animated.View
              style={[
                styles.monsterContainer,
                monsterTransformStyle,
                { opacity: monsterOpacity },
              ]}
            >
              <PixelText style={styles.monsterEmoji}>{monsterInfo.emoji}</PixelText>
            </Animated.View>

            {battleState === "completed" && (
              <Animated.View
                style={[styles.rewardTextContainer, { opacity: rewardTextOpacity }]}
              >
                <PixelText variant="heading" color="gold" style={styles.rewardText}>
                  {t("battle.victory")}!
                </PixelText>
                <PixelText variant="body" color="exp" style={styles.rewardText}>
                  {t("quest.reward_exp", { exp: rewards.exp })}
                </PixelText>
                <PixelText variant="body" color="gold" style={styles.rewardText}>
                  {t("quest.reward_gold", { gold: rewards.gold })}
                </PixelText>
              </Animated.View>
            )}
          </>
        )}

        {battleState === "failed" && (
          <View style={styles.centerContent}>
            <PixelText variant="heading" color="danger">
              {t("battle.defeat")}!
            </PixelText>
            <PixelText variant="body" color="cream" style={styles.failMessage}>
              {t("battle.time_up")}
            </PixelText>
            <PixelButton
              label={t("common.back")}
              variant="secondary"
              size="lg"
              onPress={onExitBattle}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>

      {/* Bottom Panel: Timer & Actions */}
      <PixelCard variant="default" style={styles.bottomPanel}>
        <View style={[styles.timerRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="label" color="cream">
            {t("battle.time_left")}:
          </PixelText>
          <PixelText
            variant="stat"
            color={timeRemaining <= 60 ? "danger" : "gold"}
          >
            {formatTime(timeRemaining)}
          </PixelText>
        </View>

        {battleState === "inProgress" && (
          <>
            <TouchableOpacity
              style={[styles.checkboxRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={onToggleQuestCompleted}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isQuestCompleted }}
              accessibilityLabel={t("battle.complete_checkbox")}
            >
              <View
                style={[
                  styles.checkbox,
                  isQuestCompleted && styles.checkboxChecked,
                ]}
              >
                {isQuestCompleted && (
                  <PixelText variant="label" color="gold">
                    ✓
                  </PixelText>
                )}
              </View>
              <PixelText variant="body" color="cream" style={styles.checkboxText}>
                {t("battle.complete_checkbox")}
              </PixelText>
            </TouchableOpacity>

            <PixelButton
              label={t("battle.finish_quest")}
              variant="primary"
              size="lg"
              onPress={onCompleteQuest}
              disabled={!isQuestCompleted || !isTimerRunning}
              style={styles.actionButton}
            />
            <PixelButton
              label={t("common.exit")}
              variant="ghost"
              size="md"
              onPress={onExitBattle}
              style={styles.actionButton}
            />
          </>
        )}
        {battleState === "completed" && (
          <PixelButton
            label={t("battle.view_results")}
            variant="primary"
            size="lg"
            onPress={onExitBattle} // Navigates to result screen, then back to camp
            style={styles.actionButton}
          />
        )}
      </PixelCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    justifyContent: "space-between",
    padding: SPACING.md,
  },
  questInfoCard: {
    marginBottom: SPACING.md,
  },
  questTitle: {
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  detailRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  battleArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    borderRadius: PIXEL_BORDER.borderRadius,
    overflow: "hidden",
  },
  centerContent: {
    alignItems: "center",
    padding: SPACING.md,
  },
  monsterContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  monsterEmoji: {
    fontSize: 100, // Large emoji size
    lineHeight: 120, // Adjust line height to center
    textAlign: "center",
  },
  rewardTextContainer: {
    position: "absolute",
    alignItems: "center",
    gap: SPACING.xs,
  },
  rewardText: {
    textAlign: "center",
  },
  failMessage: {
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  bottomPanel: {
    marginTop: SPACING.md,
  },
  timerRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  checkboxRow: {
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    backgroundColor: COLORS.bgCard,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: COLORS.buttonPrimary,
    borderColor: COLORS.gold,
  },
  checkboxText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
  },
  actionButton: {
    width: "100%",
    marginBottom: SPACING.sm,
  },
});
