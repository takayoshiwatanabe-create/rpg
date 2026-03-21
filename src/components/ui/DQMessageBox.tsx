import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Platform, TouchableOpacity } from "react-native"; // Added TouchableOpacity
import { PixelText } from "./PixelText";
import { PixelCard } from "./PixelCard";
import { SPACING, FONT_SIZES, COLORS } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { getIsRTL } from "@/i18n"; // Import getIsRTL

type DQMessageBoxProps = {
  text: string;
  speed?: number; // milliseconds per character
  variant?: "default" | "error" | "info";
  onComplete?: () => void;
  skippable?: boolean; // Added skippable prop
};

export const DQMessageBox = React.memo(
  ({ text, speed = 50, variant = "default", onComplete, skippable = true }: DQMessageBoxProps) => {
    const [displayedText, setDisplayedText] = useState("");
    const currentIndex = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingComplete = useRef(false); // Track if typing is complete
    const isRTL = getIsRTL();

    const completeTyping = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setDisplayedText(text);
      currentIndex.current = text.length;
      isTypingComplete.current = true;
      onComplete?.();
    };

    const startTyping = () => {
      currentIndex.current = 0;
      setDisplayedText("");
      isTypingComplete.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        if (currentIndex.current < text.length) {
          setDisplayedText((prev) => prev + text[currentIndex.current]);
          currentIndex.current++;
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          completeTyping(); // Call completeTyping to set isTypingComplete and call onComplete
        }
      }, speed);
    };

    useEffect(() => {
      startTyping();
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [text, speed]); // Restart typing if text or speed changes

    const textColor =
      variant === "error"
        ? COLORS.danger
        : variant === "info"
          ? COLORS.info
          : COLORS.cream;

    const handlePress = () => {
      if (skippable && !isTypingComplete.current) {
        completeTyping();
      } else if (isTypingComplete.current) {
        onComplete?.(); // If typing is complete, a tap can trigger the next action
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={skippable || isTypingComplete.current ? 0.7 : 1} // Only show active opacity if skippable or complete
        style={[styles.touchableContainer, { direction: isRTL ? "rtl" : "ltr" }]}
      >
        <PixelCard variant="default" style={styles.container}>
          <PixelText variant="body" color={textColor} style={styles.text}>
            {displayedText}
          </PixelText>
          {!isTypingComplete.current && (
            <View style={[styles.typingIndicator, {
              [isRTL ? "left" : "right"]: SPACING.sm, // Position indicator based on RTL
            }]}>
              <PixelText variant="caption" color="gold">
                ▼
              </PixelText>
            </View>
          )}
        </PixelCard>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  touchableContainer: {
    width: "100%", // Ensure TouchableOpacity takes full width
  },
  container: {
    padding: SPACING.md,
    minHeight: 80, // Ensure consistent height
    justifyContent: "center",
    position: "relative", // For positioning the typing indicator
  },
  text: {
    fontSize: FONT_SIZES.lg, // Use FONT_SIZES.lg for body text
    lineHeight: FONT_SIZES.lg * 1.4,
  },
  typingIndicator: {
    position: "absolute",
    bottom: SPACING.xs,
    // Right or Left will be set dynamically based on RTL
  },
});
