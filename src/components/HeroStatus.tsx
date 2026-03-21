import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { PixelText } from "./ui/PixelText";
import { PixelProgressBar } from "./ui/PixelProgressBar";
import { Hero } from "@/types";
import { PIXEL_BORDER, SPACING, COLORS } from "@/constants/theme";
import { t } from "@/i18n";
import { useIsRTL } from "@/hooks/useIsRTL";

interface HeroStatusProps {
  hero: Hero;
  showExtendedStats?: boolean;
}

export const HeroStatus: React.FC<HeroStatusProps> = ({ hero, showExtendedStats = false }) => {
  const isRTL = useIsRTL();

  return (
    <View style={[styles.container, { direction: isRTL ? "rtl" : "ltr" }]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.heroInfo}>
          <PixelText variant="heading" color="gold" style={styles.heroName}>
            {hero.displayName}
          </PixelText>
          <PixelText variant="heading" color="textDefault" style={styles.levelText}>
            Lv.{hero.level}
          </PixelText>
        </View>
        {/* Placeholder for hero avatar/sprite */}
        <View style={styles.avatarPlaceholder} />
      </View>

      <View style={styles.statsContainer}>
        {/* HP Bar */}
        <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
            {"❤️ "}{t("hero.hp_label")}
          </PixelText>
          <PixelProgressBar
            value={hero.currentHp}
            max={hero.maxHp}
            color="hp"
            height={12}
            showValues={true}
            style={styles.progressBar}
          />
        </View>

        {/* EXP Bar */}
        <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
            {"✨ "}{t("hero.exp_label")}
          </PixelText>
          <PixelProgressBar
            value={hero.currentExp}
            max={hero.nextLevelExp}
            color="exp"
            height={12}
            showValues={true}
            style={styles.progressBar}
          />
        </View>

        {/* Gold */}
        <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
            {"💰 "}{t("hero.gold_label")}
          </PixelText>
          <PixelText variant="body" color="gold" style={styles.goldValue}>
            {hero.gold.toLocaleString()} G
          </PixelText>
        </View>
        {showExtendedStats && (
          <>
            <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
                {"⚔️ "}{t("hero.attack_label")}
              </PixelText>
              <PixelText variant="body" color="textDefault" style={styles.statusValue}>
                {hero.attack}
              </PixelText>
            </View>
            <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
                {"🛡 "}{t("hero.defense_label")}
              </PixelText>
              <PixelText variant="body" color="textDefault" style={styles.statusValue}>
                {hero.defense}
              </PixelText>
            </View>
            <View style={[styles.statusRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="body" color="textDefault" style={styles.statusLabel}>
                {"✨ "}{t("hero.total_exp_label")}
              </PixelText>
              <PixelText variant="body" color="textDefault" style={styles.statusValue}>
                {hero.totalExp}
              </PixelText>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.windowBackground,
    ...PIXEL_BORDER,
    padding: SPACING.md,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderBottomWidth: PIXEL_BORDER.borderWidth,
    borderBottomColor: COLORS.darkGray,
    paddingBottom: SPACING.sm,
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 24,
    marginBottom: SPACING.xxs,
  },
  levelText: {
    fontSize: 18,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.gray,
    ...PIXEL_BORDER,
    marginLeft: SPACING.md,
  },
  statsContainer: {
    marginTop: SPACING.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  statusLabel: {
    width: 80, // Fixed width for labels
    marginRight: SPACING.sm,
    textAlign: Platform.select({
      ios: "left",
      android: "left",
      default: "left",
    }),
  },
  statusValue: {
    flex: 1,
    textAlign: Platform.select({
      ios: "right",
      android: "right",
      default: "right",
    }),
  },
  goldValue: {
    flex: 1,
    textAlign: Platform.select({
      ios: "right",
      android: "right",
      default: "right",
    }),
  },
  progressBar: {
    flex: 1,
  },
});
