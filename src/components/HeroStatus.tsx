import React from "react";
import { View, StyleSheet } from "react-native"; // Removed Platform import as FONT_FAMILY is now from theme
import { PixelText, PixelCard } from "@/components/ui";
import { t } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES, PIXEL_BORDER } from "@/constants/theme"; // FONT_FAMILY is no longer needed here as PixelText handles it
import { expProgressInCurrentLevel } from "@/lib/expCalculator";
import type { HeroProfile } from "@/types";

// FONT_FAMILY is now handled by PixelText internally based on theme.ts

type HeroStatusProps = {
  hero: HeroProfile;
  isRTL: boolean;
  showExtendedStats?: boolean;
};

export const HeroStatus = React.memo(
  ({ hero, isRTL, showExtendedStats = false }: HeroStatusProps) => {
    const expProgress = expProgressInCurrentLevel(hero.totalExp);
    const expRatio = expProgress.required > 0 ? expProgress.current / expProgress.required : 0;

    return (
      <PixelCard variant="default">
        {/* Name + Level */}
        <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="heading" color="gold" style={styles.heroName}>
            {hero.displayName}
          </PixelText>
          <PixelText variant="heading" color="cream" style={styles.levelText}>
            Lv.{hero.level}
          </PixelText>
        </View>

        {/* EXP bar */}
        <View style={[styles.barRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="label" color="exp" style={styles.barLabel}>
            EXP
          </PixelText>
          <View style={styles.barContainer}>
            <View style={[styles.bar, styles.barExp, { flex: expRatio || 0.01 }]} />
            <View style={{ flex: 1 - (expRatio || 0.01) }} />
          </View>
          <PixelText variant="caption" color="gray" style={styles.barValue}>
            {expProgress.current}/{expProgress.required}
          </PixelText>
        </View>

        {/* HP bar */}
        <View style={[styles.barRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="label" color="danger" style={styles.barLabel}>
            HP
          </PixelText>
          <View style={styles.barContainer}>
            <View style={[styles.bar, styles.barHp, { flex: hero.hp / hero.maxHp }]} />
            <View style={{ flex: 1 - hero.hp / hero.maxHp }} />
          </View>
          <PixelText variant="caption" color="gray" style={styles.barValue}>
            {hero.hp}/{hero.maxHp}
          </PixelText>
        </View>

        {/* MP bar */}
        <View style={[styles.barRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="label" color="info" style={styles.barLabel}>
            MP
          </PixelText>
          <View style={styles.barContainer}>
            <View style={[styles.bar, styles.barMp, { flex: hero.mp / hero.maxMp }]} />
            <View style={{ flex: 1 - hero.mp / hero.maxMp }} />
          </View>
          <PixelText variant="caption" color="gray" style={styles.barValue}>
            {hero.mp}/{hero.maxMp}
          </PixelText>
        </View>

        {/* Gold */}
        <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="body" color="cream" style={styles.statusLabel}>
            {"💰 "}{t("hero.gold")}
          </PixelText>
          <PixelText variant="body" color="gold" style={styles.goldValue}>
            {hero.gold.toLocaleString()} G
          </PixelText>
        </View>

        {showExtendedStats && (
          <>
            <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="body" color="cream" style={styles.statusLabel}>
                {"⚔️ "}{t("hero.attack")}
              </PixelText>
              <PixelText variant="body" color="cream" style={styles.statusValue}>
                {hero.attack}
              </PixelText>
            </View>
            <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="body" color="cream" style={styles.statusLabel}>
                {"🛡 "}{t("hero.defense")}
              </PixelText>
              <PixelText variant="body" color="cream" style={styles.statusValue}>
                {hero.defense}
              </PixelText>
            </View>
            <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="body" color="cream" style={styles.statusLabel}>
                {"✨ "}{t("hero.exp")}
              </PixelText>
              <PixelText variant="body" color="cream" style={styles.statusValue}>
                {hero.totalExp}
              </PixelText>
            </View>
          </>
        )}
      </PixelCard>
    );
  },
);

const styles = StyleSheet.create({
  statusRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  heroName: {
    fontSize: FONT_SIZES.xl,
  },
  levelText: {
    fontSize: FONT_SIZES.xl,
  },
  statusLabel: {
    fontSize: FONT_SIZES.lg,
  },
  statusValue: {
    fontSize: FONT_SIZES.lg,
  },
  goldValue: {
    fontSize: FONT_SIZES.lg,
  },
  barRow: {
    alignItems: "center",
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  barLabel: {
    fontSize: FONT_SIZES.sm,
    width: 32,
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.bgMid,
    borderRadius: PIXEL_BORDER.borderRadius,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.windowBorder,
  },
  bar: {
    height: "100%",
    borderRadius: PIXEL_BORDER.borderRadius,
  },
  barHp: {
    backgroundColor: COLORS.danger,
  },
  barMp: {
    backgroundColor: COLORS.info,
  },
  barExp: {
    backgroundColor: COLORS.exp,
  },
  barValue: {
    fontSize: FONT_SIZES.xs,
    width: 80,
    textAlign: "right",
  },
});
