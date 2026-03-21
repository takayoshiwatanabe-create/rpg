import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { PixelText } from "./PixelText";
import { PIXEL_BORDER, COLORS, FONT_SIZES, SPACING, FONT_FAMILY_MAIN } from "@/constants/theme";
import { useIsRTL } from "@/hooks/useIsRTL";
import { useHaptics } from "@/hooks/useHaptics";
import { useSound } from "@/hooks/useSound";

interface PickerItem<T> {
  label: string;
  value: T;
}

interface PixelPickerProps<T> {
  items: PickerItem<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  style?: object;
  itemTextStyle?: object;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const { height: screenHeight } = Dimensions.get("window");

export function PixelPicker<T>({
  items,
  selectedValue,
  onValueChange,
  placeholder,
  label,
  style,
  itemTextStyle,
  accessibilityLabel,
  accessibilityHint,
}: PixelPickerProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);
  const isRTL = useIsRTL();
  const { triggerHaptic } = useHaptics();
  const { play } = useSound();
  const flatListRef = useRef<FlatList>(null);

  const selectedLabel =
    items.find((item) => item.value === selectedValue)?.label || placeholder;

  const openPicker = useCallback(() => {
    triggerHaptic("light");
    play("buttonTap");
    setModalVisible(true);
  }, [triggerHaptic, play]);

  const closePicker = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleItemPress = useCallback(
    (value: T) => {
      onValueChange(value);
      triggerHaptic("light");
      play("confirm");
      closePicker();
    },
    [onValueChange, closePicker, triggerHaptic, play],
  );

  const renderItem = useCallback(
    ({ item }: { item: PickerItem<T> }) => (
      <TouchableOpacity
        style={[
          styles.modalItem,
          item.value === selectedValue && styles.selectedModalItem,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        onPress={() => handleItemPress(item.value)}
        accessibilityLabel={item.label}
        accessibilityState={{ selected: item.value === selectedValue }}
      >
        <PixelText
          variant="body"
          color={item.value === selectedValue ? "gold" : "textDefault"}
          style={[styles.modalItemText, itemTextStyle]}
        >
          {item.label}
        </PixelText>
      </TouchableOpacity>
    ),
    [selectedValue, handleItemPress, isRTL, itemTextStyle],
  );

  useEffect(() => {
    if (modalVisible && flatListRef.current) {
      const selectedIndex = items.findIndex((item) => item.value === selectedValue);
      if (selectedIndex !== -1) {
        // Scroll to the selected item with a slight delay to ensure layout is ready
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: selectedIndex,
            animated: false,
            viewPosition: 0.5, // Center the item
          });
        }, 100);
      }
    }
  }, [modalVisible, selectedValue, items]);

  return (
    <View style={[styles.container, style, { direction: isRTL ? "rtl" : "ltr" }]}>
      {label && (
        <PixelText variant="label" color="textDefault" style={styles.label}>
          {label}
        </PixelText>
      )}
      <TouchableOpacity
        onPress={openPicker}
        style={[styles.pickerButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
        accessibilityRole="combobox"
        accessibilityLabel={accessibilityLabel || label || placeholder || "Select an option"}
        accessibilityHint={accessibilityHint || "Opens a list of options to choose from"}
        accessibilityValue={{ text: selectedLabel }}
      >
        <PixelText variant="body" color="textDefault" style={styles.valueText}>
          {selectedLabel}
        </PixelText>
        <PixelText variant="body" color="textDefault" style={styles.arrow}>
          ▼
        </PixelText>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={closePicker}
        animationType="fade"
        supportedOrientations={["portrait", "landscape"]}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closePicker}>
          <View style={styles.modalContent}>
            <FlatList
              ref={flatListRef}
              data={items}
              renderItem={renderItem}
              keyExtractor={(item, index) => `picker-item-${index}-${String(item.value)}`}
              style={styles.flatList}
              contentContainerStyle={styles.flatListContent}
              getItemLayout={(data, index) => ({
                length: 40, // Height of each item
                offset: 40 * index,
                index,
              })}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    marginBottom: SPACING.xs,
    fontSize: FONT_SIZES.sm,
  },
  pickerButton: {
    backgroundColor: COLORS.bgInput,
    ...PIXEL_BORDER,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
  },
  valueText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: COLORS.textDefault,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY_MAIN,
  },
  arrow: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDefault,
    position: "absolute",
    right: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.windowBackground,
    ...PIXEL_BORDER,
    maxHeight: screenHeight * 0.7, // Limit height to 70% of screen height
    width: "80%",
    overflow: "hidden", // Ensure content doesn't spill out of border
  },
  flatList: {
    flexGrow: 0, // Prevent FlatList from taking full height if content is small
  },
  flatListContent: {
    paddingVertical: SPACING.xs,
  },
  modalItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
    alignItems: "center",
  },
  selectedModalItem: {
    backgroundColor: COLORS.bgHighlight,
  },
  modalItemText: {
    fontSize: FONT_SIZES.body,
    fontFamily: FONT_FAMILY_MAIN,
  },
});
