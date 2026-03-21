import React from "react";
import { Text, StyleSheet, TextProps, Platform } from "react-native";
import { FONT_SIZES, COLORS, FONT_FAMILY_MAIN, FONT_FAMILY_SUB } from "@/constants/theme";

type PixelTextVariant = "heading" | "body" | "label" | "caption" | "title" | "stat";
type PixelTextColor = keyof typeof COLORS;

interface PixelTextProps extends TextProps {
  variant?: PixelTextVariant;
  color?: PixelTextColor;
  children: React.ReactNode;
}

export function PixelText({
  variant = "body",
  color = "textDefault",
  style,
  children,
  ...rest
}: PixelTextProps) {
  const textColor = COLORS[color] || COLORS.textDefault;

  const fontStyle =
    variant === "title" || variant === "heading"
      ? FONT_FAMILY_MAIN
      : FONT_FAMILY_SUB;

  const textStyles = StyleSheet.flatten([
    styles.baseText,
    { fontFamily: fontStyle, color: textColor },
    styles[variant],
    style,
  ]);

  return (
    <Text style={textStyles} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  baseText: {
    // Default styles for all PixelText
    // Letter spacing, line height can be added here if needed globally
  },
  heading: {
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * 1.2,
  },
  title: {
    // This variant might be redundant with 'heading' or used for specific sub-titles
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * 1.2,
  },
  body: {
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.4,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.3,
  },
  caption: {
    fontSize: FONT_SIZES.caption,
    lineHeight: FONT_SIZES.caption * 1.2,
  },
  stat: {
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * 1.2,
  },
});
