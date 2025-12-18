import type { ClaudeHookData } from "../types.js";

/**
 * Read hook data from stdin with a timeout
 * Claude Code sends JSON data via stdin to statusline commands
 */
export async function readHookData(timeoutMs = 1000): Promise<ClaudeHookData> {
  return new Promise((resolve, reject) => {
    let data = "";

    const timeout = setTimeout(() => {
      process.stdin.removeAllListeners();
      process.stdin.pause();
      // Return empty object on timeout (no data from stdin)
      resolve({});
    }, timeoutMs);

    // Check if stdin has data
    if (process.stdin.isTTY) {
      clearTimeout(timeout);
      resolve({});
      return;
    }

    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    process.stdin.on("end", () => {
      clearTimeout(timeout);
      try {
        const parsed = data.trim() ? JSON.parse(data) : {};
        resolve(parsed);
      } catch {
        resolve({});
      }
    });

    process.stdin.on("error", () => {
      clearTimeout(timeout);
      resolve({});
    });

    process.stdin.resume();
  });
}
