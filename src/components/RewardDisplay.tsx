import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { t } from "@/i18n";
import { COLORS, FONT_FAMILY_MAIN, FONT_SIZES, PIXEL_BORDER, SPACING } from "@/constants/theme";
import { PixelText } from "./ui/PixelText";

interface RewardDisplayProps {
  exp: number;
  gold: number;
  isRTL: boolean;
}

const FONT_FAMILY = Platform.select({
  ios: FONT_FAMILY_MAIN,
  android: FONT_FAMILY_MAIN,
  default: FONT_FAMILY_MAIN,
});

const RewardDisplay: React.FC<RewardDisplayProps> = ({ exp, gold, isRTL }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="body" color="textDefault" style={styles.rewardLabel} accessibilityLabel={t("hero.exp_label")}>
          {"✨ "}{t("hero.exp_label")}
        </PixelText>
        <PixelText variant="body" color="textDefault" style={styles.rewardValue}>{`+${exp}`}</PixelText>
      </View>
      <View style={[styles.rewardRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <PixelText variant="body" color="textDefault" style={styles.rewardLabel} accessibilityLabel={t("hero.gold_label")}>
          {"💰 "}{t("hero.gold_label")}
        </PixelText>
        <PixelText variant="body" color="gold" style={styles.rewardGold}>{`+${gold}`}</PixelText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: COLORS.windowBackground,
    ...PIXEL_BORDER,
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  rewardLabel: {
    fontSize: FONT_SIZES.body,
  },
  rewardValue: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
  rewardGold: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
});

export default RewardDisplay;
