import type { EnvironmentInfo, Segment } from "./types.js";
import { SYMBOLS } from "./utils/constants.js";
import { darkTheme, ansi, getContextColors } from "./themes/index.js";

/**
 * Renderer for powerline-style statusline
 */
export class Renderer {
  private symbols = SYMBOLS;

  /**
   * Render the complete statusline
   */
  render(envInfo: EnvironmentInfo): string {
    const segments = this.buildSegments(envInfo);

    if (segments.length === 0) {
      return "";
    }

    return this.renderPowerline(segments);
  }

  /**
   * Build segments based on environment info
   */
  private buildSegments(envInfo: EnvironmentInfo): Segment[] {
    const segments: Segment[] = [];

    // Directory segment
    segments.push({
      text: ` ${envInfo.directory} `,
      colors: darkTheme.directory,
    });

    // Git segment (only if in a git repo)
    if (envInfo.gitBranch) {
      const dirty = envInfo.gitDirty ? ` ${this.symbols.dirty}` : "";
      segments.push({
        text: ` ${this.symbols.branch} ${envInfo.gitBranch}${dirty} `,
        colors: darkTheme.git,
      });
    }

    // Model segment
    segments.push({
      text: ` ${this.symbols.model} ${envInfo.model} `,
      colors: darkTheme.model,
    });

    // Context segment
    const contextColors = getContextColors(envInfo.contextPercent);
    segments.push({
      text: ` ${this.symbols.context} ${envInfo.contextPercent}% `,
      colors: contextColors,
    });

    return segments;
  }

  /**
   * Render segments with powerline arrows
   */
  private renderPowerline(segments: Segment[]): string {
    let output = "";

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const nextColors = i < segments.length - 1 ? segments[i + 1].colors : null;

      // Segment content with background and foreground colors
      output += ansi.bg(seg.colors.bg) + ansi.fg(seg.colors.fg) + seg.text;

      // Powerline arrow
      output += ansi.reset;
      if (nextColors) {
        // Arrow: current bg as fg, next bg as bg
        output += ansi.fg(seg.colors.bg) + ansi.bg(nextColors.bg) + this.symbols.arrow;
      } else {
        // Final arrow: current bg as fg, no background
        output += ansi.fg(seg.colors.bg) + this.symbols.arrow;
      }
    }

    output += ansi.reset;
    return output;
  }
}
