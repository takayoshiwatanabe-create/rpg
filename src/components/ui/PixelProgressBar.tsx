import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { COLORS, PIXEL_BORDER, SPACING } from "@/constants/theme";
import { PixelText } from "./PixelText";

interface PixelProgressBarProps {
  value: number;
  max: number;
  color?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "exp" | "hp";
  height?: number;
  style?: StyleProp<ViewStyle>;
  showValues?: boolean;
}

export const PixelProgressBar: React.FC<PixelProgressBarProps> = ({
  value,
  max,
  color = "primary",
  height = 16,
  style,
  showValues = false,
}) => {
  const progress = Math.min(Math.max(value / max, 0), 1); // Ensure progress is between 0 and 1
  const fillColor = COLORS[color] || COLORS.primary;

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={[styles.background, { height }]} />
      <View
        style={[
          styles.fill,
          {
            width: `${progress * 100}%`,
            backgroundColor: fillColor,
            height,
          },
        ]}
      />
      {showValues && (
        <PixelText variant="caption" color="textDefault" style={styles.valueText}>
          {value.toLocaleString()}/{max.toLocaleString()}
        </PixelText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: COLORS.darkGray,
    ...PIXEL_BORDER,
    position: "relative",
    justifyContent: "center",
  },
  background: {
    position: "absolute",
    width: "100%",
    backgroundColor: COLORS.darkGray,
  },
  fill: {
    position: "absolute",
    left: 0,
  },
  valueText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: COLORS.textDefault, // Ensure text is visible against any background
    zIndex: 1, // Ensure text is above the fill
  },
});
