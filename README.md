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
[█████░░░░░] 42%  Opus 4.6
(main)            myproject
```

Colors track your active [herdr](https://github.com/) theme, read from
`~/.config/herdr/config.toml` (respects `$XDG_CONFIG_HOME` and
`$HERDR_CONFIG_PATH`) on every render — including `[theme.custom]` overrides.
All of herdr's built-in themes are supported (catppuccin, tokyo-night, dracula,
nord, gruvbox, solarized, kanagawa, rosé-pine, vesper, …); if no config is found
it falls back to Catppuccin Mocha.

- **Line 1**: Context window battery bar (blue) with usage percentage, model name (red)
- **Line 2**: Git branch (mauve), working directory (blue) aligned below the model

## Requirements

- Node.js 18+

## License

MIT
