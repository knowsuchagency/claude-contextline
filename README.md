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

## License

MIT
