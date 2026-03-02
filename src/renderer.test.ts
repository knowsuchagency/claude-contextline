import { describe, it, expect } from "vitest";
import { render } from "./renderer.js";
import type { EnvironmentInfo } from "./types.js";

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

describe("render", () => {
  it("renders full statusline with branch and percentage", () => {
    const info: EnvironmentInfo = {
      directory: "myproject",
      gitBranch: "main",
      model: "Opus 4.6",
      usedPercentage: 42,
    };
    const output = render(info);
    const lines = output.split("\n");

    expect(lines).toHaveLength(2);

    const stripped1 = stripAnsi(lines[0]);
    expect(stripped1).toContain("[");
    expect(stripped1).toContain("] 42%");
    expect(stripped1).toContain("Opus 4.6");

    const stripped2 = stripAnsi(lines[1]);
    expect(stripped2).toContain("(main)");
    expect(stripped2).toContain("myproject");
  });

  it("renders without git branch", () => {
    const info: EnvironmentInfo = {
      directory: "myproject",
      gitBranch: null,
      model: "Opus 4.6",
      usedPercentage: 50,
    };
    const output = render(info);
    const lines = output.split("\n");
    const stripped2 = stripAnsi(lines[1]);
    expect(stripped2).not.toContain("(");
    expect(stripped2).toContain("myproject");
  });

  it("renders without percentage data", () => {
    const info: EnvironmentInfo = {
      directory: "myproject",
      gitBranch: "main",
      model: "Opus 4.6",
      usedPercentage: null,
    };
    const output = render(info);
    const lines = output.split("\n");
    const stripped1 = stripAnsi(lines[0]);
    expect(stripped1).not.toContain("[");
    expect(stripped1).toContain("Opus 4.6");
  });

  it("clamps bar at 100%+", () => {
    const info: EnvironmentInfo = {
      directory: "myproject",
      gitBranch: null,
      model: "Opus 4.6",
      usedPercentage: 120,
    };
    const output = render(info);
    const stripped = stripAnsi(output.split("\n")[0]);
    // Should have exactly 10 filled blocks and 0 empty
    expect(stripped).toMatch(/\[.{10}\] 120%/);
  });

  it("handles 0% usage", () => {
    const info: EnvironmentInfo = {
      directory: "myproject",
      gitBranch: null,
      model: "Sonnet 4",
      usedPercentage: 0,
    };
    const output = render(info);
    const stripped = stripAnsi(output.split("\n")[0]);
    expect(stripped).toContain("] 0%");
  });

  it("aligns dir_tail below model", () => {
    const info: EnvironmentInfo = {
      directory: "myproject",
      gitBranch: "main",
      model: "Opus 4.6",
      usedPercentage: 42,
    };
    const output = render(info);
    const lines = output.split("\n");

    const stripped1 = stripAnsi(lines[0]);
    const stripped2 = stripAnsi(lines[1]);

    const modelStart = stripped1.indexOf("Opus 4.6");
    const dirStart = stripped2.indexOf("myproject");
    expect(modelStart).toBe(dirStart);
  });

  it("uses minimum gap of 2 for long branch names", () => {
    const info: EnvironmentInfo = {
      directory: "proj",
      gitBranch: "feature/very-long-branch-name",
      model: "Opus 4.6",
      usedPercentage: 5,
    };
    const output = render(info);
    const lines = output.split("\n");
    const stripped2 = stripAnsi(lines[1]);

    // Branch text is "(feature/very-long-branch-name)" = 31 chars
    // modelCol = 16 + 1 = 17, so gap would be negative -> clamped to 2
    const branchEnd = stripped2.indexOf(")") + 1;
    const dirStart = stripped2.indexOf("proj");
    expect(dirStart - branchEnd).toBe(2);
  });
});
