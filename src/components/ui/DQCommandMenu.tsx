import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { COLORS, FONT_SIZES, PIXEL_BORDER, SPACING } from "@/constants/theme";
import { PixelText } from "./PixelText";
import { getIsRTL } from "@/i18n";

type MenuItem = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type DQCommandMenuProps = {
  items: MenuItem[];
  style?: object;
};

export function DQCommandMenu({ items, style }: DQCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const isRTL = getIsRTL();

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [cursorAnim]);

  return (
    <View style={[styles.outer, style, { direction: isRTL ? "rtl" : "ltr" }]}>
      <View style={styles.inner}>
        <View style={styles.content}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={() => {
                setSelectedIndex(index);
                if (!item.disabled) item.onPress();
              }}
              disabled={item.disabled}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ disabled: item.disabled, selected: index === selectedIndex }}
            >
              <Animated.Text
                style={[
                  styles.cursor,
                  {
                    opacity: index === selectedIndex ? cursorAnim : 0,
                    marginRight: isRTL ? 0 : SPACING.xs,
                    marginLeft: isRTL ? SPACING.xs : 0,
                  },
                ]}
              >
                {isRTL ? "◀" : "▶"}
              </Animated.Text>
              <PixelText
                style={[
                  styles.label,
                  item.disabled && styles.labelDisabled,
                ]}
                variant="body"
              >
                {item.label}
              </PixelText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: PIXEL_BORDER.borderWidth + 1, // Slightly thicker border for DQ style
    borderColor: COLORS.dqBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    backgroundColor: COLORS.dqBlue,
    shadowColor: COLORS.shadow.shadowColor,
    shadowOffset: COLORS.shadow.shadowOffset,
    shadowOpacity: COLORS.shadow.shadowOpacity,
    shadowRadius: COLORS.shadow.shadowRadius,
    elevation: COLORS.shadow.elevation,
  },
  inner: {
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.dqInnerBorder, // Darker inner border
    borderRadius: PIXEL_BORDER.borderRadius - 1,
    margin: PIXEL_BORDER.borderWidth / 2, // Small margin to show outer border
  },
  content: {
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  menuItem: {
    alignItems: "center",
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.xs,
  },
  cursor: {
    color: COLORS.dqCursor,
    fontSize: FONT_SIZES.md,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    width: FONT_SIZES.md + SPACING.xs, // Ensure enough space for cursor
    textAlign: "center",
  },
  label: {
    color: COLORS.dqText,
    fontSize: FONT_SIZES.md,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  labelDisabled: {
    color: COLORS.grayDark,
  },
});
