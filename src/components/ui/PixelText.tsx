import React from "react";
import { Text, StyleSheet, TextProps, Platform } from "react-native";
import { FONT_SIZES, COLORS } from "@/constants/theme";

type PixelTextVariant = "heading" | "body" | "label" | "caption" | "title" | "stat";
type PixelTextColor = keyof typeof COLORS | "default" | "textPrimary" | "textLight" | "textMuted";

interface PixelTextProps extends TextProps {
  variant?: PixelTextVariant;
  color?: PixelTextColor;
  children: React.ReactNode;
}

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export function PixelText({
  variant = "body",
  color = "textPrimary", // Default to textPrimary from COLORS
  style,
  children,
  ...rest
}: PixelTextProps) {
  const textColor = COLORS[color as keyof typeof COLORS] || COLORS.textPrimary; // Ensure color is from COLORS or fallback

  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { color: textColor },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: "bold",
  },
  heading: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
  },
  body: {
    fontSize: FONT_SIZES.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "bold",
  },
  caption: {
    fontSize: FONT_SIZES.xs,
  },
  stat: {
    fontSize: FONT_SIZES.lg, // Larger for stats
    fontWeight: "bold",
  },
});
