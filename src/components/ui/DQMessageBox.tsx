import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { PixelText } from "./PixelText";
import { PixelCard } from "./PixelCard";
import { SPACING, FONT_SIZES, COLORS } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { getIsRTL } from "@/i18n";
import { MESSAGE_TYPING_SPEED_MS } from "@/constants/game"; // Import from game constants

type DQMessageBoxProps = {
  text: string;
  speed?: number; // milliseconds per character
  variant?: "default" | "error" | "info";
  onComplete?: () => void;
  skippable?: boolean;
};

export const DQMessageBox = React.memo(
  ({ text, speed = MESSAGE_TYPING_SPEED_MS, variant = "default", onComplete, skippable = true }: DQMessageBoxProps) => {
    const [displayedText, setDisplayedText] = useState("");
    const currentIndex = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingComplete = useRef(false);
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
          completeTyping();
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
    }, [text, speed]);

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
        onComplete?.();
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={skippable || isTypingComplete.current ? 0.7 : 1}
        style={[styles.touchableContainer, { direction: isRTL ? "rtl" : "ltr" }]}
        accessibilityLabel={isTypingComplete.current ? "Message box, tap to continue" : "Message box, tap to skip typing"}
        accessibilityHint={isTypingComplete.current ? "Continues to the next action or message" : "Skips the current typing animation"}
      >
        <PixelCard variant="default" style={styles.container}>
          <PixelText variant="body" color={textColor} style={styles.text}>
            {displayedText}
          </PixelText>
          {!isTypingComplete.current && (
            <View style={[styles.typingIndicator, {
              [isRTL ? "left" : "right"]: SPACING.sm,
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
    width: "100%",
  },
  container: {
    padding: SPACING.md,
    minHeight: 80,
    justifyContent: "center",
    position: "relative",
  },
  text: {
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * 1.4,
  },
  typingIndicator: {
    position: "absolute",
    bottom: SPACING.xs,
  },
});
