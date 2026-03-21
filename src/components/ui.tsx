import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  Dimensions,
  Animated,
  AccessibilityInfo,
  AccessibilityRole,
  AccessibilityState,
  Switch,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
import { FONT_FAMILY_MAIN, FONT_FAMILY_SUB, FONT_SIZES } from "@/constants/theme";
import { useIsRTL } from "@/hooks/useIsRTL";
import { useHaptics } from "@/hooks/useHaptics";
import { useSound } from "@/hooks/useSound";

// --- Utility Types ---
type PixelTextVariant =
  | "heading"
  | "body"
  | "label"
  | "caption"
  | "title"
  | "subheading"
  | "subtitle";
type PixelTextColor =
  | "primary"
  | "secondary"
  | "gold"
  | "goldDark"
  | "goldLight"
  | "textDefault"
  | "gray"
  | "darkGray"
  | "white"
  | "black"
  | "bgCard"
  | "bgHighlight"
  | "windowBackground"
  | "windowBorder"
  | "inputBackground"
  | "primaryDark"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "exp"
  | "hp"
  | "mp";

// --- PixelText Component ---
interface PixelTextProps extends Text["props"] {
  variant?: PixelTextVariant;
  color?: PixelTextColor;
  children: React.ReactNode;
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
  accessibilityLabel?: string;
}

export const PixelText: React.FC<PixelTextProps> = ({
  variant = "body",
  color = "textDefault",
  style,
  children,
  ellipsizeMode,
  accessibilityLabel,
}) => {
  const textColor = COLORS[color] || COLORS.textDefault;

  const fontStyle =
    variant === "title" || variant === "heading" || variant === "subheading"
      ? FONT_FAMILY_MAIN
      : FONT_FAMILY_SUB;

  const textStyles = StyleSheet.flatten([
    styles.baseText,
    { fontFamily: fontStyle, color: textColor },
    styles[variant],
    style,
  ]);

  return (
    <Text
      style={textStyles}
      ellipsizeMode={ellipsizeMode}
      numberOfLines={ellipsizeMode ? 1 : undefined}
      accessibilityLabel={accessibilityLabel || (typeof children === "string" ? children : undefined)}
    >
      {children}
    </Text>
  );
};

// --- PixelButton Component ---
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface PixelButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: View["props"]["style"];
  textStyle?: Text["props"]["style"];
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
    styles.buttonBase,
    styles[`button_${variant}`],
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonTextBase,
    styles[`buttonText_${variant}`],
    disabled && styles.buttonTextDisabled,
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
      accessibilityLabel={accessibilityLabel || (typeof children === "string" ? children : "Button")}
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

// --- PixelInput Component ---
interface PixelInputProps extends TextInput["props"] {
  label?: string;
  error?: string;
  style?: TextInput["props"]["style"];
  inputStyle?: TextInput["props"]["style"];
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const PixelInput: React.FC<PixelInputProps> = ({
  label,
  error,
  style,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  const isRTL = useIsRTL();
  const { play } = useSound();

  const handleFocus = useCallback(() => {
    play("messageAdvance"); // Play a subtle sound on focus
  }, [play]);

  return (
    <View style={[styles.inputContainer, style, { direction: isRTL ? "rtl" : "ltr" }]}>
      {label && (
        <PixelText variant="label" color="textDefault" style={styles.inputLabel}>
          {label}
        </PixelText>
      )}
      <TextInput
        style={[styles.inputBase, inputStyle, error && styles.inputErrorBorder]}
        placeholderTextColor={COLORS.gray}
        onFocus={handleFocus}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint || (error ? `Error: ${error}` : undefined)}
        {...rest}
      />
      {error && (
        <PixelText variant="caption" color="danger" style={styles.inputErrorText}>
          {error}
        </PixelText>
      )}
    </View>
  );
};

// --- PixelProgressBar Component ---
interface PixelProgressBarProps {
  value: number;
  max: number;
  color?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "exp" | "hp";
  height?: number;
  style?: View["props"]["style"];
  showValues?: boolean;
}

export const PixelProgressBar: React.FC<PixelProgressBarProps> = ({
  value,
  max,
  color = "primary",
  height = 16,
  style,
  showValues = false,
}) => {
  const progress = Math.min(Math.max(value / max, 0), 1);
  const fillColor = COLORS[color] || COLORS.primary;

  return (
    <View style={[styles.progressBarContainer, { height }, style]}>
      <View style={[styles.progressBarBackground, { height }]} />
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${progress * 100}%`,
            backgroundColor: fillColor,
            height,
          },
        ]}
      />
      {showValues && (
        <PixelText variant="caption" color="textDefault" style={styles.progressBarValueText}>
          {value.toLocaleString()}/{max.toLocaleString()}
        </PixelText>
      )}
    </View>
  );
};

// --- PixelCard Component ---
type PixelCardVariant = "default" | "highlighted";

interface PixelCardProps {
  children: React.ReactNode;
  variant?: PixelCardVariant;
  style?: View["props"]["style"];
}

export const PixelCard: React.FC<PixelCardProps> = ({ children, variant = "default", style }) => {
  const cardStyle = [
    styles.cardBase,
    variant === "highlighted" && styles.cardHighlighted,
    style,
  ];
  return <View style={cardStyle}>{children}</View>;
};

// --- DQWindow Component ---
interface DQWindowProps {
  children: React.ReactNode;
  title?: string;
  style?: View["props"]["style"];
}

export const DQWindow: React.FC<DQWindowProps> = ({ children, title, style }) => {
  return (
    <View style={[styles.windowContainer, style]}>
      {title && (
        <View style={styles.windowTitleContainer}>
          <PixelText variant="label" color="textDefault" style={styles.windowTitleText}>
            {title}
          </PixelText>
        </View>
      )}
      <View style={styles.windowContent}>{children}</View>
    </View>
  );
};

// --- DQMessageBox Component ---
interface DQMessageBoxProps {
  message: string;
  onFinishTyping?: () => void;
  onPress?: () => void;
  skippable?: boolean;
  typingSpeed?: number; // Milliseconds per character
}

export const DQMessageBox: React.FC<DQMessageBoxProps> = ({
  message,
  onFinishTyping,
  onPress,
  skippable = true,
  typingSpeed = 50,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const isTypingComplete = useRef(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRTL = useIsRTL();
  const { play } = useSound();

  const startTyping = useCallback(() => {
    isTypingComplete.current = false;
    setDisplayedText("");
    setCurrentIndex(0);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex > message.length) {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
          }
          isTypingComplete.current = true;
          onFinishTyping?.();
          return prevIndex;
        }
        setDisplayedText(message.substring(0, nextIndex));
        play("messageAdvance"); // Play sound for each character
        return nextIndex;
      });
    }, typingSpeed);
  }, [message, typingSpeed, onFinishTyping, play]);

  useEffect(() => {
    startTyping();
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [message, startTyping]);

  const handlePress = useCallback(() => {
    if (!isTypingComplete.current && skippable) {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      setDisplayedText(message);
      isTypingComplete.current = true;
      onFinishTyping?.();
    } else if (isTypingComplete.current) {
      play("confirm"); // Play confirm sound when message is complete and tapped
      onPress?.();
    }
  }, [message, skippable, onFinishTyping, onPress, play]);

  return (
    <DQWindow style={styles.messageBoxContainer}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={skippable || isTypingComplete.current ? 0.7 : 1}
        style={[styles.messageBoxTouchable, { direction: isRTL ? "rtl" : "ltr" }]}
        accessibilityLabel={isTypingComplete.current ? "Message box, tap to continue" : "Message box, tap to skip typing"}
        accessibilityHint={isTypingComplete.current ? "Continues to the next action or message" : "Skips the current typing animation"}
      >
        <PixelText variant="body" color="textDefault" style={styles.messageBoxText}>
          {displayedText}
        </PixelText>
        {isTypingComplete.current && (
          <View style={[styles.messageBoxArrowContainer, { [isRTL ? "left" : "right"]: SPACING.sm }]}>
            <PixelText variant="body" color="textDefault" style={styles.messageBoxArrow}>
              ▼
            </PixelText>
          </View>
        )}
      </TouchableOpacity>
    </DQWindow>
  );
};

// --- DQCommandMenu Component ---
export type MenuItem = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

interface DQCommandMenuProps {
  items: MenuItem[];
  style?: View["props"]["style"];
}

export const DQCommandMenu: React.FC<DQCommandMenuProps> = React.memo(
  ({ items, style }) => {
    return (
      <DQWindow style={[styles.commandMenuContainer, style]}>
        <View style={styles.commandMenuItems}>
          {items.map((item, index) => (
            <PixelButton
              key={index}
              onPress={item.onPress}
              variant={item.variant || "primary"}
              disabled={item.disabled}
              style={styles.commandMenuButton}
            >
              {item.label}
            </PixelButton>
          ))}
        </View>
      </DQWindow>
    );
  },
);

// --- PixelPicker Component ---
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
  style?: View["props"]["style"];
  itemTextStyle?: Text["props"]["style"];
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
          styles.pickerModalItem,
          item.value === selectedValue && styles.pickerSelectedModalItem,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        onPress={() => handleItemPress(item.value)}
        accessibilityLabel={item.label}
        accessibilityState={{ selected: item.value === selectedValue }}
      >
        <PixelText
          variant="body"
          color={item.value === selectedValue ? "gold" : "textDefault"}
          style={[styles.pickerModalItemText, itemTextStyle]}
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
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: selectedIndex,
            animated: false,
            viewPosition: 0.5,
          });
        }, 100);
      }
    }
  }, [modalVisible, selectedValue, items]);

  return (
    <View style={[styles.pickerContainer, style, { direction: isRTL ? "rtl" : "ltr" }]}>
      {label && (
        <PixelText variant="label" color="textDefault" style={styles.pickerLabel}>
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
        <PixelText variant="body" color="textDefault" style={styles.pickerValueText}>
          {selectedLabel}
        </PixelText>
        <PixelText variant="body" color="textDefault" style={styles.pickerArrow}>
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
        <TouchableOpacity style={styles.pickerModalOverlay} activeOpacity={1} onPress={closePicker}>
          <View style={styles.pickerModalContent}>
            <FlatList
              ref={flatListRef}
              data={items}
              renderItem={renderItem}
              keyExtractor={(item, index) => `picker-item-${index}-${String(item.value)}`}
              style={styles.pickerFlatList}
              contentContainerStyle={styles.pickerFlatListContent}
              getItemLayout={(data, index) => ({
                length: 40,
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

// --- PixelSwitch Component ---
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
    play("buttonTap");
    onValueChange(!value);
  }, [disabled, onValueChange, value, triggerHaptic, play]);

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={[styles.switchContainer, style, { flexDirection: isRTL ? "row-reverse" : "row" }]}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: disabled }}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint || `Toggles ${label} ${value ? "off" : "on"}`}
    >
      <PixelText variant="body" color={disabled ? "gray" : "textDefault"} style={styles.switchLabel}>
        {label}
      </PixelText>
      <Switch
        trackColor={{ false: COLORS.darkGray, true: COLORS.success }}
        thumbColor={value ? COLORS.white : COLORS.gray}
        ios_backgroundColor={COLORS.darkGray}
        onValueChange={handleToggle}
        value={value}
        disabled={disabled}
        style={styles.switchControl}
      />
    </TouchableOpacity>
  );
};


// --- Styles ---
const styles = StyleSheet.create({
  // PixelText styles
  baseText: {
    // Default styles for all PixelText
  },
  heading: {
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * 1.2,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * 1.2,
  },
  subheading: {
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * 1.3,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.3,
  },
  body: {
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.4,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.3,
  },
  caption: {
    fontSize: FONT_SIZES.caption,
    lineHeight: FONT_SIZES.caption * 1.2,
  },

  // PixelButton styles
  buttonBase: {
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
  buttonTextBase: {
    fontFamily: FONT_FAMILY_MAIN,
    fontSize: FONT_SIZES.body,
    textAlign: "center",
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
    borderColor: COLORS.darkGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonTextDisabled: {
    color: COLORS.darkGray,
  },
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
  buttonText_primary: {
    color: COLORS.textDefault,
  },
  buttonText_secondary: {
    color: COLORS.textDefault,
  },
  buttonText_danger: {
    color: COLORS.textDefault,
  },
  buttonText_ghost: {
    color: COLORS.textDefault,
  },

  // PixelInput styles
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    marginBottom: SPACING.xs,
    fontSize: FONT_SIZES.sm,
  },
  inputBase: {
    backgroundColor: COLORS.inputBackground,
    ...PIXEL_BORDER,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT_FAMILY_MAIN,
    fontSize: FONT_SIZES.body,
    color: COLORS.textDefault,
    minHeight: 48,
  },
  inputErrorBorder: {
    borderColor: COLORS.danger,
  },
  inputErrorText: {
    marginTop: SPACING.xxs,
  },

  // PixelProgressBar styles
  progressBarContainer: {
    width: "100%",
    backgroundColor: COLORS.darkGray,
    ...PIXEL_BORDER,
    position: "relative",
    justifyContent: "center",
  },
  progressBarBackground: {
    position: "absolute",
    width: "100%",
    backgroundColor: COLORS.darkGray,
  },
  progressBarFill: {
    position: "absolute",
    left: 0,
  },
  progressBarValueText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: COLORS.textDefault,
    zIndex: 1,
  },

  // PixelCard styles
  cardBase: {
    backgroundColor: COLORS.bgCard,
    ...PIXEL_BORDER,
    padding: SPACING.md,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 4,
  },
  cardHighlighted: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.bgHighlight,
  },

  // DQWindow styles
  windowContainer: {
    position: "relative",
    backgroundColor: COLORS.windowBackground,
    ...PIXEL_BORDER,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 4,
  },
  windowTitleContainer: {
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
  windowTitleText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY_MAIN,
    color: COLORS.textDefault,
  },
  windowContent: {
    flex: 1,
  },

  // DQMessageBox styles
  messageBoxContainer: {
    minHeight: 80,
    justifyContent: "center",
    padding: SPACING.sm,
  },
  messageBoxTouchable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  messageBoxText: {
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.4,
    textAlign: "left",
  },
  messageBoxArrowContainer: {
    position: "absolute",
    bottom: SPACING.xs,
  },
  messageBoxArrow: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textDefault,
  },

  // DQCommandMenu styles
  commandMenuContainer: {
    padding: SPACING.sm,
  },
  commandMenuItems: {
    flexDirection: "column",
    gap: SPACING.xs,
  },
  commandMenuButton: {
    width: "100%",
  },

  // PixelPicker styles
  pickerContainer: {
    marginBottom: SPACING.md,
  },
  pickerLabel: {
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
  pickerValueText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: COLORS.textDefault,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY_MAIN,
  },
  pickerArrow: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDefault,
    position: "absolute",
    right: SPACING.sm,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContent: {
    backgroundColor: COLORS.windowBackground,
    ...PIXEL_BORDER,
    maxHeight: screenHeight * 0.7,
    width: "80%",
    overflow: "hidden",
  },
  pickerFlatList: {
    flexGrow: 0,
  },
  pickerFlatListContent: {
    paddingVertical: SPACING.xs,
  },
  pickerModalItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
    alignItems: "center",
  },
  pickerSelectedModalItem: {
    backgroundColor: COLORS.bgHighlight,
  },
  pickerModalItemText: {
    fontSize: FONT_SIZES.body,
    fontFamily: FONT_FAMILY_MAIN,
  },

  // PixelSwitch styles
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCard,
    ...PIXEL_BORDER,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  switchLabel: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  switchControl: {
    transform: Platform.OS === "android" ? [{ scale: 1.2 }] : [],
  },
});
