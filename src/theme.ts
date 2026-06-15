import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Resolves the statusline colors from lasso's Nothing design system, tracking
 * lasso's live light/dark appearance.
 *
 * lasso mirrors its active appearance to disk at `~/.lasso/settings.json` under
 * the `theme` key (written on every UI appearance change; see lasso's
 * `web/src/lib/mode.ts` + `/api/theme`), so we can read it without a browser.
 * We re-read that file on every render and pick the matching Nothing palette.
 *
 * The palettes mirror lasso's canonical Nothing tokens (`web/src/index.css`
 * `--h-*` seam + `ONYX_XTERM_*`): a monochrome canvas where brightness — not
 * hue — is the hierarchy, and the one true signal colour (red `#d71921`) is an
 * interrupt, used here only when the context window is nearly full.
 */

/** The colour tokens the statusline renders, as ready-to-use foreground escapes. */
export interface ThemeColors {
  /** Battery bar (filled), brackets + percentage — the value, brightest. */
  bar: string;
  /** Same as `bar`, but when context is ≥90% full: the Nothing red interrupt. */
  barFull: string;
  /** Model name + directory — primary foreground. */
  text: string;
  /** Git branch — secondary metadata. */
  branch: string;
  /** Empty battery cells — dim seam. */
  empty: string;
}

/** Build a 24-bit RGB foreground escape from a `#rrggbb` token. */
function fg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

/**
 * The Nothing palettes. Dark is the "instrument panel in a dark room" — white
 * data on OLED black; light is the "printed technical manual" — black ink on
 * warm off-white. The bar and primary text read bright, the branch recedes to
 * a muted grey, and the empty bar cells sit at a dim seam. Colour appears only
 * as data status: the bar flips to red once the context window is ≥90% full.
 */
const NOTHING: Record<"dark" | "light", ThemeColors> = {
  dark: {
    bar: fg("#ededed"), // --h-fg        (filled bar + percentage)
    barFull: fg("#d71921"), // --h-bad    (context ≥90% — interrupt)
    text: fg("#ededed"), // --h-fg        (model + directory)
    branch: fg("#8a8a8a"), // --h-muted   (git branch)
    empty: fg("#3a3a3a"), // --h-border+  (empty bar cells)
  },
  light: {
    bar: fg("#1a1a1a"), // --h-fg (light)
    barFull: fg("#c0141b"), // --h-bad (light, darkened)
    text: fg("#1a1a1a"), // --h-fg (light)
    branch: fg("#666666"), // --h-muted (light)
    empty: fg("#cccccc"), // light seam
  },
};

/** lasso's settings file: `~/.lasso/settings.json` (honors `LASSO_DIR`). */
function settingsPath(): string {
  const dir = process.env.LASSO_DIR || join(homedir(), ".lasso");
  return join(dir, "settings.json");
}

/**
 * Read lasso's resolved appearance from `~/.lasso/settings.json`. Returns
 * "dark" if the file is missing, unreadable, malformed, or names anything other
 * than "light" — the Nothing canvas is dark-forward, so dark is the safe default.
 */
function resolvedAppearance(): "dark" | "light" {
  try {
    const parsed = JSON.parse(readFileSync(settingsPath(), "utf8"));
    return parsed?.theme?.resolved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/**
 * Load lasso's active theme as ready-to-use ANSI escapes, tracking its live
 * light/dark appearance. Never throws — falls back to the Nothing dark palette.
 */
export function loadLassoTheme(): ThemeColors {
  return NOTHING[resolvedAppearance()];
}
