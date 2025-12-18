#!/usr/bin/env node

import { readHookData } from "./utils/claude-hook.js";
import { getEnvironmentInfo } from "./utils/environment.js";
import { Renderer } from "./renderer.js";

/**
 * Main entry point for claude-contextline
 *
 * Reads hook data from Claude Code via stdin,
 * extracts environment information, and renders
 * a powerline-style statusline to stdout.
 */
async function main(): Promise<void> {
  try {
    // Read hook data from stdin (with timeout)
    const hookData = await readHookData();

    // Extract environment information
    const envInfo = getEnvironmentInfo(hookData);

    // Render and output the statusline
    const renderer = new Renderer();
    const output = renderer.render(envInfo);

    process.stdout.write(output);
  } catch {
    // Silent failure - don't break the terminal
    // CLI tools should exit cleanly even on error
    process.exit(0);
  }
}

main();
