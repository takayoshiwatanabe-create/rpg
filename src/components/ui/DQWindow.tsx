import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { PixelText } from "./PixelText";

type DQWindowProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
};

export function DQWindow({ children, style, title }: DQWindowProps) {
  return (
    <View style={[styles.outer, style]}>
      <View style={styles.inner}>
        {title && (
          <View style={styles.titleBar}>
            <PixelText variant="caption" style={styles.titleText}>
              {title}
            </PixelText>
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const DQ_BLUE = "#0000AA";
const DQ_BORDER = "#FFFFFF";
const DQ_INNER_BORDER = "#000066";

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
  titleBar: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
  },
  titleText: {
    color: "#AAAAFF",
    fontSize: 11,
    letterSpacing: 1,
  },
  content: {
    padding: 12,
  },
});
