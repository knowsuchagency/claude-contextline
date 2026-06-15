import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveAppearance } from "./theme.js";

/**
 * Drive {@link resolveAppearance} purely through env vars + temp config dirs so
 * the real `~/.claude` / `~/.lasso` and the host's `COLORFGBG` never leak in.
 */
describe("resolveAppearance", () => {
  let dir: string;
  const saved = {
    CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
    LASSO_DIR: process.env.LASSO_DIR,
    COLORFGBG: process.env.COLORFGBG,
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ccl-theme-"));
    // Point both config dirs at (initially empty) temp dirs and clear COLORFGBG
    // so each test opts in to exactly the sources it exercises.
    process.env.CLAUDE_CONFIG_DIR = join(dir, "claude");
    process.env.LASSO_DIR = join(dir, "lasso");
    delete process.env.COLORFGBG;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  const write = (sub: string, contents: unknown) => {
    const d = join(dir, sub);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, "settings.json"), JSON.stringify(contents));
  };
  const writeClaude = (theme: unknown) => write("claude", { theme });
  const writeLasso = (resolved: unknown) => write("lasso", { theme: { resolved } });

  it("never throws and yields a valid appearance with no config", () => {
    // darwin's `defaults` may answer here; elsewhere it falls through to dark.
    expect(["dark", "light"]).toContain(resolveAppearance());
  });

  it("follows Claude Code's theme, including variants", () => {
    writeClaude("light");
    expect(resolveAppearance()).toBe("light");
    writeClaude("dark-daltonized");
    expect(resolveAppearance()).toBe("dark");
  });

  it("prefers Claude Code over lasso", () => {
    writeClaude("light");
    writeLasso("dark");
    expect(resolveAppearance()).toBe("light");
  });

  it("falls back to lasso when Claude Code has no theme", () => {
    writeLasso("light");
    expect(resolveAppearance()).toBe("light");
  });

  it("prefers lasso over COLORFGBG", () => {
    writeLasso("dark");
    process.env.COLORFGBG = "0;15"; // light background
    expect(resolveAppearance()).toBe("dark");
  });

  it("reads COLORFGBG when no config opts in", () => {
    process.env.COLORFGBG = "15;0"; // dark background
    expect(resolveAppearance()).toBe("dark");
    process.env.COLORFGBG = "0;15"; // light background
    expect(resolveAppearance()).toBe("light");
  });
});
