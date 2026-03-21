import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { PixelText, PixelCard } from "@/components/ui";
import { t, getLang } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER, FONT_FAMILY_MAIN } from "@/constants/theme";
import type { Quest, Subject, Difficulty } from "@/types";
import { getMonster } from "@/constants/monsters";

type QuestCardProps = {
  quest: Quest;
  onPress: (questId: string) => void;
  isRTL: boolean;
  variant?: "default" | "highlighted";
};

function formatDeadline(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return t("common.invalid_date");
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export const QuestCard = React.memo(
  ({ quest, onPress, isRTL, variant = "default" }: QuestCardProps) => {
    const subjectColor = COLORS[quest.subject as keyof typeof COLORS] ?? COLORS.other;
    const difficultyColor = COLORS[quest.difficulty as keyof typeof COLORS] ?? COLORS.normal;
    const monster = getMonster(quest.subject, quest.difficulty);

    const statusColor =
      quest.status === "pending"
        ? COLORS.gold
        : quest.status === "inProgress"
          ? COLORS.info
          : COLORS.exp;

    return (
      <TouchableOpacity
        onPress={() => onPress(quest.id)}
        activeOpacity={0.7}
        accessibilityLabel={t("quest.card_accessibility", { title: quest.title })}
      >
        <PixelCard variant={variant} style={styles.card}>
          <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
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
            <View style={styles.spacer} />
            <PixelText variant="caption" color="gray">
              {t("quest.deadline")}: {formatDeadline(quest.deadlineDate, getLang())}
            </PixelText>
          </View>

          <PixelText variant="body" color="cream" style={styles.title}>
            {quest.title}
          </PixelText>

          <View style={[styles.footer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={styles.monsterInfo}>
              <Text style={styles.monsterEmoji}>{monster.emoji}</Text>
              <PixelText variant="label" color="gold">
                {t(monster.nameKey)}
              </PixelText>
            </View>
            <View style={styles.spacer} />
            <PixelText variant="label" style={{ color: statusColor }}>
              {t(`quest.status.${quest.status}`)}
            </PixelText>
          </View>
        </PixelCard>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.xs,
  },
  header: {
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
  spacer: {
    flex: 1,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  footer: {
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  monsterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  monsterEmoji: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY_MAIN,
  },
});

