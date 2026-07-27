# claude-contextline

A two-line statusline for Claude Code showing context window usage, model, git
branch, and working directory.

## Usage

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx claude-contextline"
  }
}
```

## Display

```
[█████░░░░░] 42%  Opus 4.6  you@example.com
(main)            myproject
```

Colors track the active [herdr](https://github.com/) theme, re-read from
`~/.config/herdr/config.toml` on every render, so the statusline stays in step
with whatever theme herdr is currently using. All of herdr's built-in palettes
are supported, along with `[theme.custom]` per-token overrides; it falls back to
Catppuccin Mocha when no herdr config is found.

- **Line 1**: Context window battery bar (accent) with usage percentage, model
  name, and the signed-in account's email (muted). The email comes from
  `oauthAccount.emailAddress` in `~/.claude.json` (or
  `$CLAUDE_CONFIG_DIR/.claude.json`) and is omitted when no account is found.
- **Line 2**: Git branch, working directory (accent) aligned below the model

## Requirements

- Node.js 18+

## License

MIT
