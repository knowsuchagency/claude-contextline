import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Resolves the statusline colors from lasso's Onyx design system, tracking
 * lasso's live light/dark appearance.
 *
 * lasso (the successor to herdr) replaced herdr's theme switcher with a single
 * design system — "Onyx" — that has a dark and a light mode. The active
 * appearance is mirrored to disk by lasso at `~/.lasso/settings.json` under the
 * `theme` key (written on every UI appearance change; see lasso's
 * `web/src/lib/mode.ts` + `/api/theme`), so we can read it without a browser.
 * We re-read that file on every render and pick the matching Onyx palette.
 *
 * The palettes mirror lasso's canonical Onyx tokens — dark from
 * `web/src/index.css` `--color-onyx-*` / `ONYX_XTERM_DARK`, light from the
 * `:root.light` `--h-*` overrides / `ONYX_XTERM_LIGHT`.
 */

/** The four tokens the statusline renders, as ready-to-use foreground escapes. */
export interface ThemeColors {
  /** Battery bar (filled) + directory. */
  blue: string;
  /** Model name. */
  red: string;
  /** Git branch. */
  mauve: string;
  /** Empty battery cells (muted). */
  overlay0: string;
}

/** Build a 24-bit RGB foreground escape from a `#rrggbb` Onyx token. */
function fg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

/**
 * The Onyx palettes, mapped onto the four statusline tokens. The names are kept
 * (blue/red/mauve/overlay0) so the renderer's call sites read unchanged; the
 * values are Onyx's indigo-forward accents plus its danger and muted tokens.
 */
const ONYX: Record<"dark" | "light", ThemeColors> = {
  dark: {
    blue: fg("#7b7fff"), // --color-onyx-accent   (filled bar + directory)
    red: fg("#f2545b"), // --color-onyx-danger   (model name)
    mauve: fg("#9498ff"), // --color-onyx-accent-1 (git branch)
    overlay0: fg("#3b3f4e"), // --color-onyx-fg-3     (empty bar cells, muted)
  },
  light: {
    blue: fg("#5c61e6"), // --h-accent (light primary, deeper indigo)
    red: fg("#d63d44"), // --h-bad    (darkened danger for light bg)
    mauve: fg("#7b7fff"), // Onyx's lighter indigo, kept distinct from the directory
    overlay0: fg("#6b7080"), // --h-muted (--fg-2)
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
 * than "light" — Onyx is dark-forward, so dark is the safe default.
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
 * light/dark appearance. Never throws — falls back to the Onyx dark palette.
 */
export function loadLassoTheme(): ThemeColors {
  return ONYX[resolvedAppearance()];
}
