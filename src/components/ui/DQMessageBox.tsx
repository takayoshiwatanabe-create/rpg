import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, Platform } from "react-native";

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
      style={[styles.outer, style]}
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityRole="text"
    >
      <View style={styles.inner}>
        <View style={styles.content}>
          <Animated.Text style={styles.text}>{displayedText}</Animated.Text>
          {isComplete && (
            <Animated.Text style={[styles.arrow, { opacity: arrowAnim }]}>
              {"▼"}
            </Animated.Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const DQ_BLUE = "#0000AA";
const DQ_BORDER = "#FFFFFF";
const DQ_INNER_BORDER = "#000066";

const FONT_FAMILY = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

const styles = StyleSheet.create({
  outer: {
    borderWidth: 3,
    borderColor: DQ_BORDER,
    borderRadius: 4,
    backgroundColor: DQ_BLUE,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 4,
  },
  inner: {
    borderWidth: 2,
    borderColor: DQ_INNER_BORDER,
    borderRadius: 2,
    margin: 2,
  },
  content: {
    padding: 12,
    minHeight: 60,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  arrow: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: "right",
    marginTop: 4,
  },
});
