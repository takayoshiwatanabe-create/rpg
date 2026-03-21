import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, PIXEL_BORDER, SPACING } from "@/constants/theme";

export type PixelCardVariant = "default" | "highlighted";

type PixelCardProps = {
  children: React.ReactNode;
  variant?: PixelCardVariant;
  style?: object;
};

export const PixelCard = React.memo(
  ({ children, variant = "default", style }: PixelCardProps) => {
    const cardStyle = [
      styles.base,
      variant === "highlighted" && styles.highlighted,
      style,
    ];

    return <View style={cardStyle}>{children}</View>;
  },
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.bgCard,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  highlighted: {
    backgroundColor: COLORS.bgLight,
    borderColor: COLORS.gold,
    shadowColor: COLORS.goldDark,
  },
});

