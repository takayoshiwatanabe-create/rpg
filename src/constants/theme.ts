import { Platform } from "react-native";

export const COLORS = {
  // Backgrounds
  bgDark: "#0D0D1A",
  bgMid: "#1A1A2E",
  bgLight: "#2D2D4A",
  bgCard: "#16213E",

  // Primary/Accent
  gold: "#FFD700", // Main accent color (e.g., hero name, important text)
  goldDark: "#B8860B", // Shadow for gold
  goldLight: "#FFF176", // Lighter gold for highlights

  // Text colors
  cream: "#F0E6D2", // Default text color
  gray: "#AAAACC", // Secondary text, hints
  darkGray: "#333333", // Used in some UI elements like HP bar background

  // Status/Semantic colors
  primary: "#228B22", // Green for positive actions, main buttons
  secondary: "#4682B4", // Steel blue for secondary actions
  danger: "#FF4500", // Red-orange for warnings, HP, destructive actions
  info: "#1E90FF", // Dodger blue for informational, MP
  exp: "#32CD32", // Lime green for EXP
  success: "#3CB371", // Medium sea green for success messages
  warning: "#FFD700", // Gold for warnings (can overlap with primary accent)

  // Specific UI elements
  windowBorder: "#5C5C5C", // Border for DQ-style windows/cards
  shadow: "#000000", // General shadow color

  // Subject colors (for quests)
  math: "#FF6347", // Tomato
  english: "#4682B4", // SteelBlue
  science: "#3CB371", // MediumSeaGreen
  history: "#D2B48C", // Tan
  art: "#DA70D6", // Orchid
  other: "#6A5ACD", // SlateBlue
  normal: "#808080", // Gray for normal difficulty
  easy: "#90EE90", // LightGreen for easy difficulty
  hard: "#FF6347", // Tomato for hard difficulty
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  title: 32, // For main screen titles
  heading: 24, // For section headings
  body: 18, // Default text size
  label: 16, // For labels, smaller text
  caption: 14, // Smallest text for details
};

export const PIXEL_BORDER = {
  borderWidth: 2,
  borderRadius: 4,
};

export const FONT_FAMILY_MAIN = Platform.select({
  ios: "PressStart2P",
  android: "PressStart2P",
  default: "PressStart2P",
});

export const FONT_FAMILY_SUB = Platform.select({
  ios: "DotGothic16",
  android: "DotGothic16",
  default: "DotGothic16",
});

