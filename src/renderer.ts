import type { EnvironmentInfo } from "./types.js";
import { loadTheme } from "./theme.js";

const RESET = "\x1b[0m";

const BAR_WIDTH = 10;
const FILLED_CHAR = "\u2588"; // █
const EMPTY_CHAR = "\u2591"; // ░

/**
 * Render the two-line statusline
 */
export function render(envInfo: EnvironmentInfo): string {
  // Colors track the resolved (Nothing) theme: Claude Code, then lasso, then system.
  const { bar: BAR, barFull: BAR_FULL, text: TEXT, branch: BRANCH, empty: EMPTY } =
    loadTheme();

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

    // Nothing data-status: the value is monochrome until the context window is
    // nearly full, then it flips to the red interrupt.
    const fill = pct >= 90 ? BAR_FULL : BAR;

    out += `${fill}[${filled}${EMPTY}${empty}${fill}] ${pctStr}%`;

    // model_col = 1([) + 10(bar) + 2(] ) + pct_digits + 1(%) + 2(  ) = 16 + pct_digits
    modelCol = 16 + pctStr.length;
  }

  // Model (primary text), same line
  if (out.length > 0) {
    out += "  ";
  }
  out += `${TEXT}${envInfo.model}`;

  // Line 2: branch (left) + dir_tail (aligned to model column)
  out += "\n";

  if (envInfo.gitBranch) {
    const branchText = `(${envInfo.gitBranch})`;
    out += `${BRANCH}${branchText}`;
    const gap = Math.max(2, modelCol - branchText.length);
    out += " ".repeat(gap);
  } else {
    out += " ".repeat(modelCol);
  }

  out += `${TEXT}${envInfo.directory}`;
  out += RESET;

  return out;
}
