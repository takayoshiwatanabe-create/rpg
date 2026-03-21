import { Platform } from "react-native";

// --- Colors ---
export const COLORS = {
  primary: "#4CAF50", // Green, main action color
  primaryDark: "#2E7D32", // Darker green for shadows
  secondary: "#6A5ACD", // Slate Blue, less important actions
  gold: "#FFD700", // Main accent, hero name, important info
  goldDark: "#B8860B", // Darker gold for shadows
  goldLight: "#FFEB3B", // Lighter gold for highlights
  textDefault: "#FFFDD0", // General text, default (renamed from cream for clarity)
  gray: "#AAAAAA", // Secondary text, placeholders
  darkGray: "#666666", // Borders, disabled elements
  white: "#FFFFFF", // For specific UI elements
  black: "#000000", // For specific UI elements
  bgCard: "#333333", // Background for cards/panels
  bgHighlight: "#444444", // Highlighted background for cards/panels
  windowBackground: "#222222", // Background for main windows/dialogs
  windowBorder: "#555555", // Border for main windows/dialogs
  inputBackground: "#1A1A1A", // Background for input fields
  battleBackground: "#4682B4", // SteelBlue for battle scenes

  // Semantic colors
  success: "#32CD32", // Green for success (e.g., EXP gain)
  danger: "#FF4500", // Red for errors, destructive actions (e.g., HP, delete)
  warning: "#FF8C00", // Orange for warnings (e.g., low HP)
  info: "#1E90FF", // Blue for informational messages
  exp: "#32CD32", // Specific for EXP progress bars
  hp: "#FF4500", // Specific for HP progress bars
  mp: "#1E90FF", // Specific for MP progress bars
};

// --- Fonts ---
export const FONT_FAMILY_MAIN = Platform.select({
  ios: "PressStart2P", // Custom font for iOS
  android: "PressStart2P", // Custom font for Android
  default: "monospace", // Fallback for web
});

export const FONT_FAMILY_SUB = Platform.select({
  ios: "DotGothic16", // Custom font for iOS
  android: "DotGothic16", // Custom font for Android
  default: "sans-serif", // Fallback for web
});

export const FONT_SIZES = {
  caption: 10,
  sm: 12,
  body: 16,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 36,
  xxxl: 48,
};

// --- Spacing ---
export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// --- Pixel Border Style ---
export const PIXEL_BORDER = {
  borderWidth: 2,
  borderColor: COLORS.darkGray,
};

// --- Global Styles (Optional, for common patterns) ---
export const GLOBAL_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
  },
  // Add other common styles here
});
