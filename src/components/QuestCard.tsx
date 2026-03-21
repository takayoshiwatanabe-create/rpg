import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Quest } from "@/types";
import { PixelText } from "./ui/PixelText";
import { PIXEL_BORDER, SPACING, COLORS } from "@/constants/theme";
import { t } from "@/i18n";
import { useIsRTL } from "@/hooks/useIsRTL";
import { getMonsterInfo } from "@/constants/monsters"; // Import getMonsterInfo

interface QuestCardProps {
  quest: Quest;
  onPress: (questId: string) => void;
  isCompleted?: boolean;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onPress, isCompleted = false }) => {
  const isRTL = useIsRTL();
  const monsterInfo = getMonsterInfo(quest.subject, quest.difficulty); // Get monster info

  const handlePress = () => {
    if (!isCompleted) {
      onPress(quest.id);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.card, isCompleted && styles.completedCard]}
      disabled={isCompleted}
      accessibilityLabel={`${quest.title}, ${t(`difficulty.${quest.difficulty}`)}`}
      accessibilityHint={isCompleted ? t("quest.completed_hint") : t("quest.start_hint")}
    >
      <View style={[styles.content, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.iconContainer}>
          <PixelText variant="heading" color="textDefault" style={styles.icon}>
            {monsterInfo?.emoji || "❓"}
          </PixelText>
        </View>
        <View style={styles.textContainer}>
          <View style={[styles.difficultyRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="caption" color="gray" style={styles.difficulty}>
              {t(`difficulty.${quest.difficulty}`)}
            </PixelText>
            {isCompleted && (
              <PixelText variant="caption" color="success" style={styles.completedText}>
                {t("quest.completed")}
              </PixelText>
            )}
          </View>

          <PixelText variant="body" color="textDefault" style={styles.title}>
            {quest.title}
          </PixelText>

          <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="caption" color="textDefault">
              {"✨ "}{quest.expReward}
            </PixelText>
            <PixelText variant="caption" color="gold">
              {"💰 "}{quest.goldReward}
            </PixelText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    ...PIXEL_BORDER,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    width: "100%",
  },
  completedCard: {
    opacity: 0.6,
    borderColor: COLORS.success,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.darkGray,
    ...PIXEL_BORDER,
    marginRight: SPACING.sm,
  },
  icon: {
    fontSize: 32,
    lineHeight: Platform.select({
      ios: 38,
      android: 38,
      default: 38,
    }),
  },
  textContainer: {
    flex: 1,
  },
  difficultyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xxs,
  },
  difficulty: {
    textTransform: "uppercase",
  },
  completedText: {
    marginLeft: SPACING.sm,
  },
  title: {
    fontSize: 18,
    marginBottom: SPACING.xs,
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: SPACING.md,
  },
});
