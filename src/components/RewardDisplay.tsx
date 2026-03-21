import React from "react";
import { View, StyleSheet } from "react-native";
import { PixelText, PixelCard, PixelProgressBar } from "@/components/ui"; // Added PixelProgressBar
import { t } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme";
import { expProgressInCurrentLevel } from "@/lib/expCalculator";
import type { HeroProfile } from "@/types";

type RewardDisplayProps = {
  hero: HeroProfile;
  expGained: number;
  goldGained: number;
  isRTL: boolean;
  monsterName: string;
  durationSeconds: number;
};

function formatStudyTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export const RewardDisplay = React.memo(
  ({
    hero,
    expGained,
    goldGained,
    isRTL,
    monsterName,
    durationSeconds,
  }: RewardDisplayProps) => {
    const expProgress = expProgressInCurrentLevel(hero.totalExp);
    // const expRatio = expProgress.required > 0 ? expProgress.current / expProgress.required : 0; // No longer needed directly

    return (
      <View style={[styles.container, { direction: isRTL ? "rtl" : "ltr" }]}>
        {/* Victory fanfare area */}
        <View style={styles.victoryArea}>
          <PixelText variant="title" color="gold" style={styles.victoryTitle}>
            {"🎉 "}{t("dq.result.defeated", { monster: monsterName })}
          </PixelText>
        </View>

        {/* Study time display */}
        {durationSeconds > 0 && (
          <PixelCard variant="default">
            <PixelText variant="label" color="cream" style={styles.cardTitle}>
              {t("dq.result.study_time")}
            </PixelText>
            <PixelText variant="title" color="gold" style={styles.studyTimeText}>
              {"📚 "}{formatStudyTime(durationSeconds)}
            </PixelText>
          </PixelCard>
        )}

        {/* Reward summary */}
        <PixelCard variant="default">
          <PixelText variant="label" color="cream" style={styles.cardTitle}>
            {t("dq.result.rewards")}
          </PixelText>
          <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="body" color="cream">
              {"✨ "}{t("hero.exp")}
            </PixelText>
            <PixelText variant="body" color="exp">
              {`+${expGained}`}
            </PixelText>
          </View>
          <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="body" color="cream">
              {"💰 "}{t("hero.gold")}
            </PixelText>
            <PixelText variant="body" color="gold">
              {`+${goldGained}`}
            </PixelText>
          </View>
        </PixelCard>

        {/* Hero growth: level + EXP bar */}
        <PixelCard variant="highlighted">
          <PixelText variant="label" color="cream" style={styles.cardTitle}>
            {t("dq.result.hero_growth")}
          </PixelText>
          <View style={[styles.heroRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <PixelText variant="body" color="gold" style={styles.heroLevelLabel}>
              {hero.displayName}
            </PixelText>
            <PixelText variant="body" color="cream" style={styles.heroLevelValue}>
              Lv.{hero.level}
            </PixelText>
          </View>
          <PixelProgressBar
            label="EXP"
            value={expProgress.current}
            max={expProgress.required}
            color="exp"
            showValues={true}
          />
        </PixelCard>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  victoryArea: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  victoryTitle: {
    textAlign: "center",
    textShadowColor: COLORS.goldDark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  cardTitle: {
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  studyTimeText: {
    textAlign: "center",
    fontSize: FONT_SIZES.title,
  },
  rewardRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  heroRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  heroLevelLabel: {
    fontSize: FONT_SIZES.lg,
  },
  heroLevelValue: {
    fontSize: FONT_SIZES.lg,
  },
  expBarRow: { // This style is no longer directly used for progress bars, but kept for other potential rows
    alignItems: "center",
    gap: SPACING.xs,
  },
  expBarLabel: { // This style is no longer directly used for progress bars, but kept for other potential rows
    fontSize: FONT_SIZES.sm,
    width: 32,
  },
  expBarContainer: { // This style is no longer directly used for progress bars, but kept for other potential rows
    flex: 1,
    height: 12,
    backgroundColor: COLORS.bgMid,
    borderRadius: PIXEL_BORDER.borderRadius,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.windowBorder,
  },
  expBarFill: { // This style is no longer directly used for progress bars, but kept for other potential rows
    height: "100%",
    backgroundColor: COLORS.exp,
    borderRadius: PIXEL_BORDER.borderRadius,
  },
  expBarValue: { // This style is no longer directly used for progress bars, but kept for other potential rows
    fontSize: FONT_SIZES.xs,
    width: 80,
    textAlign: "right",
  },
});
