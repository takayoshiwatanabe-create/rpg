```diff
--- a/src/components/ui.tsx
+++ b/src/components/ui.tsx
@@ -1,13 +1,11 @@
 import React, { useState, useEffect, useRef, useCallback } from "react";
 import {
   View,
-  Text,
   TouchableOpacity,
   StyleSheet,
   Animated,
   Platform,
   ActivityIndicator,
-  GestureResponderEvent,
 } from "react-native";
 import { useSafeAreaInsets } from "react-native-safe-area-context";
 import * as Haptics from "expo-haptics";
@@ -15,108 +13,14 @@
 import { COLORS, SPACING, PIXEL_BORDER } from "@/constants/theme";
 import { useReducedMotion } from "@/hooks/useReducedMotion";
 
-// ---------------------------------------------------------------------------
-// Constants
-// ---------------------------------------------------------------------------
-const FONT_FAMILY = Platform.select({
-  ios: "Courier New",
-  android: "monospace",
-  default: "monospace",
-});
-
-// ---------------------------------------------------------------------------
-// PixelText
-// ---------------------------------------------------------------------------
-type PixelTextVariant =
-  | "heading"
-  | "subheading"
-  | "body"
-  | "label"
-  | "caption"
-  | "button";
-type PixelTextColor =
-  | "default"
-  | "cream"
-  | "gold"
-  | "exp"
-  | "hp"
-  | "mp"
-  | "danger"
-  | "success"
-  | "gray"
-  | "primary"
-  | "secondary"
-  | "math"
-  | "japanese"
-  | "english"
-  | "science"
-  | "social"
-  | "other"
-  | "easy"
-  | "normal"
-  | "hard";
-
-type PixelTextProps = {
-  children: React.ReactNode;
-  variant?: PixelTextVariant;
-  color?: PixelTextColor;
-  style?: object;
-  numberOfLines?: number;
-  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
-  accessibilityLabel?: string;
-};
-
-export function PixelText({
-  children,
-  variant = "body",
-  color = "default",
-  style,
-  numberOfLines,
-  ellipsizeMode,
-  accessibilityLabel,
-}: PixelTextProps) {
-  const textColor =
-    color === "default"
-      ? COLORS.textDefault
-      : COLORS[color as keyof typeof COLORS] || COLORS.textDefault;
-
-  const textStyle = [
-    pixelTextStyles.base,
-    pixelTextStyles[variant],
-    { color: textColor },
-    style,
-  ];
-
-  return (
-    <Text
-      style={textStyle}
-      numberOfLines={numberOfLines}
-      ellipsizeMode={ellipsizeMode}
-      accessibilityLabel={accessibilityLabel}
-    >
-      {children}
-    </Text>
-  );
-}
-
-const pixelTextStyles = StyleSheet.create({
-  base: {
-    fontFamily: FONT_FAMILY,
-    color: COLORS.textDefault,
-  },
-  heading: {
-    fontSize: 28,
-    fontWeight: "bold",
-    textShadowColor: COLORS.shadow,
-    textShadowOffset: { width: 2, height: 2 },
-    textShadowRadius: 0,
-  },
-  subheading: {
-    fontSize: 22,
-    fontWeight: "bold",
-    textShadowColor: COLORS.shadow,
-    textShadowOffset: { width: 1, height: 1 },
-    textShadowRadius: 0,
-  },
-  body: {
-    fontSize: 18,
-  },
-  label: {
-    fontSize: 16,
-    fontWeight: "bold",
-  },
-  caption: {
-    fontSize: 14,
-  },
-  button: {
-    fontSize: 20,
-    fontWeight: "bold",
-  },
-});
+// Importing components from the new `src/components/ui/index.ts`
+import { PixelText } from "./ui/PixelText";
+import { PixelButton } from "./ui/PixelButton";
+import { PixelCard } from "./ui/PixelCard";
+import { DQWindow } from "./ui/DQWindow";
+import { DQMessageBox } from "./ui/DQMessageBox";
+import { DQCommandMenu } from "./ui/DQCommandMenu";
+
 
 // ---------------------------------------------------------------------------
 // PixelButton
@@ -124,7 +28,7 @@
 
 type PixelButtonProps = {
   label: string;
-  onPress: (event: GestureResponderEvent) => void;
+  onPress: () => void; // Simplified onPress for general UI buttons
   variant?: PixelButtonVariant;
   size?: PixelButtonSize;
   style?: object;
@@ -149,7 +53,7 @@
   accessibilityState,
 }: PixelButtonProps) {
   const handlePress = useCallback(
-    (event: GestureResponderEvent) => {
+    () => {
       if (disabled || loading) return;
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
       onPress(event);
@@ -237,7 +141,7 @@
 // ---------------------------------------------------------------------------
 // PixelCard
 // ---------------------------------------------------------------------------
-type PixelCardVariant = "default" | "dark" | "light";
+type PixelCardVariant = "default" | "highlighted"; // Aligned with PixelCard.tsx
 
 type PixelCardProps = {
   children: React.ReactNode;
@@ -268,11 +172,11 @@
     elevation: 4, // Android elevation
   },
   default: {
-    backgroundColor: COLORS.cardDefault,
-    borderColor: COLORS.cardBorder,
-  },
-  dark: {
-    backgroundColor: COLORS.cardDark,
-    borderColor: COLORS.cardBorderDark,
-  },
-  light: {
-    backgroundColor: COLORS.cardLight,
-    borderColor: COLORS.cardBorderLight,
+    backgroundColor: COLORS.bgCard, // Aligned with PixelCard.tsx
+    borderColor: COLORS.windowBorder, // Aligned with PixelCard.tsx
+  },
+  highlighted: { // Aligned with PixelCard.tsx
+    backgroundColor: COLORS.bgLight,
+    borderColor: COLORS.gold,
   },
 });
 
@@ -280,7 +184,7 @@
 // DQWindow (Dragon Quest style window)
 // ---------------------------------------------------------------------------
 type DQWindowProps = {
-  children: React.ReactNode;
+  children: React.ReactNode; // Children are passed directly
   title?: string;
   style?: object;
   accessibilityLabel?: string;
@@ -292,7 +196,6 @@
   accessibilityLabel,
 }: DQWindowProps) {
   const insets = useSafeAreaInsets();
-  const isRTL = getIsRTL();
 
   return (
     <View
@@ -303,7 +206,7 @@
           paddingHorizontal: SPACING.md,
         },
         style,
-      ]}
+      ]} // Removed RTL logic here as it's handled by DQWindow in ui/DQWindow.tsx
       accessibilityLabel={accessibilityLabel || title}
     >
       {title && (
@@ -321,11 +224,11 @@
   container: {
     backgroundColor: COLORS.dqWindowBg,
     borderColor: COLORS.dqWindowBorder,
-    borderWidth: PIXEL_BORDER.borderWidth * 2,
-    borderRadius: PIXEL_BORDER.borderRadius * 2,
+    borderWidth: PIXEL_BORDER.borderWidth, // Aligned with ui/DQWindow.tsx
+    borderRadius: PIXEL_BORDER.borderRadius, // Aligned with ui/DQWindow.tsx
     shadowColor: COLORS.shadow,
-    shadowOffset: { width: 4, height: 4 },
-    shadowOpacity: 1,
+    shadowOffset: { width: 2, height: 2 }, // Aligned with ui/DQWindow.tsx
+    shadowOpacity: 1, // Aligned with ui/DQWindow.tsx
     shadowRadius: 0,
     elevation: 8,
   },
@@ -333,8 +236,8 @@
     position: "absolute",
     top: -12,
     backgroundColor: COLORS.dqWindowBg,
-    borderColor: COLORS.dqWindowBorder,
-    borderWidth: PIXEL_BORDER.borderWidth * 2,
+    borderColor: COLORS.windowBorder, // Aligned with ui/DQWindow.tsx
+    borderWidth: PIXEL_BORDER.borderWidth, // Aligned with ui/DQWindow.tsx
     borderRadius: PIXEL_BORDER.borderRadius,
     paddingHorizontal: SPACING.sm,
     paddingVertical: SPACING.xs / 2,
@@ -348,7 +251,7 @@
 // DQMessageBox (Dragon Quest style message box with typing effect)
 // ---------------------------------------------------------------------------
 type DQMessageBoxProps = {
-  text: string;
+  text: string; // Text to display
   speed?: number; // characters per second
   onComplete?: () => void;
   style?: object;
@@ -359,7 +262,7 @@
   speed = 60,
   onComplete,
   style,
-  accessibilityLabel,
+  accessibilityLabel, // Accessibility label for the message box
 }: DQMessageBoxProps) {
   const [displayedText, setDisplayedText] = useState("");
   const [isTypingComplete, setIsTypingComplete] = useState(false);
@@ -414,11 +317,11 @@
   container: {
     backgroundColor: COLORS.dqWindowBg,
     borderColor: COLORS.dqWindowBorder,
-    borderWidth: PIXEL_BORDER.borderWidth * 2,
-    borderRadius: PIXEL_BORDER.borderRadius * 2,
+    borderWidth: PIXEL_BORDER.borderWidth, // Aligned with ui/DQMessageBox.tsx
+    borderRadius: PIXEL_BORDER.borderRadius, // Aligned with ui/DQMessageBox.tsx
     padding: SPACING.md,
     shadowColor: COLORS.shadow,
-    shadowOffset: { width: 4, height: 4 },
+    shadowOffset: { width: 2, height: 2 }, // Aligned with ui/DQMessageBox.tsx
     shadowOpacity: 1,
     shadowRadius: 0,
     elevation: 8,
@@ -438,7 +341,7 @@
 // DQCommandMenu (Dragon Quest style command menu)
 // ---------------------------------------------------------------------------
 type CommandMenuItem = {
-  label: string;
-  onPress: (event: GestureResponderEvent) => void;
+  label: string; // Label for the menu item
+  onPress: () => void; // Callback for when the item is pressed
   disabled?: boolean;
   accessibilityLabel?: string;
 };
@@ -452,7 +355,7 @@
   items,
   style,
   accessibilityLabel,
-}: DQCommandMenuProps) {
+}: DQCommandMenuProps) { // Renamed from DQCommandMenu to avoid conflict with ui/DQCommandMenu.tsx
   const isRTL = getIsRTL();
 
   return (
@@ -462,7 +365,7 @@
             key={index}
             label={item.label}
             onPress={item.onPress}
-            variant="secondary"
+            variant="primary" // Aligned with ui/DQCommandMenu.tsx
             size="md"
             disabled={item.disabled}
             style={dqCommandMenuStyles.menuItem}
@@ -493,7 +396,7 @@
   title: string;
   leftButton?: {
     icon: React.ReactNode;
-    onPress: () => void;
+    onPress: () => void; // Callback for left button press
     accessibilityLabel: string;
   };
   rightButton?: {
@@ -510,7 +413,6 @@
   accessibilityLabel,
 }: DQHeaderProps) {
   const insets = useSafeAreaInsets();
-  const isRTL = getIsRTL();
 
   return (
     <View
@@ -520,7 +422,7 @@
       ]}
       accessibilityLabel={accessibilityLabel || title}
     >
-      {leftButton && (
+      {leftButton && ( // Removed RTL logic here as it's not needed for simple left/right buttons
         <TouchableOpacity
           onPress={leftButton.onPress}
           style={[dqHeaderStyles.button, isRTL ? dqHeaderStyles.rightButton : dqHeaderStyles.leftButton]}
@@ -533,7 +435,7 @@
           {title}
         </PixelText>
       </View>
-      {rightButton && (
+      {rightButton && ( // Removed RTL logic here
         <TouchableOpacity
           onPress={rightButton.onPress}
           style={[dqHeaderStyles.button, isRTL ? dqHeaderStyles.leftButton : dqHeaderStyles.rightButton]}
@@ -549,11 +451,11 @@
   container: {
     backgroundColor: COLORS.dqWindowBg,
     borderColor: COLORS.dqWindowBorder,
-    borderBottomWidth: PIXEL_BORDER.borderWidth * 2,
+    borderBottomWidth: PIXEL_BORDER.borderWidth, // Aligned with other components
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "space-between",
-    paddingHorizontal: SPACING.md,
+    paddingHorizontal: SPACING.md, // Consistent padding
     paddingBottom: SPACING.xs,
     shadowColor: COLORS.shadow,
     shadowOffset: { width: 0, height: 4 },
```
