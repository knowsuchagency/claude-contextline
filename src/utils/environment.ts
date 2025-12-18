import { execSync } from "node:child_process";
import { basename } from "node:path";
import type { ClaudeHookData, EnvironmentInfo } from "../types.js";

/**
 * Extract environment information from hook data and system
 */
export function getEnvironmentInfo(hookData: ClaudeHookData): EnvironmentInfo {
  const cwd = hookData.workspace?.current_dir || hookData.cwd || process.cwd();

  return {
    directory: getDirectoryName(cwd),
    gitBranch: getGitBranch(cwd),
    gitDirty: isGitDirty(cwd),
    model: getModelName(hookData),
    contextPercent: getContextPercent(hookData),
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
    }).trim();

    // If detached HEAD, get short commit hash
    if (branch === "HEAD") {
      return execSync("git rev-parse --short HEAD", {
        cwd,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    }

    return branch;
  } catch {
    return null;
  }
}

/**
 * Check if git working directory has uncommitted changes
 */
function isGitDirty(cwd: string): boolean {
  try {
    const status = execSync("git status --porcelain", {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return status.trim().length > 0;
  } catch {
    return false;
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
 * Calculate context window usage percentage
 */
function getContextPercent(hookData: ClaudeHookData): number {
  const ctx = hookData.context_window;
  if (!ctx?.current_usage || !ctx.context_window_size) {
    return 0;
  }

  const usage = ctx.current_usage;
  const totalTokens =
    (usage.input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0);

  return Math.round((totalTokens / ctx.context_window_size) * 100);
}
