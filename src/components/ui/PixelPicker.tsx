import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { PixelText } from "./PixelText";
import { COLORS, SPACING, PIXEL_BORDER, FONT_SIZES, FONT_FAMILY_SUB } from "@/constants/theme";
import { getIsRTL } from "@/i18n";

interface PickerItem {
  label: string;
  value: string;
  key?: string;
  color?: string;
}

interface PixelPickerProps {
  label?: string;
  items: PickerItem[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: object;
  itemStyle?: object;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const PixelPicker = React.memo(
  ({
    label,
    items,
    selectedValue,
    onValueChange,
    placeholder,
    style,
    itemStyle,
    disabled = false,
    accessibilityLabel,
  }: PixelPickerProps) => {
    const isRTL = getIsRTL();

    const pickerPlaceholder = placeholder ? { label: placeholder, value: null, color: COLORS.gray } : {};

    return (
      <View style={[styles.container, style, { direction: isRTL ? "rtl" : "ltr" }]}>
        {label && (
          <PixelText variant="label" color="cream" style={styles.label}>
            {label}
          </PixelText>
        )}
        <View style={[styles.pickerWrapper, disabled && styles.disabledWrapper]}>
          <RNPickerSelect
            onValueChange={onValueChange}
            items={items}
            value={selectedValue}
            placeholder={pickerPlaceholder}
            disabled={disabled}
            style={pickerSelectStyles(isRTL)}
            useNativeAndroidPickerStyle={false}
            Icon={() => (
              <View style={[styles.iconContainer, {
                [isRTL ? "left" : "right"]: SPACING.sm,
              }]}>
                <PixelText variant="caption" color="cream">
                  ▼
                </PixelText>
              </View>
            )}
            accessibilityLabel={accessibilityLabel || label || "Select an option"}
          />
        </View>
      </View>
    );
  },
);

const pickerSelectStyles = (isRTL: boolean) => StyleSheet.create({
  inputIOS: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY_SUB,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    color: COLORS.cream,
    paddingRight: isRTL ? SPACING.lg : SPACING.xl, // to ensure the text is never behind the icon
    paddingLeft: isRTL ? SPACING.xl : SPACING.lg,
    textAlign: isRTL ? "right" : "left",
  },
  inputAndroid: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY_SUB,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.cream,
    paddingRight: isRTL ? SPACING.lg : SPACING.xl, // to ensure the text is never behind the icon
    paddingLeft: isRTL ? SPACING.xl : SPACING.lg,
    textAlign: isRTL ? "right" : "left",
  },
  placeholder: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY_SUB,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: SPACING.md,
  },
  label: {
    marginBottom: SPACING.xs,
  },
  pickerWrapper: {
    backgroundColor: COLORS.bgMid,
    borderWidth: PIXEL_BORDER.borderWidth,
    borderColor: COLORS.windowBorder,
    borderRadius: PIXEL_BORDER.borderRadius,
    overflow: "hidden",
    justifyContent: "center",
    position: "relative",
    height: 48, // Fixed height for consistency
  },
  disabledWrapper: {
    opacity: 0.6,
    backgroundColor: COLORS.darkGray,
    borderColor: COLORS.gray,
  },
  iconContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SPACING.lg,
    pointerEvents: "none", // Ensure clicks pass through to the picker
  },
});
