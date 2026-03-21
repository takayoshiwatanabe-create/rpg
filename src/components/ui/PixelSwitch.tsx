import React, { useCallback } from "react";
import {
  View,
  Switch,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from "react-native";
import { PixelText } from "./PixelText";
import { COLORS, PIXEL_BORDER, SPACING } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import { useSound } from "@/hooks/useSound";
import { useIsRTL } from "@/hooks/useIsRTL";

interface PixelSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const PixelSwitch: React.FC<PixelSwitchProps> = ({
  label,
  value,
  onValueChange,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { triggerHaptic } = useHaptics();
  const { play } = useSound();
  const isRTL = useIsRTL();

  const handleToggle = useCallback(() => {
    if (disabled) return;
    triggerHaptic("light");
    play("buttonTap"); // Use buttonTap for switch toggle sound
    onValueChange(!value);
  }, [disabled, onValueChange, value, triggerHaptic, play]);

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={[styles.container, style, { flexDirection: isRTL ? "row-reverse" : "row" }]}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: disabled }}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint || `Toggles ${label} ${value ? "off" : "on"}`}
    >
      <PixelText variant="body" color={disabled ? "gray" : "textDefault"} style={styles.label}>
        {label}
      </PixelText>
      <Switch
        trackColor={{ false: COLORS.darkGray, true: COLORS.success }}
        thumbColor={value ? COLORS.white : COLORS.gray}
        ios_backgroundColor={COLORS.darkGray}
        onValueChange={handleToggle}
        value={value}
        disabled={disabled}
        style={styles.switch}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCard,
    ...PIXEL_BORDER,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  label: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  switch: {
    // Platform specific styling for switch if needed
    transform: Platform.OS === "android" ? [{ scale: 1.2 }] : [], // Slightly larger thumb on Android
  },
});
