import React from "react";
import { View, StyleSheet } from "react-native";
import { PixelButton } from "./PixelButton";
import { PixelCard } from "./PixelCard";
import { SPACING } from "@/constants/theme";

export type MenuItem = {
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  disabled?: boolean;
};

type DQCommandMenuProps = {
  items: MenuItem[];
  style?: object;
};

export const DQCommandMenu = React.memo(
  ({ items, style }: DQCommandMenuProps) => {
    return (
      <PixelCard variant="default" style={[styles.container, style]}>
        <View style={styles.menuItems}>
          {items.map((item, index) => (
            <PixelButton
              key={index}
              label={item.label}
              onPress={item.onPress}
              variant={item.isDestructive ? "danger" : "primary"}
              size="lg"
              style={styles.menuButton}
              disabled={item.disabled}
            />
          ))}
        </View>
      </PixelCard>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  menuItems: {
    gap: SPACING.sm,
  },
  menuButton: {
    width: "100%",
  },
});

