import type { EnvironmentInfo } from "./types.js";
import { loadLassoTheme } from "./theme.js";

const RESET = "\x1b[0m";

const BAR_WIDTH = 10;
const FILLED_CHAR = "\u2588"; // █
const EMPTY_CHAR = "\u2591"; // ░

/**
 * Render the two-line statusline
 */
export function render(envInfo: EnvironmentInfo): string {
  // Colors track lasso's active (Onyx) theme.
  const { blue: BLUE, red: RED, mauve: MAUVE, overlay0: GRAY } = loadLassoTheme();

  let out = "";
  let modelCol = 0;

  // Line 1: battery bar + model
  if (envInfo.usedPercentage != null) {
    const pct = Math.max(0, envInfo.usedPercentage);
    const pctStr = String(pct);
    const nFilled = Math.min(
      Math.floor((pct * BAR_WIDTH) / 100),
      BAR_WIDTH,
    );
    const nEmpty = BAR_WIDTH - nFilled;

    const filled = FILLED_CHAR.repeat(nFilled);
    const empty = EMPTY_CHAR.repeat(nEmpty);

    out += `${BLUE}[${filled}${GRAY}${empty}${BLUE}] ${pctStr}%`;

    // model_col = 1([) + 10(bar) + 2(] ) + pct_digits + 1(%) + 2(  ) = 16 + pct_digits
    modelCol = 16 + pctStr.length;
  }

  // Model (red), same line
  if (out.length > 0) {
    out += "  ";
  }
  out += `${RED}${envInfo.model}`;

  // Line 2: branch (left) + dir_tail (aligned to model column)
  out += "\n";

  if (envInfo.gitBranch) {
    const branchText = `(${envInfo.gitBranch})`;
    out += `${MAUVE}${branchText}`;
    const gap = Math.max(2, modelCol - branchText.length);
    out += " ".repeat(gap);
  } else {
    out += " ".repeat(modelCol);
  }

  out += `${BLUE}${envInfo.directory}`;
  out += RESET;

  return out;
}
