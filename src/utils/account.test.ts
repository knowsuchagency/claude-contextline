import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getUserEmail } from "./account.js";

const original = process.env.CLAUDE_CONFIG_DIR;
const dirs: string[] = [];

/** Point CLAUDE_CONFIG_DIR at a throwaway dir holding the given config body. */
function withConfig(body: string | null): void {
  const dir = mkdtempSync(join(tmpdir(), "contextline-"));
  dirs.push(dir);
  if (body !== null) {
    writeFileSync(join(dir, ".claude.json"), body);
  }
  process.env.CLAUDE_CONFIG_DIR = dir;
}

afterEach(() => {
  if (original === undefined) {
    delete process.env.CLAUDE_CONFIG_DIR;
  } else {
    process.env.CLAUDE_CONFIG_DIR = original;
  }
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("getUserEmail", () => {
  it("reads the email from oauthAccount", () => {
    withConfig(JSON.stringify({ oauthAccount: { emailAddress: "dev@example.com" } }));
    expect(getUserEmail()).toBe("dev@example.com");
  });

  it("returns null when no account is signed in", () => {
    withConfig(JSON.stringify({ numStartups: 3 }));
    expect(getUserEmail()).toBeNull();
  });

  it("returns null when the config is missing", () => {
    withConfig(null);
    expect(getUserEmail()).toBeNull();
  });

  it("returns null when the config is malformed", () => {
    withConfig("{ not json");
    expect(getUserEmail()).toBeNull();
  });

  it("ignores a non-string email", () => {
    withConfig(JSON.stringify({ oauthAccount: { emailAddress: 42 } }));
    expect(getUserEmail()).toBeNull();
  });
});
