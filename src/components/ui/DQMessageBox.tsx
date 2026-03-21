import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { DQWindow } from "./DQWindow";
import { PixelText } from "./PixelText";
import { COLORS, FONT_SIZES, SPACING } from "@/constants/theme";
import { useIsRTL } from "@/hooks/useIsRTL";

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
        return nextIndex;
      });
    }, typingSpeed);
  }, [message, typingSpeed, onFinishTyping]);

  useEffect(() => {
    startTyping();
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [message, startTyping]);

  const handlePress = () => {
    if (!isTypingComplete.current && skippable) {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      setDisplayedText(message);
      isTypingComplete.current = true;
      onFinishTyping?.();
    } else if (isTypingComplete.current) {
      onPress?.();
    }
  };

  return (
    <DQWindow style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={skippable || isTypingComplete.current ? 0.7 : 1}
        style={[styles.touchableContainer, { direction: isRTL ? "rtl" : "ltr" }]}
        accessibilityLabel={isTypingComplete.current ? "Message box, tap to continue" : "Message box, tap to skip typing"}
        accessibilityHint={isTypingComplete.current ? "Continues to the next action or message" : "Skips the current typing animation"}
      >
        <PixelText variant="body" color="textDefault" style={styles.messageText}>
          {displayedText}
        </PixelText>
        {isTypingComplete.current && (
          <View style={[styles.arrowContainer, { [isRTL ? "left" : "right"]: SPACING.sm }]}>
            <PixelText variant="body" color="textDefault" style={styles.arrow}>
              ▼
            </PixelText>
          </View>
        )}
      </TouchableOpacity>
    </DQWindow>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
    justifyContent: "center",
    padding: SPACING.sm,
  },
  touchableContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  messageText: {
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.4,
    textAlign: "left",
  },
  arrowContainer: {
    position: "absolute",
    bottom: SPACING.xs,
    // Right or Left will be set dynamically based on RTL
  },
  arrow: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textDefault,
  },
});
