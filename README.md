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

Colors reflect [lasso](https://github.com/)'s Onyx design system — lasso's
single, fixed (dark) palette — so the statusline stays in step with lasso's
indigo-forward look. The tokens mirror lasso's canonical Onyx colors.

- **Line 1**: Context window battery bar (Onyx accent) with usage percentage, model name (Onyx danger)
- **Line 2**: Git branch (Onyx secondary indigo), working directory (Onyx accent) aligned below the model

## Requirements

- Node.js 18+

## License

MIT
