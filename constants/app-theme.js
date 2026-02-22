/**
 * Application Theme
 *
 * Defines colors, spacing, typography, and other design tokens
 * for the Sudoku NFC application.
 *
 * Design: Dark theme with blue/purple accents, minimal and clean.
 */

// ============================================================================
// COLORS
// ============================================================================

export const Colors = {
  // Primary background - very dark blue/gray
  background: "#0d0e14",

  // Card/Surface background - slightly lighter
  surface: "#1a1b24",

  // Grid cell backgrounds
  cellBackground: "#252736",
  cellBackgroundAlt: "#2a2c3e", // Alternate for 3x3 box distinction

  // Selection and highlights
  selectedCell: "#5a5d8a",
  highlightedCell: "#3d3f5c",
  sameNumberHighlight: "#2d2f45",

  // Accent colors
  primary: "#7c7fba",
  primaryLight: "#9a9dd4",
  accent: "#6366f1", // Bright purple/blue for buttons

  // Text colors
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  textOnPrimary: "#ffffff",

  // Number colors
  numberFixed: "#ffffff", // Original puzzle numbers
  numberUser: "#7c7fba", // User-entered numbers
  numberNotes: "#6b7280", // Pencil notes

  // Error/Conflict colors
  error: "#ef4444",
  errorBackground: "rgba(239, 68, 68, 0.2)",

  // Success colors
  success: "#22c55e",
  successBackground: "rgba(34, 197, 94, 0.2)",

  // Border colors
  borderLight: "#3d3f5c",
  borderMedium: "#4a4d6e",
  borderHeavy: "#6366f1",

  // Grid borders
  gridBorderThin: "#3d3f5c",
  gridBorderThick: "#6b7280",

  // Button colors
  buttonPrimary: "#6366f1",
  buttonSecondary: "#2a2c3e",
  buttonDisabled: "#1f2029",
  buttonText: "#ffffff",
  buttonTextSecondary: "#9ca3af",

  // Status colors
  timerBackground: "#1a3a3a",
  timerText: "#4ade80",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.7)",

  // Icon colors
  icon: "#9ca3af",
  iconActive: "#ffffff",
};

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Screen padding
  screenHorizontal: 20,
  screenVertical: 16,

  // Grid specific
  gridGap: 1,
  cellPadding: 2,
  boxGap: 3,
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    title: 28,
    display: 36,
  },

  // Font weights
  fontWeight: {
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// ============================================================================
// SHADOWS
// ============================================================================

export const Shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ============================================================================
// GRID DIMENSIONS
// ============================================================================

export const GridDimensions = {
  // Cell size will be calculated based on screen width
  // These are base values for reference
  minCellSize: 32,
  maxCellSize: 48,
  cellAspectRatio: 1,

  // Number of cells
  gridSize: 9,
  boxSize: 3,
};

// ============================================================================
// ANIMATION
// ============================================================================

export const Animation = {
  duration: {
    fast: 100,
    normal: 200,
    slow: 300,
  },
  easing: {
    default: "ease-in-out",
  },
};

// ============================================================================
// Z-INDEX
// ============================================================================

export const ZIndex = {
  base: 0,
  cell: 1,
  selected: 2,
  modal: 100,
  toast: 200,
};

// ============================================================================
// COMBINED THEME OBJECT
// ============================================================================

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  typography: Typography,
  borderRadius: BorderRadius,
  shadows: Shadows,
  gridDimensions: GridDimensions,
  animation: Animation,
  zIndex: ZIndex,
};

export default Theme;
