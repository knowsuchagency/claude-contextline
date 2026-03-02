#!/usr/bin/env node

import { readHookData } from "./utils/claude-hook.js";
import { getEnvironmentInfo } from "./utils/environment.js";
import { render } from "./renderer.js";

/**
 * Main entry point for claude-contextline
 *
 * Reads hook data from Claude Code via stdin,
 * extracts environment information, and renders
 * a two-line statusline to stdout.
 */
async function main(): Promise<void> {
  try {
    const hookData = await readHookData();
    const envInfo = getEnvironmentInfo(hookData);
    const output = render(envInfo);
    process.stdout.write(output);
  } catch {
    // Silent failure - don't break the terminal
    process.exit(0);
  }
}

main();
