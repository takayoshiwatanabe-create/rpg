import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native"; // Removed Platform import as FONT_SIZES is now from theme
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
    borderColor: COLORS.windowBorder, // Using general pixel border
    borderRadius: PIXEL_BORDER.borderRadius,
    padding: SPACING.md,
    shadowColor: COLORS.shadow, // Use the shadow color directly
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, // Pixel shadows are usually opaque
    shadowRadius: 0, // Pixel shadows have no blur
    elevation: 4, // Android shadow
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
