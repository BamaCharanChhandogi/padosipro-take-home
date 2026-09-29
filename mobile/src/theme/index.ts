/**
 * PadosiPro Design Tokens
 * Extracted directly from production screenshots
 */
export const Colors = {
  // App background
  darkBg: "#1F242D",
  cardBg: "#FAFAF8",
  cardBorder: "#E2E8F0",
  
  // Brand Greens
  primaryGreen: "#175440",       // Active action buttons
  primaryGreenDark: "#0F3A2C",   // Header & logo background
  buttonDisabled: "#8BAA9E",     // Inactive / verifying button
  mintSelectedBg: "#EBF7F0",     // Expanded category card background
  mintBorder: "#175440",

  // Accents & State
  amberAccent: "#D97706",        // Focus border highlight, city tag
  amberTag: "#B45309",
  textPrimary: "#0F172A",        // Main titles, bold headers
  textSecondary: "#475569",      // Body copy, subtitles
  textMuted: "#94A3B8",          // Placeholders, disabled text
  errorText: "#DC2626",          // Error alert text
  errorBg: "#FEF2F2",
  errorBorder: "#FCA5A5",

  // Card & Chips
  white: "#FFFFFF",
  chipBg: "#FFFFFF",
  chipBorder: "#E2E8F0",
  selectedChipBg: "#175440",
  selectedChipText: "#FFFFFF",
  
  // Status & Danger
  dangerRed: "#DC2626",
  dangerBorder: "#F87171",
  dangerBg: "#FEF2F2",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  cardPadding: 20,
};

export const Typography = {
  fontFamily: undefined, // Uses native system font (San Francisco / Roboto) for pixel clarity
  titleLarge: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  bodyRegular: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
};
