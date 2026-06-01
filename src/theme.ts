import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Resolves the statusline colors from herdr's active theme.
 *
 * herdr stores its theme in `config.toml` under `[theme] name = "..."` with
 * optional per-token overrides under `[theme.custom]`. This module reads that
 * file on every render so the statusline tracks the live herdr theme. The
 * palettes mirror herdr's `Palette` built-ins (src/app/state.rs) and the name
 * resolution mirrors `Palette::from_name`.
 */

/** A foreground color: 24-bit RGB, a named ANSI SGR code, or the terminal default. */
type Color =
  | { kind: "rgb"; r: number; g: number; b: number }
  | { kind: "ansi"; code: number }
  | { kind: "reset" };

const rgb = (r: number, g: number, b: number): Color => ({ kind: "rgb", r, g, b });
const ansi = (code: number): Color => ({ kind: "ansi", code });
const RESET_COLOR: Color = { kind: "reset" };

/** The four tokens the statusline actually renders. */
export interface ThemeColors {
  /** Battery bar (filled) + directory. */
  blue: string;
  /** Model name. */
  red: string;
  /** Git branch — herdr's "branch name / special label" token. */
  mauve: string;
  /** Empty battery cells (muted). */
  overlay0: string;
}

interface Palette {
  blue: Color;
  red: Color;
  mauve: Color;
  overlay0: Color;
}

/** Built-in palettes, keyed by canonical name. Ported from herdr's `Palette`. */
const PALETTES: Record<string, Palette> = {
  catppuccin: { blue: rgb(137, 180, 250), red: rgb(243, 139, 168), mauve: rgb(203, 166, 247), overlay0: rgb(108, 112, 134) },
  "catppuccin-latte": { blue: rgb(30, 102, 245), red: rgb(210, 15, 57), mauve: rgb(136, 57, 239), overlay0: rgb(156, 160, 176) },
  terminal: { blue: ansi(34), red: ansi(91), mauve: ansi(37), overlay0: ansi(37) },
  "tokyo-night": { blue: rgb(122, 162, 247), red: rgb(247, 118, 142), mauve: rgb(187, 154, 247), overlay0: rgb(86, 95, 137) },
  "tokyo-night-day": { blue: rgb(46, 125, 233), red: rgb(245, 42, 101), mauve: rgb(120, 71, 189), overlay0: rgb(137, 144, 179) },
  dracula: { blue: rgb(139, 233, 253), red: rgb(255, 85, 85), mauve: rgb(255, 121, 198), overlay0: rgb(98, 114, 164) },
  nord: { blue: rgb(129, 161, 193), red: rgb(191, 97, 106), mauve: rgb(180, 142, 173), overlay0: rgb(76, 86, 106) },
  gruvbox: { blue: rgb(131, 165, 152), red: rgb(251, 73, 52), mauve: rgb(211, 134, 155), overlay0: rgb(146, 131, 116) },
  "gruvbox-light": { blue: rgb(7, 102, 120), red: rgb(157, 0, 6), mauve: rgb(143, 63, 113), overlay0: rgb(146, 131, 116) },
  "one-dark": { blue: rgb(97, 175, 239), red: rgb(224, 108, 117), mauve: rgb(198, 120, 221), overlay0: rgb(92, 99, 112) },
  "one-light": { blue: rgb(64, 120, 242), red: rgb(228, 86, 73), mauve: rgb(166, 38, 164), overlay0: rgb(160, 161, 167) },
  solarized: { blue: rgb(38, 139, 210), red: rgb(220, 50, 47), mauve: rgb(211, 54, 130), overlay0: rgb(88, 110, 117) },
  "solarized-light": { blue: rgb(38, 139, 210), red: rgb(220, 50, 47), mauve: rgb(211, 54, 130), overlay0: rgb(147, 161, 161) },
  kanagawa: { blue: rgb(126, 156, 216), red: rgb(195, 64, 67), mauve: rgb(149, 127, 184), overlay0: rgb(114, 113, 105) },
  "kanagawa-lotus": { blue: rgb(77, 105, 155), red: rgb(200, 64, 83), mauve: rgb(98, 76, 131), overlay0: rgb(160, 156, 172) },
  "rose-pine": { blue: rgb(49, 116, 143), red: rgb(235, 111, 146), mauve: rgb(196, 167, 231), overlay0: rgb(110, 106, 134) },
  "rose-pine-dawn": { blue: rgb(40, 105, 131), red: rgb(180, 99, 122), mauve: rgb(144, 122, 169), overlay0: rgb(152, 147, 165) },
  vesper: { blue: rgb(176, 176, 176), red: rgb(255, 128, 128), mauve: rgb(255, 209, 168), overlay0: rgb(92, 92, 92) },
};

/** Theme-name aliases → canonical key. Mirrors `Palette::from_name`. */
const ALIASES: Record<string, string> = {
  "catppuccin-mocha": "catppuccin",
  latte: "catppuccin-latte",
  light: "catppuccin-latte",
  tokyonight: "tokyo-night",
  "tokyo-day": "tokyo-night-day",
  "tokyonight-day": "tokyo-night-day",
  "gruvbox-dark": "gruvbox",
  onedark: "one-dark",
  onelight: "one-light",
  "solarized-dark": "solarized",
  lotus: "kanagawa-lotus",
  rosepine: "rose-pine",
  "rosepine-dawn": "rose-pine-dawn",
  dawn: "rose-pine-dawn",
};

const DEFAULT_THEME = "catppuccin";

/** ANSI SGR foreground codes for named colors (mirrors ratatui's `Color`). */
const NAMED_ANSI: Record<string, number> = {
  black: 30, red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, purple: 35,
  cyan: 36, gray: 37, grey: 37, white: 97, darkgray: 90, darkgrey: 90,
  lightred: 91, lightgreen: 92, lightyellow: 93, lightblue: 94,
  lightmagenta: 95, lightcyan: 96,
};

/** Convert a Color to a foreground ANSI escape sequence. */
function fg(color: Color): string {
  switch (color.kind) {
    case "rgb":
      return `\x1b[38;2;${color.r};${color.g};${color.b}m`;
    case "ansi":
      return `\x1b[${color.code}m`;
    case "reset":
      return `\x1b[39m`;
  }
}

/** Parse a color string (hex / rgb() / named / reset). Mirrors herdr's `parse_color`. */
function parseColor(input: string): Color {
  const s = input.trim().toLowerCase();

  if (s === "reset" || s === "default" || s === "none" || s === "transparent") {
    return RESET_COLOR;
  }

  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (/^[0-9a-f]{6}$/.test(hex)) {
      return rgb(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    }
    if (/^[0-9a-f]{3}$/.test(hex)) {
      return rgb(parseInt(hex[0], 16) * 17, parseInt(hex[1], 16) * 17, parseInt(hex[2], 16) * 17);
    }
  }

  const rgbMatch = s.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    return rgb(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]));
  }

  if (s in NAMED_ANSI) {
    return ansi(NAMED_ANSI[s]);
  }

  // herdr falls back to cyan for unknown colors.
  return ansi(36);
}

/** herdr's config.toml location: HERDR_CONFIG_PATH, else $XDG_CONFIG_HOME / $HOME. */
function configPaths(): string[] {
  const override = process.env.HERDR_CONFIG_PATH;
  if (override) return [override];

  const base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  // Release builds use "herdr"; debug builds use "herdr-dev" — try both.
  return [join(base, "herdr", "config.toml"), join(base, "herdr-dev", "config.toml")];
}

/** Extract `[theme] name` and `[theme.custom]` overrides from minimal TOML. */
function parseThemeSection(toml: string): { name?: string; custom: Record<string, string> } {
  const result: { name?: string; custom: Record<string, string> } = { custom: {} };
  let section = "";

  for (const rawLine of toml.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      section = sectionMatch[1].trim();
      continue;
    }

    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    // Strip quotes, or trim an inline comment from a bare value.
    if (value.startsWith('"') || value.startsWith("'")) {
      const quote = value[0];
      const end = value.indexOf(quote, 1);
      if (end !== -1) value = value.slice(1, end);
    } else {
      const hash = value.indexOf("#");
      if (hash !== -1) value = value.slice(0, hash).trim();
    }

    if (section === "theme" && key === "name") {
      result.name = value;
    } else if (section === "theme.custom") {
      result.custom[key] = value;
    }
  }

  return result;
}

/** Resolve a theme name to a palette, falling back to catppuccin. */
function resolvePalette(name: string | undefined): Palette {
  const normalized = (name ?? DEFAULT_THEME).toLowerCase().replace(/[ _]/g, "-");
  const canonical = ALIASES[normalized] ?? normalized;
  return PALETTES[canonical] ?? PALETTES[DEFAULT_THEME];
}

/**
 * Load the active herdr theme as ready-to-use ANSI escapes.
 * Never throws — falls back to Catppuccin Mocha if the config is missing,
 * unreadable, or names an unknown theme.
 */
export function loadHerdrTheme(): ThemeColors {
  let parsed: { name?: string; custom: Record<string, string> } = { custom: {} };

  for (const path of configPaths()) {
    try {
      parsed = parseThemeSection(readFileSync(path, "utf8"));
      break;
    } catch {
      // try the next candidate path
    }
  }

  const palette: Palette = { ...resolvePalette(parsed.name) };

  // Apply [theme.custom] overrides for the tokens we render.
  for (const token of ["blue", "red", "mauve", "overlay0"] as const) {
    const override = parsed.custom[token];
    if (override) palette[token] = parseColor(override);
  }

  return {
    blue: fg(palette.blue),
    red: fg(palette.red),
    mauve: fg(palette.mauve),
    overlay0: fg(palette.overlay0),
  };
}
