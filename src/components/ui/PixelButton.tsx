import React, { useCallback, useRef } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from "react-native"; // Removed Platform import as FONT_SIZES is now from theme
import { COLORS, SPACING, PIXEL_BORDER, FONT_SIZES } from "@/constants/theme";
import { PixelText } from "./PixelText";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface PixelButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "link" | "menuitem" | "radio" | "tab";
  accessibilityState?: {
    selected?: boolean;
    disabled?: boolean;
    checked?: boolean;
  };
}

export function PixelButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
}: PixelButtonProps) {
  const animatedScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(animatedScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [animatedScale, disabled]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    Animated.spring(animatedScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [animatedScale, disabled]);

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.textBase,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={buttonStyles}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ ...accessibilityState, disabled }}
      >
        <PixelText style={textStyles} variant="body">
          {label}
        </PixelText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: PIXEL_BORDER.borderRadius,
    borderWidth: PIXEL_BORDER.borderWidth,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.shadow, // Apply shadow to buttons
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4, // Android shadow
  },
  // Variants
  primary: {
    backgroundColor: COLORS.primary, // Use primary color from theme
    borderColor: COLORS.primaryDark, // Assuming primaryDark exists or use a darker version of primary
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondaryDark, // Assuming secondaryDark exists or use a darker version of secondary
  },
  danger: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.dangerDark,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    shadowOpacity: 0, // No shadow for ghost buttons
    elevation: 0,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: COLORS.darkGray, // Darker background for disabled
    borderColor: COLORS.gray, // Gray border for disabled
  },
  // Sizes
  sm: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  md: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  // Text Base
  textBase: {
    fontWeight: "bold",
    textAlign: "center",
  },
  // Text Variants
  text_primary: {
    color: COLORS.cream, // Use cream for primary button text
  },
  text_secondary: {
    color: COLORS.cream, // Use cream for secondary button text
  },
  text_danger: {
    color: COLORS.cream, // Use cream for danger button text
  },
  text_ghost: {
    color: COLORS.cream, // Use cream for ghost button text
  },
  textDisabled: {
    color: COLORS.gray, // Use gray for disabled text
  },
  // Text Sizes
  text_sm: {
    fontSize: FONT_SIZES.sm,
  },
  text_md: {
    fontSize: FONT_SIZES.md,
  },
  text_lg: {
    fontSize: FONT_SIZES.lg,
  },
});
