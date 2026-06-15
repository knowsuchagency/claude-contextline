import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

/**
 * Resolves the statusline colors from lasso's Nothing design system, tracking
 * the active light/dark appearance.
 *
 * Appearance is resolved from the highest-priority source that has an opinion
 * (see {@link resolveAppearance}): Claude Code's own theme first, then lasso's
 * live appearance, then the terminal / OS. We re-read these on every render and
 * pick the matching Nothing palette.
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

/** A resolved light/dark appearance. */
export type Appearance = "dark" | "light";

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
const NOTHING: Record<Appearance, ThemeColors> = {
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

/** Read + parse a JSON file, or `null` if missing/unreadable/malformed. */
function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Claude Code's theme, from `settings.json` in `$CLAUDE_CONFIG_DIR`
 * (default `~/.claude`). Its theme ids are `light`/`dark` plus variants
 * (`light-daltonized`, `dark-ansi`, …), so we key off the prefix. Returns
 * `null` when there's no readable string `theme` to follow.
 */
function claudeCodeAppearance(): Appearance | null {
  const dir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
  const theme = (readJson(join(dir, "settings.json")) as { theme?: unknown })
    ?.theme;
  if (typeof theme !== "string") return null;
  if (theme.startsWith("light")) return "light";
  if (theme.startsWith("dark")) return "dark";
  return null;
}

/**
 * lasso's resolved appearance, mirrored to `~/.lasso/settings.json` under the
 * `theme` key on every UI appearance change (honors `LASSO_DIR`; see lasso's
 * `web/src/lib/mode.ts` + `/api/theme`). Returns `null` when absent or unset.
 */
function lassoAppearance(): Appearance | null {
  const dir = process.env.LASSO_DIR || join(homedir(), ".lasso");
  const resolved = (
    readJson(join(dir, "settings.json")) as { theme?: { resolved?: unknown } }
  )?.theme?.resolved;
  if (resolved === "light" || resolved === "dark") return resolved;
  return null;
}

/**
 * The terminal / OS appearance. Prefers `COLORFGBG` (set by many terminals to
 * `fg;bg`, where the background index follows the xterm palette: 0–6 and 8 are
 * dark, 7 and 9–15 are light); falls back to macOS system appearance via
 * `AppleInterfaceStyle` (absent ⇒ light, `"Dark"` ⇒ dark). Returns `null` when
 * nothing can be determined.
 */
function systemAppearance(): Appearance | null {
  const colorfgbg = process.env.COLORFGBG;
  if (colorfgbg) {
    const bg = Number(colorfgbg.split(";").pop());
    if (Number.isInteger(bg)) return bg === 7 || bg >= 9 ? "light" : "dark";
  }

  if (platform() === "darwin") {
    try {
      const style = execSync("defaults read -g AppleInterfaceStyle", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      return style === "Dark" ? "dark" : "light";
    } catch {
      // The key is absent in light mode, so `defaults` exits non-zero.
      return "light";
    }
  }

  return null;
}

/**
 * Resolve light/dark appearance from the highest-priority source that has an
 * opinion, in order:
 *   1. Claude Code's theme  (`$CLAUDE_CONFIG_DIR`/`settings.json` `theme`)
 *   2. lasso's appearance   (`~/.lasso/settings.json` `theme.resolved`)
 *   3. the terminal / OS    (`COLORFGBG`, then macOS `AppleInterfaceStyle`)
 *
 * Falls back to "dark" — the Nothing canvas is dark-forward — when nothing has
 * an opinion. Never throws.
 */
export function resolveAppearance(): Appearance {
  return (
    claudeCodeAppearance() ??
    lassoAppearance() ??
    systemAppearance() ??
    "dark"
  );
}

/**
 * Load the active theme as ready-to-use ANSI escapes, tracking the resolved
 * light/dark appearance. Never throws — falls back to the Nothing dark palette.
 */
export function loadTheme(): ThemeColors {
  return NOTHING[resolveAppearance()];
}
