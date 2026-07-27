import { execSync } from "node:child_process";
import { basename } from "node:path";
import type { ClaudeHookData, EnvironmentInfo } from "../types.js";
import { getUserEmail } from "./account.js";

/**
 * Extract environment information from hook data and system
 */
export function getEnvironmentInfo(hookData: ClaudeHookData): EnvironmentInfo {
  const cwd = hookData.workspace?.current_dir || hookData.cwd || process.cwd();

  return {
    directory: getDirectoryName(cwd),
    gitBranch: getGitBranch(cwd),
    model: getModelName(hookData),
    usedPercentage: getUsedPercentage(hookData),
    email: getUserEmail(),
  };
}

/**
 * Get the directory name (last path component)
 */
function getDirectoryName(cwd: string): string {
  const name = basename(cwd);
  return name || "/";
}

/**
 * Get the current git branch name
 */
function getGitBranch(cwd: string): string | null {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    }).trim();

    if (branch === "HEAD") {
      return null;
    }

    return branch;
  } catch {
    return null;
  }
}

/**
 * Get the model display name
 */
function getModelName(hookData: ClaudeHookData): string {
  const displayName = hookData.model?.display_name || "Claude";
  // Remove "Claude " prefix for brevity
  return displayName.replace(/^Claude\s+/, "");
}

/**
 * Get context window usage percentage
 */
function getUsedPercentage(hookData: ClaudeHookData): number | null {
  const ctx = hookData.context_window;
  if (!ctx) return null;

  // Prefer direct used_percentage from JSON
  if (ctx.used_percentage != null) {
    return Math.floor(ctx.used_percentage);
  }

  // Fallback: compute from tokens
  if (ctx.current_usage && ctx.context_window_size) {
    const usage = ctx.current_usage;
    const totalTokens =
      (usage.input_tokens || 0) +
      (usage.cache_creation_input_tokens || 0) +
      (usage.cache_read_input_tokens || 0);
    return Math.floor((totalTokens / ctx.context_window_size) * 100);
  }

  return null;
}
