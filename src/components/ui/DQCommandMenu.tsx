import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";

type MenuItem = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type DQCommandMenuProps = {
  items: MenuItem[];
  style?: object;
};

export function DQCommandMenu({ items, style }: DQCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const cursorAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [cursorAnim]);

  return (
    <View style={[styles.outer, style]}>
      <View style={styles.inner}>
        <View style={styles.content}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                setSelectedIndex(index);
                if (!item.disabled) item.onPress();
              }}
              disabled={item.disabled}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Animated.Text
                style={[
                  styles.cursor,
                  {
                    opacity: index === selectedIndex ? cursorAnim : 0,
                  },
                ]}
              >
                {"▶"}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.label,
                  item.disabled && styles.labelDisabled,
                ]}
              >
                {item.label}
              </Animated.Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const DQ_BLUE = "#0000AA";
const DQ_BORDER = "#FFFFFF";
const DQ_INNER_BORDER = "#000066";
const DQ_CURSOR = "#FFD700";

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
    gap: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cursor: {
    color: DQ_CURSOR,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    width: 24,
    textAlign: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  labelDisabled: {
    color: "#666688",
  },
});
