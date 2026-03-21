import React, { useRef, useEffect, useCallback } from "react";
import { View, Animated, StyleSheet, Text, Platform } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PIXEL_BORDER, FONT_FAMILY_MAIN, FONT_FAMILY_SUB, COLORS } from "@/constants/theme";
import { t } from "@/i18n"; // Import t for i18n

const FONT_FAMILY = Platform.select({
  ios: FONT_FAMILY_SUB,
  android: FONT_FAMILY_SUB,
  default: FONT_FAMILY_SUB,
});

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
  onMessageComplete?: () => void; // This prop is not used in the component
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
  const damageAnim = useRef(new Animated.Value(0)).current;

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
      damageAnim.setValue(1); // Show damage number
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
                  outputRange: [-40, 0],
                }),
              }],
            },
          ]}
        >
          {"💥"}
        </Animated.Text>

        {/* Hero (placeholder for now) */}
        <Animated.Text style={[styles.heroEmoji, { transform: [{ translateX: heroShakeAnim }] }]}>
          {"🧝"}
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
    padding: 16,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cream, // White flash
    zIndex: 10,
  },
  topPanel: {
    padding: 8,
    backgroundColor: COLORS.bgCard,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    marginBottom: 16,
  },
  battleField: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    position: "relative",
  },
  monsterEmoji: {
    fontSize: 80,
    textAlign: "center",
    fontFamily: FONT_FAMILY_MAIN, // Use main font for emojis if available, or a system emoji font
  },
  heroEmoji: {
    fontSize: 60,
    textAlign: "center",
    fontFamily: FONT_FAMILY_MAIN, // Use main font for emojis if available, or a system emoji font
  },
  damageText: {
    fontSize: 36,
    position: "absolute",
    top: "30%",
    color: COLORS.danger,
    fontWeight: "bold",
    fontFamily: FONT_FAMILY,
  },
  bottomPanel: {
    marginTop: 16,
  },
  heroStatusBox: {
    backgroundColor: COLORS.bgCard,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: 8,
    marginBottom: 8,
  },
  heroNameText: {
    color: COLORS.gold,
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    marginBottom: 4,
  },
  hpBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  hpBarLabel: {
    color: COLORS.cream,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    width: 40,
  },
  hpBar: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.darkGray,
    borderRadius: 2,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  hpFill: {
    height: "100%",
    borderRadius: 2,
  },
  monsterHpFill: {
    backgroundColor: COLORS.danger, // Red for monster HP
  },
  heroHpFill: {
    backgroundColor: COLORS.exp, // Green for hero HP
  },
  hpValue: {
    color: COLORS.cream,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    width: 60,
    textAlign: "right",
  },
  messageBox: {
    backgroundColor: COLORS.bgCard,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: 12,
    minHeight: 80,
    justifyContent: "center",
  },
  messageText: {
    color: COLORS.cream,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
  },
});

export default BattleScene;

