import React, { useRef, useEffect, useCallback } from "react";
import { View, Animated, StyleSheet, Text, Platform } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PIXEL_BORDER, FONT_FAMILY_MAIN, FONT_FAMILY_SUB, COLORS, FONT_SIZES, SPACING } from "@/constants/theme";
import { t } from "@/i18n";

const FONT_FAMILY = Platform.select({
  ios: FONT_FAMILY_MAIN,
  android: FONT_FAMILY_MAIN,
  default: FONT_FAMILY_MAIN,
});

interface BattleSceneProps {
  heroSprite: React.ReactNode;
  monsterSprite: React.ReactNode;
  heroHp: number;
  heroMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  message: string;
  showAttackFlash?: boolean;
}

const BattleScene: React.FC<BattleSceneProps> = ({
  heroSprite,
  monsterSprite,
  heroHp,
  heroMaxHp,
  monsterHp,
  monsterMaxHp,
  message,
  showAttackFlash = false,
}) => {
  const reducedMotion = useReducedMotion();

  const heroShakeAnim = useRef(new Animated.Value(0)).current;
  const monsterShakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(
    (thing: Animated.Value) => {
      if (reducedMotion) {
        thing.setValue(0);
        return;
      }
      thing.setValue(0);
      Animated.sequence([
        Animated.timing(thing, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(thing, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(thing, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(thing, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    },
    [reducedMotion],
  );

  const flash = useCallback(() => {
    if (reducedMotion) {
      flashAnim.setValue(0);
      return;
    }
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion]);

  useEffect(() => {
    if (showAttackFlash) {
      flash();
    }
  }, [showAttackFlash, flash]);

  // Example usage: shake hero when heroHp changes (simulating damage)
  // This is a placeholder; actual shake triggers would come from battle logic
  useEffect(() => {
    // if (prevHeroHp.current > heroHp) {
    //   shake(heroShakeAnim);
    // }
    // prevHeroHp.current = heroHp;
  }, [heroHp, shake, heroShakeAnim]);

  const heroAnimatedStyle = {
    transform: [{ translateX: heroShakeAnim }],
  };

  const monsterAnimatedStyle = {
    transform: [{ translateX: monsterShakeAnim }],
  };

  const flashOpacity = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  return (
    <View style={styles.container}>
      {showAttackFlash && (
        <Animated.View style={[styles.flashOverlay, { opacity: flashOpacity }]} />
      )}

      <View style={styles.topPanel}>
        <View style={styles.hpBarContainer}>
          <Text style={styles.hpBarLabel}>{t("battle.hero_hp")}</Text>
          <View style={styles.hpBarWrapper}>
            <View style={[styles.hpBarBackground, { width: "100%" }]} />
            <View
              style={[
                styles.hpBarFill,
                styles.heroHpBarFill,
                { width: `${(heroHp / heroMaxHp) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.hpValue}>
            {heroHp}/{heroMaxHp}
          </Text>
        </View>
        <View style={styles.hpBarContainer}>
          <Text style={styles.hpBarLabel}>{t("battle.monster_hp")}</Text>
          <View style={styles.hpBarWrapper}>
            <View style={[styles.hpBarBackground, { width: "100%" }]} />
            <View
              style={[
                styles.hpBarFill,
                styles.monsterHpBarFill,
                { width: `${(monsterHp / monsterMaxHp) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.hpValue}>
            {monsterHp}/{monsterMaxHp}
          </Text>
        </View>
      </View>

      <View style={styles.battleArea}>
        <Animated.View style={[styles.heroSpriteContainer, heroAnimatedStyle]}>
          {heroSprite}
        </Animated.View>
        <Animated.View style={[styles.monsterSpriteContainer, monsterAnimatedStyle]}>
          {monsterSprite}
        </Animated.View>
      </View>

      <View style={styles.messageBox}>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.battleBackground,
    padding: SPACING.md,
    ...PIXEL_BORDER,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
  topPanel: {
    flexDirection: "column",
    marginBottom: SPACING.md,
  },
  hpBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xxs,
  },
  hpBarLabel: {
    color: COLORS.textDefault,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY,
    width: 40,
    textAlign: "right",
    marginRight: SPACING.xxs,
  },
  hpBarWrapper: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.darkGray,
    ...PIXEL_BORDER,
    position: "relative",
  },
  hpBarBackground: {
    position: "absolute",
    height: "100%",
    backgroundColor: COLORS.darkGray,
  },
  hpBarFill: {
    position: "absolute",
    height: "100%",
    left: 0,
  },
  heroHpBarFill: {
    backgroundColor: COLORS.exp,
  },
  monsterHpBarFill: {
    backgroundColor: COLORS.danger,
  },
  hpValue: {
    color: COLORS.textDefault,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONT_FAMILY,
    width: 60,
    textAlign: "right",
    marginLeft: SPACING.xxs,
  },
  battleArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: SPACING.lg,
  },
  heroSpriteContainer: {
    // Styles for hero sprite positioning
  },
  monsterSpriteContainer: {
    // Styles for monster sprite positioning
  },
  messageBox: {
    backgroundColor: COLORS.windowBackground,
    ...PIXEL_BORDER,
    padding: SPACING.sm,
    minHeight: 60,
    justifyContent: "center",
  },
  messageText: {
    color: COLORS.textDefault,
    fontSize: FONT_SIZES.body,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
  },
});

export default BattleScene;
