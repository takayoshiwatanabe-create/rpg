import React, { useCallback, useRef } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
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
    Animated.spring(animatedScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [animatedScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(animatedScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [animatedScale]);

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
  },
  // Variants
  primary: {
    backgroundColor: COLORS.buttonPrimary,
    borderColor: COLORS.primaryDark, // Assuming primaryDark exists or use a darker version of buttonPrimary
  },
  secondary: {
    backgroundColor: COLORS.buttonSecondary,
    borderColor: COLORS.secondaryDark, // Assuming secondaryDark exists or use a darker version of buttonSecondary
  },
  danger: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.dangerDark,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  disabled: {
    opacity: 0.6,
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
    color: COLORS.textLight, // Assuming textLight exists or use a suitable color
  },
  text_secondary: {
    color: COLORS.textPrimary,
  },
  text_danger: {
    color: COLORS.textLight,
  },
  text_ghost: {
    color: COLORS.textPrimary,
  },
  textDisabled: {
    color: COLORS.textMuted, // Assuming textMuted exists or use a suitable color
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
