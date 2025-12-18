# claude-contextline

A powerline-style statusline for Claude Code showing context window usage.

## Installation

```bash
npm install -g claude-contextline
```

Or use with npx:

```bash
npx claude-contextline
```

## Configuration

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "claude-contextline"
  }
}
```

Or with npx:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx claude-contextline"
  }
}
```

## Features

- **Directory** - Shows current project/directory name
- **Git** - Shows branch name with dirty indicator (●)
- **Model** - Shows active Claude model
- **Context** - Shows context window usage percentage

## Display

```
 myproject  main ●  ✱ Opus 4.5  ◫ 21%
```

### Color States

- **Normal** (<80%): Sky blue text on dark background
- **Warning** (≥80%): White text on orange background
- **Critical** (≥100%): White text on red background

## Requirements

- Node.js 18+
- A terminal with powerline font support (for arrow glyphs)

## Credits

Styling based on [claude-limitline](https://github.com/tylergraydev/claude-limitline).

## License

MIT
