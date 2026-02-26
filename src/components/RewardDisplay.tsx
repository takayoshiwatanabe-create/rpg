import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View, Image } from "react-native";
import { PixelButton, PixelText } from '@/components/ui";
import { t } from "@/i18n";
import { COLORS, SPACING, PIXEL_BORDER, FONT_SIZES } from "@/constants/theme";
import type { HeroProfile, TextColor } from "@/types";
import {
  calculateLevelFromExp,
  expProgressInCurrentLevel,
  isAtMaxLevel,
} from '@/lib/expCalculator";
import { useReducedMotion } from '@/hooks/useReducedMotion";

export type RewardDisplayProps = {
  hero: HeroProfile;
  gainedExp: number;
  gainedGold: number;
  isOverdue: boolean;
  onComplete: () => void;
  isRTL: boolean;
};

/**
 * Displays the results of a battle, including gained EXP, gold,
 * and hero level-up animations.
 */
export function RewardDisplay({
  hero,
  gainedExp,
  gainedGold,
  isOverdue,
  onComplete,
  isRTL,
}: RewardDisplayProps) {
  const reducedMotion = useReducedMotion();

  const initialLevel = calculateLevelFromExp(hero.totalExp - gainedExp);
  const finalLevel = hero.level; // hero.level already reflects the updated totalExp
  const levelUpCount = finalLevel - initialLevel;

  const [currentExp, setCurrentExp] = useState(hero.totalExp - gainedExp);
  const [currentGold, setCurrentGold] = useState(hero.gold - gainedGold);
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  // Animations
  const expBarValue = useRef(new Animated.Value(0)).current;
  const goldValue = useRef(new Animated.Value(0)).current;
  const levelUpOpacity = useRef(new Animated.Value(0)).current;
  const rewardsOpacity = useRef(new Animated.Value(0)).current;

  const heroSprite = require("@/assets/hero_idle.png"); // Example hero sprite

  useEffect(() => {
    // Animate EXP gain
    if (!reducedMotion) {
      Animated.timing(expBarValue, {
        toValue: gainedExp,
        duration: 1500,
        useNativeDriver: false, // Must be false for width animation
      }).start(() => {
        setShowRewards(true);
        Animated.timing(rewardsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    } else {
      setCurrentExp(hero.totalExp);
      setCurrentGold(hero.gold);
      setShowRewards(true);
      rewardsOpacity.setValue(1);
    }

    // Animate gold gain
    if (!reducedMotion) {
      Animated.timing(goldValue, {
        toValue: gainedGold,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }
  }, [gainedExp, gainedGold, hero.totalExp, hero.gold, reducedMotion]);

  useEffect(() => {
    if (levelUpCount > 0 && showRewards && !reducedMotion) {
      setShowLevelUp(true);
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(levelUpOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(levelUpOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => setShowLevelUp(false));
    }
  }, [levelUpCount, showRewards, reducedMotion]);

  // Update current EXP/Gold for display during animation
  useEffect(() => {
    const listener = expBarValue.addListener(({ value }) => {
      setCurrentExp(hero.totalExp - gainedExp + Math.floor(value));
      setCurrentLevel(calculateLevelFromExp(hero.totalExp - gainedExp + Math.floor(value)));
    });
    const goldListener = goldValue.addListener(({ value }) => {
      setCurrentGold(hero.gold - gainedGold + Math.floor(value));
    });
    return () => {
      expBarValue.removeListener(listener);
      goldValue.removeListener(goldListener);
    };
  }, [expBarValue, goldValue, hero.totalExp, gainedExp, hero.gold, gainedGold]);

  const expProgress = expProgressInCurrentLevel(currentExp);
  const atMax = isAtMaxLevel(currentLevel);

  return (
    <View style={styles.container}>
      <PixelText variant="title" color="gold" style={styles.title}>
        {t("result.title")}
      </PixelText>

      {isOverdue && (
        <PixelCard variant="highlighted" style={styles.overdueCard}>
          <PixelText variant="body" color="danger" style={styles.overdueText}>
            {t("quest.overdue_penalty")}
          </PixelText>
        </PixelCard>
      )}

      <PixelCard variant="default" style={styles.heroStatusCard}>
        <View style={[styles.heroHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Image
            source={heroSprite}
            style={styles.heroSprite}
            resizeMode="contain"
            accessibilityLabel={t("hero.label")}
          />
          <View style={styles.heroInfo}>
            <PixelText variant="heading" color="cream">
              {hero.displayName}
            </PixelText>
            <View style={[styles.levelRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <PixelText variant="label" color="cream">
                {t("hero.level")}:
              </PixelText>
              <PixelText variant="stat" color="gold">
                {currentLevel}
              </PixelText>
            </View>
          </View>
        </View>

        <View style={styles.progressBarWrapper}>
          <PixelText variant="label" color="cream" style={styles.progressLabel}>
            {t("hero.exp")}
          </PixelText>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: expBarValue.interpolate({
                    inputRange: [0, gainedExp],
                    outputRange: [
                      `${
                        (expProgressInCurrentLevel(hero.totalExp - gainedExp)
                          .current /
                          (expProgressInCurrentLevel(hero.totalExp - gainedExp)
                            .required || 1)) *
                        100
                      }%`,
                      `${
                        (expProgressInCurrentLevel(hero.totalExp).current /
                          (expProgressInCurrentLevel(hero.totalExp).required ||
                            1)) *
                        100
                      }%`,
                    ],
                    extrapolate: "clamp",
                  }),
                  backgroundColor: COLORS.exp,
                },
              ]}
            />
            <PixelText variant="caption" color="cream" style={styles.progressText}>
              {atMax
                ? t("hero.max_level")
                : `${expProgress.current}/${expProgress.required}`}
            </PixelText>
          </View>
        </View>

        <View style={[styles.rewardSummary, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={styles.rewardItem}>
            <PixelText variant="label" color="exp">
              {t("hero.exp")}
            </PixelText>
            <PixelText variant="stat" color="exp">
              +{gainedExp}
            </PixelText>
          </View>
          <View style={styles.rewardItem}>
            <PixelText variant="label" color="gold">
              {t("hero.gold")}
            </PixelText>
            <PixelText variant="stat" color="gold">
              +{gainedGold}
            </PixelText>
          </View>
        </View>
      </PixelCard>

      {showLevelUp && (
        <Animated.View style={[styles.levelUpOverlay, { opacity: levelUpOpacity }]}>
          <PixelText variant="title" color="gold" style={styles.levelUpText}>
            {t("result.level_up")}!
          </PixelText>
          <PixelText variant="heading" color="cream" style={styles.levelUpText}>
            {t("result.new_level", { level: finalLevel })}
          </PixelText>
        </Animated.View>
      )}

      {showRewards && (
        <Animated.View style={[styles.actions, { opacity: rewardsOpacity }]}>
          <PixelButton
            label={t("result.return_to_camp")}
            variant="primary"
            size="lg"
            onPress={onComplete}
            style={styles.actionButton}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    justifyContent: "center",
    padding: SPACING.md,
  },
  title: {
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  overdueCard: {
    marginBottom: SPACING.md,
  },
  overdueText: {
    textAlign: "center",
  },
  heroStatusCard: {
    marginBottom: SPACING.lg,
  },
  heroHeader: {
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  heroSprite: {
    width: 64,
    height: 64,
  },
  heroInfo: {
    flex: 1,
    justifyContent: "center",
  },
  levelRow: {
    alignItems: "center",
    gap: SPACING.xs,
  },
  progressBarWrapper: {
    marginBottom: SPACING.md,
  },
  progressLabel: {
    marginBottom: SPACING.xs,
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    borderRadius: PIXEL_BORDER.borderRadius,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressBarFill: {
    height: "100%",
    position: "absolute",
    left: 0,
  },
  progressText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: COLORS.cream,
    fontSize: FONT_SIZES.xs,
  },
  rewardSummary: {
    justifyContent: "space-around",
    marginTop: SPACING.md,
  },
  rewardItem: {
    alignItems: "center",
  },
  levelUpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  levelUpText: {
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  actions: {
    marginTop: SPACING.md,
    alignItems: "center",
  },
  actionButton: {
    width: "100%",
  },
});
