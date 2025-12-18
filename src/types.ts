/**
 * Data received from Claude Code via stdin
 */
export interface ClaudeHookData {
  hook_event_name?: string;
  session_id?: string;
  cwd?: string;
  model?: {
    id: string;
    display_name: string;
  };
  workspace?: {
    current_dir: string;
    project_dir?: string;
  };
  context_window?: {
    current_usage: {
      input_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
    };
    context_window_size: number;
  };
}

/**
 * Environment information extracted from hook data and system
 */
export interface EnvironmentInfo {
  directory: string;
  gitBranch: string | null;
  gitDirty: boolean;
  model: string;
  contextPercent: number;
}

/**
 * A segment to render in the statusline
 */
export interface Segment {
  text: string;
  colors: SegmentColor;
}

/**
 * Color definition for a segment
 */
export interface SegmentColor {
  bg: string;
  fg: string;
}
