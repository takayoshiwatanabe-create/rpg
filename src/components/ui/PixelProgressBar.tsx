import React from "react";
import { View, StyleSheet, type ViewProps } from "react-native";
import { COLORS, PIXEL_BORDER, SPACING, FONT_SIZES } from "@/constants/theme";
import { PixelText } from "./PixelText";
import { getIsRTL } from "@/i18n";
import type { TextColor } from "@/types"; // Import TextColor from types.ts

export type BarColor = Exclude<TextColor, "cream" | "gray" | "grayDark">;

export type PixelProgressBarProps = ViewProps & {
  value: number;
  max: number;
  color: BarColor;
  label?: string;
  showValues?: boolean;
};

/**
 * A pixel-art style progress bar component.
 * Displays a progress bar with optional label and numeric values.
 * Supports different colors for the bar fill.
 */
export function PixelProgressBar({
  value,
  max,
  color,
  label,
  showValues = true,
  style,
  ...rest
}: PixelProgressBarProps) {
  const progress = max > 0 ? value / max : 0;
  const progressWidth = `${Math.max(0, Math.min(100, progress * 100))}%`;
  const isRTL = getIsRTL();

  const barColor = COLORS[color as keyof typeof COLORS]; // Type assertion here

  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={[styles.labelRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        {label && (
          <PixelText variant="caption" color="cream" style={styles.label}>
            {label}
          </PixelText>
        )}
        {showValues && (
          <PixelText variant="caption" color="cream" style={styles.values}>
            {value}/{max}
          </PixelText>
        )}
      </View>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: progressWidth,
              backgroundColor: barColor,
              // Adjust border radius for RTL if fill starts from right
              borderTopLeftRadius: isRTL ? 0 : PIXEL_BORDER.borderRadius,
              borderBottomLeftRadius: isRTL ? 0 : PIXEL_BORDER.borderRadius,
              borderTopRightRadius: isRTL ? PIXEL_BORDER.borderRadius : 0,
              borderBottomRightRadius: isRTL ? PIXEL_BORDER.borderRadius : 0,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs / 2,
  },
  label: {
    fontSize: FONT_SIZES.xs,
  },
  values: {
    fontSize: FONT_SIZES.xs,
  },
  barBackground: {
    width: "100%",
    height: 12,
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    borderRadius: PIXEL_BORDER.borderRadius,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
  },
});

