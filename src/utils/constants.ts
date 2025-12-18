/**
 * Powerline and icon symbols
 */
export const SYMBOLS = {
  arrow: "\ue0b0",      // Powerline right arrow
  branch: "\ue0a0",     // Git branch icon
  model: "\u2731",      // Heavy asterisk ✱
  context: "\u25eb",    // White square with vertical bisecting line ◫
  dirty: "●",           // Dirty indicator
};

/**
 * Text fallback symbols for terminals without nerd fonts
 */
export const TEXT_SYMBOLS = {
  arrow: ">",
  branch: "",
  model: "*",
  context: "CTX",
  dirty: "*",
};

/**
 * ANSI reset code
 */
export const RESET = "\x1b[0m";
