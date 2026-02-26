import React from "react";
import { Platform, StyleSheet, Text, type TextProps } from "react-native";
import { COLORS, FONT_SIZES } from "@/constants/theme";
import { getIsRTL } from "@/i18n";

export type TextVariant = "title" | "heading" | "body" | "caption" | "stat" | "label";

export type TextColor =
  | "gold"
  | "cream"
  | "white"
  | "gray"
  | "hp"
  | "mp"
  | "exp"
  | "danger";

export type PixelTextProps = Omit<TextProps, "style"> & {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
  style?: TextProps["style"];
};

const VARIANT_FONT_SIZE: Record<TextVariant, number> = {
  title: FONT_SIZES.title,
  heading: FONT_SIZES.xl,
  body: FONT_SIZES.md,
  caption: FONT_SIZES.sm,
  stat: FONT_SIZES.lg,
  label: FONT_SIZES.xs,
};

const VARIANT_WEIGHT: Record<TextVariant, "normal" | "bold"> = {
  title: "bold",
  heading: "bold",
  body: "normal",
  caption: "normal",
  stat: "bold",
  label: "bold",
};

const COLOR_MAP: Record<TextColor, string> = {
  gold: COLORS.gold,
  cream: COLORS.cream,
  white: COLORS.white,
  gray: COLORS.gray,
  hp: COLORS.hp,
  mp: COLORS.mp,
  exp: COLORS.exp,
  danger: COLORS.hp,
};

export function PixelText({
  variant = "body",
  color = "cream",
  children,
  style,
  ...rest
}: PixelTextProps) {
  const isRTL = getIsRTL();

  return (
    <Text
      style={[
        styles.base,
        {
          fontSize: VARIANT_FONT_SIZE[variant],
          fontWeight: VARIANT_WEIGHT[variant],
          color: COLOR_MAP[color],
          textAlign: isRTL ? "right" : "left",
        },
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
    // Courier New is available on both iOS and Android as a monospace fallback
    // until a custom pixel font (e.g. Press Start 2P) is loaded via expo-font.
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    letterSpacing: 0.5,
  },
});

