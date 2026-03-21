import React, { useRef, useEffect, useCallback } from "react";
import { View, Animated, StyleSheet, Text, Platform } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PIXEL_BORDER, FONT_FAMILY_MAIN, FONT_FAMILY_SUB, COLORS, FONT_SIZES, SPACING } from "@/constants/theme"; // Added SPACING
import { t } from "@/i18n"; // Import t for i18n

// FONT_FAMILY_SUB is used for general text, FONT_FAMILY_MAIN for titles/emojis
const FONT_FAMILY = FONT_FAMILY_SUB;

interface BattleSceneProps {
  monsterEmoji: string;
  monsterName: string;
  heroName: string;
  heroHp: number;
  heroMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  message: string;
  showAttackFlash?: boolean;
  // onMessageComplete?: () => void; // This prop is not used in the component
}

const BattleScene: React.FC<BattleSceneProps> = ({
  monsterEmoji,
  monsterName,
  heroName,
  heroHp,
  heroMaxHp,
  monsterHp,
  monsterMaxHp,
  message,
  showAttackFlash = false,
  // onMessageComplete, // Removed unused prop
}) => {
  const reducedMotion = useReducedMotion();

  // Animations
  const monsterShakeAnim = useRef(new Animated.Value(0)).current;
  const heroShakeAnim = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const damageAnim = useRef(new Animated.Value(0)).current; // For damage text animation

  const shake = useCallback(
    (targetAnim: Animated.Value) => {
      if (reducedMotion) {
        targetAnim.setValue(0);
        return;
      }
      Animated.sequence([
        Animated.timing(targetAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(targetAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(targetAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(targetAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(targetAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (showAttackFlash && !reducedMotion) {
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue: 0.6, duration: 60, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      shake(monsterShakeAnim); // Monster shakes when attacked
      damageAnim.setValue(1); // Start damage animation from 1 (visible)
      Animated.timing(damageAnim, { toValue: 0, duration: 1500, useNativeDriver: true }).start();
    } else if (reducedMotion) {
      flashOpacity.setValue(0);
      damageAnim.setValue(0);
    }
  }, [showAttackFlash, flashOpacity, monsterShakeAnim, damageAnim, shake, reducedMotion]);

  const monsterHpRatio = monsterMaxHp > 0 ? monsterHp / monsterMaxHp : 0;
  const heroHpRatio = heroMaxHp > 0 ? heroHp / heroMaxHp : 0;

  return (
    <View style={styles.container}>
      {/* Attack flash overlay */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {/* Top UI: Monster HP Bar */}
      <View style={styles.topPanel}>
        <View style={styles.hpBarContainer}>
          <Text style={styles.hpBarLabel}>{monsterName}</Text>
          <View style={styles.hpBar}>
            <View style={[styles.hpFill, styles.monsterHpFill, { width: `${monsterHpRatio * 100}%` }]} />
          </View>
          <Text style={styles.hpValue}>{monsterHp}/{monsterMaxHp}</Text>
        </View>
      </View>

      {/* Battle Field: Monster & Hero */}
      <View style={styles.battleField}>
        {/* Monster */}
        <Animated.Text style={[styles.monsterEmoji, { transform: [{ translateX: monsterShakeAnim }] }]}>
          {monsterEmoji}
        </Animated.Text>
        {/* Damage number floating up */}
        <Animated.Text
          style={[
            styles.damageText,
            {
              opacity: damageAnim,
              transform: [{
                translateY: damageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-40, 0], // Floats up by 40px
                }),
              }],
            },
          ]}
        >
          {"💥"} {/* Placeholder for damage effect */}
        </Animated.Text>

        {/* Hero (placeholder for now) */}
        <Animated.Text style={[styles.heroEmoji, { transform: [{ translateX: heroShakeAnim }] }]}>
          {"🧝"} {/* Placeholder hero emoji */}
        </Animated.Text>
      </View>

      {/* Bottom UI: Hero Status & Message Box */}
      <View style={styles.bottomPanel}>
        <View style={styles.heroStatusBox}>
          <Text style={styles.heroNameText}>{heroName}</Text>
          <View style={styles.hpBarContainer}>
            <Text style={styles.hpBarLabel}>{t("hero.hp")}</Text>
            <View style={styles.hpBar}>
              <View style={[styles.hpFill, styles.heroHpFill, { width: `${heroHpRatio * 100}%` }]} />
            </View>
            <Text style={styles.hpValue}>{heroHp}/{heroMaxHp}</Text>
          </View>
          {/* Add MP, EXP, etc. here later */}
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark, // Dark background for battle
    justifyContent: "space-between",
    padding: SPACING.md, // Use SPACING.md for consistent padding
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cream, // White flash
    zIndex: 10,
  },
  topPanel: {
    padding: SPACING.sm, // Use SPACING.sm
    backgroundColor: COLORS.bgCard,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    marginBottom: SPACING.md, // Use SPACING.md
  },
  battleField: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    position: "relative",
  },
  monsterEmoji: {
    fontSize: FONT_SIZES.xxl, // Use a larger font size for monster emoji
    textAlign: "center",
    fontFamily: FONT_FAMILY_MAIN, // Use main font for emojis
  },
  heroEmoji: {
    fontSize: FONT_SIZES.xl, // Use a slightly smaller font size for hero emoji
    textAlign: "center",
    fontFamily: FONT_FAMILY_MAIN, // Use main font for emojis
  },
  damageText: {
    fontSize: FONT_SIZES.heading, // Use FONT_SIZES.heading
    position: "absolute",
    top: "30%", // Position relative to monster
    color: COLORS.danger,
    fontWeight: "bold",
    fontFamily: FONT_FAMILY,
    textShadowColor: COLORS.shadow, // Add text shadow for pixel art feel
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  bottomPanel: {
    marginTop: SPACING.md, // Use SPACING.md
  },
  heroStatusBox: {
    backgroundColor: COLORS.bgCard,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: SPACING.sm, // Use SPACING.sm
    marginBottom: SPACING.xs, // Use SPACING.xs
  },
  heroNameText: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.lg, // Use FONT_SIZES.lg
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    marginBottom: SPACING.xxs, // Use SPACING.xxs
  },
  hpBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xxs, // Use SPACING.xxs
  },
  hpBarLabel: {
    color: COLORS.cream,
    fontSize: FONT_SIZES.sm, // Use FONT_SIZES.sm
    fontFamily: FONT_FAMILY,
    width: 40, // Fixed width for label
  },
  hpBar: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.darkGray,
    borderRadius: PIXEL_BORDER.borderRadius, // Use PIXEL_BORDER.borderRadius
    overflow: "hidden",
    marginHorizontal: SPACING.xs, // Use SPACING.xs
    borderWidth: 1, // Add border to HP bar
    borderColor: COLORS.gray, // Border color for HP bar
  },
  hpFill: {
    height: "100%",
    borderRadius: PIXEL_BORDER.borderRadius, // Use PIXEL_BORDER.borderRadius
  },
  monsterHpFill: {
    backgroundColor: COLORS.danger, // Red for monster HP
  },
  heroHpFill: {
    backgroundColor: COLORS.exp, // Green for hero HP
  },
  hpValue: {
    color: COLORS.cream,
    fontSize: FONT_SIZES.caption, // Use FONT_SIZES.caption
    fontFamily: FONT_FAMILY,
    width: 60, // Fixed width for HP value
    textAlign: "right",
  },
  messageBox: {
    backgroundColor: COLORS.bgCard,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: SPACING.md, // Use SPACING.md
    minHeight: 80,
    justifyContent: "center",
  },
  messageText: {
    color: COLORS.cream,
    fontSize: FONT_SIZES.body, // Use FONT_SIZES.body
    fontFamily: FONT_FAMILY,
    textAlign: "center",
  },
});

export default BattleScene;
