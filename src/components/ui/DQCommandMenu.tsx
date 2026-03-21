import React from "react";
import { View, StyleSheet } from "react-native";
import { PixelButton } from "./PixelButton";
import { DQWindow } from "./DQWindow";
import { SPACING } from "@/constants/theme";

export type MenuItem = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

interface DQCommandMenuProps {
  items: MenuItem[];
  style?: object;
}

export const DQCommandMenu: React.FC<DQCommandMenuProps> = React.memo(
  ({ items, style }) => {
    return (
      <DQWindow style={[styles.container, style]}>
        <View style={styles.menuItems}>
          {items.map((item, index) => (
            <PixelButton
              key={index}
              onPress={item.onPress}
              variant={item.variant || "primary"}
              disabled={item.disabled}
              style={styles.menuButton}
              accessibilityLabel={item.label}
            >
              {item.label}
            </PixelButton>
          ))}
        </View>
      </DQWindow>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    padding: SPACING.sm,
  },
  menuItems: {
    flexDirection: "column",
    gap: SPACING.xs,
  },
  menuButton: {
    width: "100%",
  },
});
