import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, PIXEL_BORDER, SPACING } from "@/constants/theme";

export type PixelCardVariant = "default" | "highlighted";

interface PixelCardProps {
  children: React.ReactNode;
  variant?: PixelCardVariant;
  style?: object;
}

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
    ...PIXEL_BORDER,
    padding: SPACING.md,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 4,
  },
  highlighted: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.bgHighlight,
  },
});
