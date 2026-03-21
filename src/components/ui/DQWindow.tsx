import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from "react-native";
import { COLORS, PIXEL_BORDER, SPACING, FONT_SIZES, FONT_FAMILY_MAIN } from "@/constants/theme";
import { PixelText } from "./PixelText";

interface DQWindowProps {
  children: React.ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export const DQWindow: React.FC<DQWindowProps> = ({ children, title, style }) => {
  return (
    <View style={[styles.container, style]}>
      {title && (
        <View style={styles.titleContainer}>
          <PixelText variant="label" color="textDefault" style={styles.titleText}>
            {title}
          </PixelText>
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: COLORS.windowBackground,
    ...PIXEL_BORDER,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 4,
  },
  titleContainer: {
    position: "absolute",
    top: -FONT_SIZES.md / 2 - PIXEL_BORDER.borderWidth,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.xs,
    alignSelf: "flex-start",
    marginLeft: SPACING.md,
    ...PIXEL_BORDER,
    borderColor: COLORS.windowBorder,
    zIndex: 1,
  },
  titleText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY_MAIN,
    color: COLORS.textDefault,
  },
  content: {
    flex: 1,
  },
});
