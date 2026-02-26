import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { COLORS, FONT_SIZES, PIXEL_BORDER, SPACING } from "@/constants/theme";
import { useReducedMotion } from "@/src/hooks/useReducedMotion";
import { getIsRTL } from "@/i18n";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type PixelButtonProps = Omit<
  PressableProps,
  "style" | "children" | "onPress"
> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle; // Changed to ViewStyle
};

type VariantConfig = {
  background: string;
  text: string;
  borderHighlight: string;
  borderShadow: string;
};

const VARIANT_CONFIG: Record<ButtonVariant, VariantConfig> = {
  primary: {
    background: COLORS.buttonPrimary,
    text: COLORS.gold,
    borderHighlight: COLORS.goldLight,
    borderShadow: COLORS.goldDark,
  },
  secondary: {
    background: COLORS.buttonSecondary,
    text: COLORS.cream,
    borderHighlight: "#2A3A4A",
    borderShadow: COLORS.grayDark,
  },
  danger: {
    background: "#3A0000",
    text: COLORS.hp,
    borderHighlight: "#662222",
    borderShadow: "#220000",
  },
  ghost: {
    background: "transparent",
    text: COLORS.cream,
    borderHighlight: COLORS.grayDark,
    borderShadow: COLORS.grayDark,
  },
};

type SizeConfig = { paddingH: number; paddingV: number; fontSize: number };

const SIZE_CONFIG: Record<ButtonSize, SizeConfig> = {
  sm: { paddingH: SPACING.sm, paddingV: SPACING.xs, fontSize: FONT_SIZES.sm },
  md: { paddingH: SPACING.md, paddingV: SPACING.sm, fontSize: FONT_SIZES.md },
  lg: { paddingH: SPACING.lg, paddingV: SPACING.md, fontSize: FONT_SIZES.lg },
};

/**
 * 8-bit style pressable button with a 3-D pixel border effect.
 *
 * Top/left edges use a lighter highlight color; bottom/right edges use a
 * darker shadow color to simulate depth. A spring animation squeezes the
 * button on press (skipped when the system "Reduce Motion" setting is on).
 */
export function PixelButton({
  label,
  variant = "primary",
  size = "md",
  disabled = false,
  onPress,
  accessibilityLabel,
  style, // Destructure style prop
  ...rest
}: PixelButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  const config = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const isRTL = getIsRTL();

  function handlePressIn() {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }

  function handlePress(e: GestureResponderEvent) {
    if (!disabled && onPress) {
      onPress(e);
    }
  }

  return (
    <Animated.View
      style={[{ transform: [{ scale }], opacity: disabled ? 0.45 : 1 }, style]} // Apply style here
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!!disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: !!disabled }}
        {...rest}
      >
        <View
          style={[
            styles.button,
            {
              backgroundColor: config.background,
              paddingHorizontal: sizeConfig.paddingH,
              paddingVertical: sizeConfig.paddingV,
              // Adjust border colors for RTL to maintain the 3D effect
              borderTopColor: config.borderHighlight,
              borderBottomColor: config.borderShadow,
              borderLeftColor: isRTL ? config.borderShadow : config.borderHighlight,
              borderRightColor: isRTL ? config.borderHighlight : config.borderShadow,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              { fontSize: sizeConfig.fontSize, color: config.text },
            ]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderTopWidth: 2,
    // Thicker bottom/right for the classic pixel "raised" look
    borderBottomWidth: 4,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderRadius: PIXEL_BORDER.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
  },
});
