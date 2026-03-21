import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { COLORS, SPACING, PIXEL_BORDER, FONT_SIZES } from "@/constants/theme";
import { PixelText } from "./PixelText";
import type { TextColor } from "@/types";

export type PixelProgressBarProps = {
  value: number;
  max: number;
  color: TextColor;
  label?: string;
  showValues?: boolean;
};

/**
 * A pixel-art style progress bar component.
 * Animates its fill when the `value` prop changes.
 */
export function PixelProgressBar({
  value,
  max,
  color,
  label,
  showValues = true,
}: PixelProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    const progress = max > 0 ? value / max : 0;
    const prevProgress = max > 0 ? prevValue.current / max : 0;

    // Only animate if the value has actually changed
    if (value !== prevValue.current) {
      animatedWidth.setValue(prevProgress); // Start from the previous progress
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 500, // Animation duration
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // Must be false for width animation
      }).start();
    } else {
      // If value hasn't changed, set it instantly without animation
      animatedWidth.setValue(progress);
    }

    prevValue.current = value; // Update previous value for next render
  }, [value, max, animatedWidth]);

  const barWidth = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {label && (
        <PixelText variant="label" color="cream" style={styles.label}>
          {label}
        </PixelText>
      )}
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { backgroundColor: (COLORS as Record<string, string>)[color] ?? COLORS.gold, width: barWidth },
          ]}
        />
        {showValues && (
          <PixelText variant="caption" color="cream" style={styles.valueText}>
            {value}/{max}
          </PixelText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: SPACING.xs,
  },
  progressBar: {
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
  valueText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: COLORS.cream,
    fontSize: FONT_SIZES.xs,
  },
});
