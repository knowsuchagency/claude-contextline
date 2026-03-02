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

- **Line 1**: Context window battery bar (blue) with usage percentage, model name (red)
- **Line 2**: Git branch (red), working directory (blue) aligned below the model

## Requirements

- Node.js 18+

## Credits

Inspired by [claude-limitline](https://github.com/tylergraydev/claude-limitline), which now supports context thanks to [this PR 😉](https://github.com/tylergraydev/claude-limitline/pull/10).

This is still useful for those who want ONLY the context limit and track usage elsewhere i.e. within [Vibora](https://github.com/knowsuchagency/vibora?tab=readme-ov-file#system-monitoring).

## License

MIT
