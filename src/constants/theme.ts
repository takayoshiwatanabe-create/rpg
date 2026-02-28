import { StyleSheet } from "react-native";

/**
 * Theme constants for the 8-bit RPG style.
 * All colors and spacing values are defined here for consistency.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const COLORS = {
  // Backgrounds
  bgDark: "#0D0D1A",
  bgMid: "#1A1A2E",
  bgLight: "#2D2D4A",
  bgCard: "#16213E",

  // Primary UI elements
  gold: "#FFD700", // Main accent color for important text, currency
  goldDark: "#B8860B", // Darker gold for shadows
  goldLight: "#FFF176", // Lighter gold for highlights
  cream: "#F5F5DC", // General text color
  gray: "#A9A9A9", // Secondary text, disabled elements
  grayDark: "#696969", // Darker gray for shadows/borders

  // Pixel art borders
  pixelBorder: "#5C5C5C",
  pixelBorderDark: "#3A3A3A",

  // Status/Game elements
  hp: "#FF4500", // Health points (red-orange)
  mp: "#1E90FF", // Magic points (dodger blue)
  exp: "#32CD32", // Experience points (lime green)
  danger: "#DC143C", // Error messages, destructive actions
  success: "#3CB371", // Success messages

  // Button variants
  buttonPrimary: "#4A4A6A",
  buttonSecondary: "#2A2A3A",

  // Subject colors (for quest categorization)
  math: "#FF6347", // Tomato
  japanese: "#DA70D6", // Orchid
  english: "#4682B4", // SteelBlue
  science: "#3CB371", // MediumSeaGreen
  social: "#FFD700", // Gold
  other: "#94A3B8", // SlateGray

  // Difficulty colors (for quest difficulty)
  easy: "#32CD32", // LimeGreen
  normal: "#1E90FF", // DodgerBlue
  hard: "#FF4500", // OrangeRed
  boss: "#DC143C", // Crimson

  // Basic
  white: "#FFFFFF",

  // Dragon Quest UI
  dqBlue: "#0000AA",
  dqBorder: "#FFFFFF",
  dqText: "#FFFFFF",
  dqCursor: "#FFD700",
  dqBattleBg: "#000000",
} as const; // `as const` makes this a readonly tuple, improving type safety

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Font Sizes
// ---------------------------------------------------------------------------

export const FONT_SIZES = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 26,
  xxl: 32,
  title: 40,
} as const;

// ---------------------------------------------------------------------------
// Pixel Border
// ---------------------------------------------------------------------------

export const PIXEL_BORDER = {
  borderWidth: 2,
  borderRadius: 4,
  borderColor: COLORS.pixelBorder,
} as const;

// ---------------------------------------------------------------------------
// Shadow
// ---------------------------------------------------------------------------

export const SHADOW = {
  shadowColor: COLORS.goldDark,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
} as const;

// ---------------------------------------------------------------------------
// Global Styles (can be extended by individual components)
// ---------------------------------------------------------------------------

export const GLOBAL_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  textBase: {
    fontFamily: "monospace", // Use a pixel-art friendly font
    color: COLORS.cream,
  },
  heading: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.gold,
  },
  subheading: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    color: COLORS.cream,
  },
  body: {
    fontSize: FONT_SIZES.md,
    color: COLORS.cream,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  // Add more global styles as needed
});
