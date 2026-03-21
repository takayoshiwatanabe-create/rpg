import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { COLORS, PIXEL_BORDER, SHADOW, SPACING } from "@/constants/theme";
import { PixelText } from "./PixelText";
import { getIsRTL } from "@/i18n";

export type CardVariant =
  | "default"   // standard card with pixel border
  | "elevated"  // adds gold drop-shadow
  | "highlighted"; // gold border + drop-shadow (for active/selected state)

export type PixelCardProps = ViewProps & {
  variant?: CardVariant;
  title?: string;
  children: React.ReactNode;
};

/**
 * Container card styled as an 8-bit RPG panel.
 *
 * - `default`     — flat panel with a cream pixel border
 * - `elevated`    — adds a gold drop-shadow for depth
 * - `highlighted` — brighter gold border + shadow; use for selected quests or
 *                   active hero stats
 *
 * Pass a `title` string to render an RPG-style header bar inside the card.
 */
export function PixelCard({
  variant = "default",
  title,
  children,
  style,
  ...rest
}: PixelCardProps) {
  const isRTL = getIsRTL();
  return (
    <View
      style={[
        styles.card,
        variant === "elevated" && styles.elevated,
        variant === "highlighted" && styles.highlighted,
        style,
      ]}
      {...rest}
    >
      {title !== undefined && (
        <View style={[styles.titleBar, { borderBottomColor: PIXEL_BORDER.borderColor }]}>
          <PixelText variant="label" color="gold" style={{ textAlign: isRTL ? "right" : "left" }}>
            {title}
          </PixelText>
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: PIXEL_BORDER.borderColor,
    borderRadius: PIXEL_BORDER.borderRadius,
    overflow: "hidden",
  },
  elevated: {
    ...SHADOW,
  },
  highlighted: {
    ...SHADOW,
    borderColor: COLORS.gold,
    borderWidth: PIXEL_BORDER.borderWidth + 1, // Slightly thicker for highlight
  },
  titleBar: {
    backgroundColor: COLORS.bgMid,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: PIXEL_BORDER.borderWidth, // Use pixel border width
  },
  content: {
    padding: SPACING.md,
  },
});
