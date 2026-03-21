import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { COLORS, SPACING, PIXEL_BORDER, FONT_SIZES } from "@/constants/theme";
import { PixelText } from "./PixelText";
import { getIsRTL } from "@/i18n";

interface DQWindowProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
}

export function DQWindow({ children, title, style }: DQWindowProps) {
  const isRTL = getIsRTL();

  return (
    <View style={[styles.window, style, { direction: isRTL ? "rtl" : "ltr" }]}>
      {title && (
        <View style={[styles.titleContainer, {
          alignSelf: isRTL ? "flex-end" : "flex-start",
          right: isRTL ? SPACING.md : undefined,
          left: isRTL ? undefined : SPACING.md,
        }]}>
          <PixelText variant="label" color="gold" style={styles.titleText}>
            {title}
          </PixelText>
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    backgroundColor: COLORS.bgCard, // Using bgCard for general window background
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.pixelBorder, // Using general pixel border
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: SPACING.md,
    shadowColor: COLORS.shadow.shadowColor,
    shadowOffset: COLORS.shadow.shadowOffset,
    shadowOpacity: COLORS.shadow.shadowOpacity,
    shadowRadius: COLORS.shadow.shadowRadius,
    elevation: COLORS.shadow.elevation, // Android shadow
  },
  titleContainer: {
    position: "absolute",
    top: -FONT_SIZES.md / 2 - PIXEL_BORDER.borderWidth, // Adjust to sit on the border
    backgroundColor: COLORS.bgCard, // Match window background
    paddingHorizontal: SPACING.xs,
    zIndex: 1,
  },
  titleText: {
    fontSize: FONT_SIZES.md,
  },
  content: {
    // Content padding is handled by the window itself
  },
});
