import React, { useCallback } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import {
  COLORS,
  FONT_SIZES,
  PIXEL_BORDER,
  SPACING,
  FONT_FAMILY_MAIN,
} from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import { useSound } from "@/hooks/useSound";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface PixelButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  onPress,
  children,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { triggerHaptic } = useHaptics();
  const { play } = useSound();

  const handlePress = useCallback(() => {
    if (disabled) return;
    triggerHaptic("light");
    play("buttonTap");
    onPress();
  }, [disabled, onPress, triggerHaptic, play]);

  const buttonStyles = [
    styles.base,
    styles[`button_${variant}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.baseText,
    styles[`text_${variant}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={buttonStyles}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled }}
      accessibilityLabel={accessibilityLabel || (typeof children === "string" ? children : undefined)}
      accessibilityHint={accessibilityHint}
    >
      {typeof children === "string" ? (
        <Text style={textStyles}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    ...PIXEL_BORDER,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 4,
  },
  baseText: {
    fontFamily: FONT_FAMILY_MAIN,
    fontSize: FONT_SIZES.body,
    textAlign: "center",
  },
  disabled: {
    backgroundColor: COLORS.gray,
    borderColor: COLORS.darkGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  textDisabled: {
    color: COLORS.darkGray,
  },

  // Button Variants
  button_primary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  button_secondary: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.darkGray,
  },
  button_danger: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.darkGray,
  },
  button_ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },

  // Text Variants
  text_primary: {
    color: COLORS.textDefault,
  },
  text_secondary: {
    color: COLORS.textDefault,
  },
  text_danger: {
    color: COLORS.textDefault,
  },
  text_ghost: {
    color: COLORS.textDefault,
  },
});
