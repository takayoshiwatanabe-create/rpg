export const COLORS = {
  bgDark: "#0D0D1A",
  bgMid: "#1A1A2E",
  bgLight: "#2D2D4A",
  bgCard: "#16213E",

  gold: "#FFD700",
  goldDark: "#B8860B",
  goldLight: "#FFF176",

  hp: "#FF4444",
  hpBg: "#660000",
  mp: "#4488FF",
  mpBg: "#002266",
  exp: "#44CC44",
  expBg: "#005500",

  white: "#FFFFFF",
  cream: "#F0E68C",
  gray: "#888899",
  grayDark: "#555566",

  pixelBorder: "#F0E68C",
  pixelBorderDark: "#8B7536",
  buttonPrimary: "#3A1F00",
  buttonSecondary: "#1A2A3A",

  easy: "#44CC44",
  normal: "#4488FF",
  hard: "#FF8800",
  boss: "#CC44CC",

  pending: "#888899",
  inProgress: "#FFD700",
  completed: "#44CC44",
  failed: "#FF4444",

  math: "#FF6B6B",
  japanese: "#C084FC",
  english: "#60A5FA",
  science: "#34D399",
  social: "#FBBF24",
  other: "#94A3B8",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  title: 40,
} as const;

export const PIXEL_BORDER = {
  borderWidth: 2,
  borderColor: COLORS.pixelBorder,
  borderRadius: 0,
} as const;

export const SHADOW = {
  shadowColor: COLORS.gold,
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 0,
  elevation: 4,
} as const;
