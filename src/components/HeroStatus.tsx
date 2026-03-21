import React from "react";
import { View, StyleSheet } from "react-native";
import { PixelText, PixelCard, PixelProgressBar } from "@/components/ui";
import { t } from "@/i18n";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import { expProgressInCurrentLevel } from "@/lib/expCalculator";
import type { HeroProfile } from "@/types";

type HeroStatusProps = {
  hero: HeroProfile;
  isRTL: boolean;
  showExtendedStats?: boolean;
};

export const HeroStatus = React.memo(
  ({ hero, isRTL, showExtendedStats = false }: HeroStatusProps) => {
    const expProgress = expProgressInCurrentLevel(hero.totalExp);

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
        <PixelProgressBar
          label={t("hero.exp")}
          value={expProgress.current}
          max={expProgress.required}
          color="exp"
          showValues={true}
        />

        {/* HP bar */}
        <PixelProgressBar
          label={t("hero.hp")}
          value={hero.hp}
          max={hero.maxHp}
          color="danger"
          showValues={true}
        />

        {/* MP bar */}
        <PixelProgressBar
          label={t("hero.mp")}
          value={hero.mp}
          max={hero.maxMp}
          color="info"
          showValues={true}
        />

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
                {"✨ "}{t("hero.total_exp")}
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
});
