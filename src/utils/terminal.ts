/**
 * Get the terminal width
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Check if running in a TTY
 */
export function isTTY(): boolean {
  return process.stdout.isTTY ?? false;
}
