import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Resolves the signed-in Claude account's email address.
 *
 * Claude Code keeps the authenticated account under `oauthAccount` in its
 * top-level config file (`~/.claude.json`, or `$CLAUDE_CONFIG_DIR/.claude.json`
 * when the config directory is relocated). The statusline hook payload does not
 * carry the email, so we read it from there.
 */

/** Candidate locations for Claude Code's top-level config file. */
function configPaths(): string[] {
  const override = process.env.CLAUDE_CONFIG_DIR;
  if (override) return [join(override, ".claude.json")];

  return [join(homedir(), ".claude.json")];
}

/**
 * Read the logged-in user's email address.
 * Never throws — returns null if the config is missing, unreadable, malformed,
 * or holds no authenticated account.
 */
export function getUserEmail(): string | null {
  for (const path of configPaths()) {
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8")) as {
        oauthAccount?: { emailAddress?: unknown };
      };
      const email = parsed.oauthAccount?.emailAddress;
      if (typeof email === "string" && email.trim()) {
        return email.trim();
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}
