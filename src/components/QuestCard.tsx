import { StyleSheet, View } from "react-native";
import { isQuestOverdue, daysUntilDeadline } from "@/src/lib/gameLogic";
import { PixelCard, PixelText, PixelButton } from "@/src/components/ui";
import { t, getLang } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import type { Quest, Subject, Difficulty } from "@/types";

export type QuestCardProps = {
  quest: Quest;
  onStartBattle: (questId: string) => void;
};

export function QuestCard({ quest, onStartBattle }: QuestCardProps) {
  const overdue = isQuestOverdue(quest.deadlineDate);
  const days = daysUntilDeadline(quest.deadlineDate);
  const subjectColor = COLORS[quest.subject as Subject] ?? COLORS.other;
  const difficultyColor = COLORS[quest.difficulty as Difficulty] ?? COLORS.normal;

  const deadlineLabel = overdue
    ? t("quest.overdue")
    : new Intl.DateTimeFormat(getLang(), { month: "numeric", day: "numeric" }).format(
        new Date(quest.deadlineDate),
      ) + (days > 0 ? ` (${days})` : "");

  return (
    <PixelCard
      variant={overdue ? "highlighted" : "default"}
      style={styles.card}
      accessibilityLabel={quest.title}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { borderColor: subjectColor }]}>
          <PixelText variant="caption" style={{ color: subjectColor }}>
            {t(`quest.subject.${quest.subject}`)}
          </PixelText>
        </View>
        <View style={[styles.badge, { borderColor: difficultyColor }]}>
          <PixelText variant="caption" style={{ color: difficultyColor }}>
            {t(`quest.difficulty.${quest.difficulty}`)}
          </PixelText>
        </View>
        <View style={styles.deadlineSpacer} />
        <PixelText variant="caption" color={overdue ? "danger" : "gray"}>
          {deadlineLabel}
        </PixelText>
      </View>

      <PixelText variant="body" color="cream" style={styles.title}>
        {quest.title}
      </PixelText>

      <View style={styles.footer}>
        <PixelText variant="caption" color="exp">
          {t("quest.reward_exp", { exp: quest.expReward })}
        </PixelText>
        <PixelText variant="caption" color="gold">
          {t("quest.reward_gold", { gold: quest.goldReward })}
        </PixelText>
        <View style={styles.battleBtnWrapper}>
          <PixelButton
            label={t("camp.startBattle")}
            variant="primary"
            size="sm"
            onPress={() => onStartBattle(quest.id)}
          />
        </View>
      </View>
    </PixelCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: PIXEL_BORDER.borderRadius,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  deadlineSpacer: {
    flex: 1,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  battleBtnWrapper: {
    marginLeft: "auto",
  },
});
