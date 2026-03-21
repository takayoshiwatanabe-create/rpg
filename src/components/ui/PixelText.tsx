import React from "react";
import { Text, StyleSheet, TextProps, Platform } from "react-native";
import { FONT_SIZES, COLORS, FONT_FAMILY_MAIN, FONT_FAMILY_SUB } from "@/constants/theme";

type PixelTextVariant = "heading" | "body" | "label" | "caption" | "title" | "stat";
type PixelTextColor = keyof typeof COLORS; // Removed "default" as it's not a key in COLORS

interface PixelTextProps extends TextProps {
  variant?: PixelTextVariant;
  color?: PixelTextColor;
  children: React.ReactNode;
}

const FONT_FAMILY = FONT_FAMILY_SUB;
const FONT_FAMILY_HEADING = FONT_FAMILY_MAIN;

export function PixelText({
  variant = "body",
  color = "cream",
  style,
  children,
  ...rest
}: PixelTextProps) {
  const textColor = COLORS[color] || COLORS.cream;

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
        fontStyle,
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
    color: COLORS.cream,
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
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
  },
});
