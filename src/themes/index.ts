import type { SegmentColor } from "../types.js";

/**
 * Dark theme colors (matching claude-limitline)
 */
export const darkTheme = {
  directory: { bg: "#8b4513", fg: "#ffffff" },   // Brown, white
  git: { bg: "#404040", fg: "#ffffff" },         // Dark gray, white
  model: { bg: "#2d2d2d", fg: "#ffffff" },       // Very dark gray, white
  context: { bg: "#2a2a2a", fg: "#87ceeb" },     // Nearly black, sky blue
  warning: { bg: "#d75f00", fg: "#ffffff" },     // Orange, white (80%+)
  critical: { bg: "#af0000", fg: "#ffffff" },    // Red, white (100%+)
};

/**
 * Convert hex color to ANSI 256 color code
 */
export function hexToAnsi256(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Check for grayscale
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round((r - 8) / 247 * 24) + 232;
  }

  // Convert to 6x6x6 color cube
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);

  return 16 + 36 * ri + 6 * gi + bi;
}

/**
 * ANSI escape code generators
 */
export const ansi = {
  fg: (hex: string) => `\x1b[38;5;${hexToAnsi256(hex)}m`,
  bg: (hex: string) => `\x1b[48;5;${hexToAnsi256(hex)}m`,
  reset: "\x1b[0m",
};

/**
 * Get colors for context segment based on usage percentage
 */
export function getContextColors(percent: number): SegmentColor {
  if (percent >= 100) {
    return darkTheme.critical;
  } else if (percent >= 80) {
    return darkTheme.warning;
  }
  return darkTheme.context;
}
