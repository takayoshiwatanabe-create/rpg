import React, { useCallback, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { COLORS, FONT_FAMILY_MAIN } from "../../constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import { useSound } from "@/hooks/useSound";

const FONT_FAMILY = Platform.select({
  ios: FONT_FAMILY_MAIN,
  android: FONT_FAMILY_MAIN,
  default: FONT_FAMILY_MAIN,
});

interface PixelButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel: string;
  accessibilityRole?: "button" | "link";
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
}

const PixelButton: React.FC<PixelButtonProps> = ({
  label,
  onPress,
  variant = "primary",
  size = "medium",
  style,
  textStyle,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { triggerHaptic } = useHaptics();
  const { play } = useSound();

  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  }, [disabled, loading, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [disabled, loading, scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    triggerHaptic("light");
    play("buttonTap");
    onPress();
  }, [disabled, loading, onPress, triggerHaptic, play]);

  const buttonStyles: ViewStyle[] = [styles.button];
  const textStyles: TextStyle[] = [styles.text];

  // Variant styles
  if (variant === "primary") {
    buttonStyles.push(styles.primaryButton);
    textStyles.push(styles.primaryText);
  } else if (variant === "secondary") {
    buttonStyles.push(styles.secondaryButton);
    textStyles.push(styles.secondaryText);
  } else if (variant === "danger") {
    buttonStyles.push(styles.dangerButton);
    textStyles.push(styles.dangerText);
  } else if (variant === "success") {
    buttonStyles.push(styles.successButton);
    textStyles.push(styles.successText);
  } else if (variant === "ghost") {
    buttonStyles.push(styles.ghostButton);
    textStyles.push(styles.ghostText);
  }

  // Size styles
  if (size === "small") {
    buttonStyles.push(styles.smallButton);
    textStyles.push(styles.smallText);
  } else if (size === "large") {
    buttonStyles.push(styles.largeButton);
    textStyles.push(styles.largeText);
  }

  // Disabled state
  if (disabled || loading) {
    buttonStyles.push(styles.disabledButton);
    textStyles.push(styles.disabledText);
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={buttonStyles}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ ...accessibilityState, disabled: disabled || loading }}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === "primary" ? COLORS.textPrimary : COLORS.textSecondary}
            size="small"
            accessibilityLabel={label + " " + "読み込み中"}
          />
        ) : (
          <Text style={[textStyles, textStyle]}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 4,
  },
  text: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  // Variants
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryBorder,
  },
  primaryText: {
    color: COLORS.textPrimary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondaryBorder,
  },
  secondaryText: {
    color: COLORS.textSecondary,
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.dangerBorder,
  },
  dangerText: {
    color: COLORS.textPrimary,
  },
  successButton: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.successBorder,
  },
  successText: {
    color: COLORS.textPrimary,
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderColor: COLORS.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostText: {
    color: COLORS.textSecondary,
  },
  // Sizes
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  smallText: {
    fontSize: 14,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  largeText: {
    fontSize: 22,
  },
  // Disabled
  disabledButton: {
    backgroundColor: COLORS.disabledBg,
    borderColor: COLORS.disabledBorder,
    shadowOpacity: 0.3,
    elevation: 2,
  },
  disabledText: {
    color: COLORS.disabledText,
  },
});

export default PixelButton;
