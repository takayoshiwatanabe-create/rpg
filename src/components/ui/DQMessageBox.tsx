import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, Platform } from "react-native";
import { COLORS, FONT_SIZES, PIXEL_BORDER, SPACING } from "@/constants/theme";
import { PixelText } from "./PixelText";
import { getIsRTL } from "@/i18n";

type DQMessageBoxProps = {
  text: string;
  onComplete?: () => void;
  speed?: number;
  autoClose?: boolean;
  style?: object;
};

export function DQMessageBox({
  text,
  onComplete,
  speed = 50,
  autoClose = false,
  style,
}: DQMessageBoxProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const arrowAnim = useRef(new Animated.Value(1)).current;
  const charIndex = useRef(0);
  const isRTL = getIsRTL();

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setIsComplete(false);
    charIndex.current = 0;

    const interval = setInterval(() => {
      charIndex.current += 1;
      if (charIndex.current <= text.length) {
        setDisplayedText(text.slice(0, charIndex.current));
      } else {
        clearInterval(interval);
        setIsComplete(true);
        if (autoClose && onComplete) {
          setTimeout(onComplete, 1000);
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, autoClose, onComplete]);

  // Arrow blink animation
  useEffect(() => {
    if (!isComplete) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [isComplete, arrowAnim]);

  const handlePress = () => {
    if (isComplete && onComplete) {
      onComplete();
    } else if (!isComplete) {
      // Skip typewriter — show all text immediately
      charIndex.current = text.length;
      setDisplayedText(text);
      setIsComplete(true);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.outer, style, { direction: isRTL ? "rtl" : "ltr" }]}
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityRole="text"
    >
      <View style={styles.inner}>
        <View style={styles.content}>
          <PixelText style={styles.text} variant="body">{displayedText}</PixelText>
          {isComplete && (
            <Animated.Text style={[styles.arrow, { opacity: arrowAnim, textAlign: isRTL ? "left" : "right" }]}>
              {isRTL ? "▲" : "▼"}
            </Animated.Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: PIXEL_BORDER.borderWidth + 1,
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
    borderColor: COLORS.dqInnerBorder,
    borderRadius: PIXEL_BORDER.borderRadius - 1,
    margin: PIXEL_BORDER.borderWidth / 2,
  },
  content: {
    padding: SPACING.sm,
    minHeight: FONT_SIZES.md * 3 + SPACING.sm * 2, // Ensure enough height for 3 lines of text + padding
    justifyContent: "space-between",
  },
  text: {
    color: COLORS.dqText,
    fontSize: FONT_SIZES.md,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    lineHeight: FONT_SIZES.md * 1.5, // Adjust line height for readability
    letterSpacing: 0.5,
  },
  arrow: {
    color: COLORS.dqText,
    fontSize: FONT_SIZES.sm,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
    marginTop: SPACING.xs,
  },
});
