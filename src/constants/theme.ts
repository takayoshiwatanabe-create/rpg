import { Platform } from "react-native";

export const COLORS = {
  // Backgrounds
  bgDark: "#000011",
  bgMid: "#000033",
  bgLight: "#000055",
  bgCard: "#000077",

  // Text colors
  gold: "#FFD700", // Main accent, hero name, important info
  goldDark: "#B8860B", // Darker gold for shadows
  goldLight: "#FFEB3B", // Lighter gold for highlights
  cream: "#FFFDD0", // General text, default
  gray: "#AAAAAA", // Secondary text, placeholders
  darkGray: "#666666", // Borders, disabled elements
  white: "#FFFFFF", // For specific UI elements

  // Status/semantic colors
  primary: "#00BFFF", // Info, active elements (e.g., inProgress quest)
  primaryDark: "#008ECC", // Darker primary
  secondary: "#6A5ACD", // Less important actions
  success: "#32CD32", // Green for success (e.g., EXP gain)
  danger: "#FF4500", // Red for errors, destructive actions (e.g., HP, delete)
  warning: "#FF8C00", // Orange for warnings
  info: "#1E90FF", // Blue for informational messages
  exp: "#32CD32", // Specific for EXP
  hp: "#FF4500", // Specific for HP
  mp: "#1E90FF", // Specific for MP

  // Subject colors
  math: "#FF6347", // Tomato
  japanese: "#4682B4", // SteelBlue
  english: "#DAA520", // Goldenrod
  science: "#3CB371", // MediumSeaGreen
  social: "#8A2BE2", // BlueViolet (Changed from social_studies to social)
  art: "#FF69B4", // HotPink
  music: "#BA55D3", // MediumOrchid
  pe: "#20B2AA", // LightSeaGreen
  other: "#696969", // DimGray

  // Difficulty colors
  easy: "#32CD32", // LimeGreen
  normal: "#1E90FF", // DodgerBlue
  hard: "#FF8C00", // DarkOrange
  very_hard: "#FF4500", // OrangeRed
  boss: "#DC143C", // Crimson
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  caption: 12,
  label: 14,
  body: 16,
  button: 18,
  title: 20,
  heading: 24,
  xl: 20, // Added explicit xl for consistency with design spec's usage in HeroStatus
  lg: 18, // Added explicit lg for consistency
  md: 16, // Added explicit md for consistency
  sm: 14, // Added explicit sm for consistency
  xs: 12, // Added explicit xs for consistency
  heroName: 28, // This is already defined, but ensuring it's clear
  level: 32, // This is already defined, but ensuring it's clear
  gold: 28, // This is already defined, but ensuring it's clear
};

export const PIXEL_BORDER = {
  borderWidth: 2,
  borderRadius: 4,
};

export const SHADOWS = {
  text: {
    textShadowColor: COLORS.goldDark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  box: {
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
};

export const FONT_FAMILY_MAIN = Platform.select({
  ios: "Press Start 2P", // Placeholder, actual pixel font needs to be loaded
  android: "PressStart2P", // Placeholder
  default: "Press Start 2P", // Placeholder
});

export const FONT_FAMILY_SUB = Platform.select({
  ios: "DotGothic16", // Placeholder, actual pixel font needs to be loaded
  android: "DotGothic16", // Placeholder
  default: "DotGothic16", // Placeholder
});
