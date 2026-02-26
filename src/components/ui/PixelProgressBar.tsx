import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { COLORS, PIXEL_BORDER, SPACING } from "@/constants/theme";
import { useReducedMotion } from "@/src/hooks/useReducedMotion";
import { PixelText } from "./PixelText";

export type BarColor = "hp" | "mp" | "exp" | "gold";

export type PixelProgressBarProps = {
  value: number;
  max: number;
  color?: BarColor;
  /** Optional label rendered above the bar on the left side. */
  label?: string;
  /** When true, renders "value / max" above the bar on the right side. */
  showValues?: boolean;
};

type BarConfig = { fill: string; track: string };

const BAR_CONFIG: Record<BarColor, BarConfig> = {
  hp: { fill: COLORS.hp, track: COLORS.hpBg },
  mp: { fill: COLORS.mp, track: COLORS.mpBg },
  exp: { fill: COLORS.exp, track: COLORS.expBg },
  gold: { fill: COLORS.gold, track: COLORS.goldDark },
};

/**
 * Animated 8-bit style progress bar used for HP, MP, EXP, and Gold.
 *
 * The fill animates with `Animated.timing` (600 ms). When the system
 * "Reduce Motion" setting is enabled the width updates instantly.
 *
 * Width is driven via percentage interpolation so the bar adapts to any
 * container width without requiring `onLayout`.
 */
export function PixelProgressBar({
  value,
  max,
  color = "hp",
  label,
  showValues = false,
}: PixelProgressBarProps) {
  const percentage = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const animatedPercent = useRef(new Animated.Value(percentage)).current;
  const reducedMotion = useReducedMotion();
  const config = BAR_CONFIG[color];

  useEffect(() => {
    if (reducedMotion) {
      animatedPercent.setValue(percentage);
      return;
    }
    Animated.timing(animatedPercent, {
      toValue: percentage,
      duration: 600,
      // Must be false: width is a layout property, not supported by the
      // native animation driver.
      useNativeDriver: false,
    }).start();
  }, [percentage, reducedMotion, animatedPercent]);

  const fillWidth = animatedPercent.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const showHeader = label !== undefined || showValues;

  return (
    <View>
      {showHeader && (
        <View style={styles.header}>
          {label !== undefined && (
            <PixelText variant="label" color="cream">
              {label}
            </PixelText>
          )}
          {showValues && (
            <PixelText variant="label" color="gray">
              {value}/{max}
            </PixelText>
          )}
        </View>
      )}
      <View
        style={[styles.track, { backgroundColor: config.track }]}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(percentage * 100),
        }}
      >
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: config.fill, width: fillWidth },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  track: {
    height: 12,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    borderRadius: PIXEL_BORDER.borderRadius,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});

