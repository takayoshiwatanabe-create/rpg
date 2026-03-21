import React from "react";
import { Text, StyleSheet, TextProps, Platform } from "react-native";
import { FONT_SIZES, COLORS, FONT_FAMILY_MAIN, FONT_FAMILY_SUB } from "@/constants/theme";

type PixelTextVariant = "heading" | "body" | "label" | "caption" | "title" | "stat";
type PixelTextColor = keyof typeof COLORS | "default"; // Removed specific text colors as they are now in COLORS

interface PixelTextProps extends TextProps {
  variant?: PixelTextVariant;
  color?: PixelTextColor;
  children: React.ReactNode;
}

// Use the fonts defined in theme.ts
const FONT_FAMILY = FONT_FAMILY_SUB; // Default to sub font for general text
const FONT_FAMILY_HEADING = FONT_FAMILY_MAIN; // Use main font for headings/titles

export function PixelText({
  variant = "body",
  color = "cream", // Default to cream from COLORS
  style,
  children,
  ...rest
}: PixelTextProps) {
  const textColor = COLORS[color as keyof typeof COLORS] || COLORS.cream; // Ensure color is from COLORS or fallback to cream

  const fontStyle =
    variant === "title" || variant === "heading"
      ? { fontFamily: FONT_FAMILY_HEADING }
      : { fontFamily: FONT_FAMILY };

  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { color: textColor },
        fontStyle, // Apply font family based on variant
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
    // fontFamily is now applied dynamically based on variant
    color: COLORS.cream, // Default text color
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
