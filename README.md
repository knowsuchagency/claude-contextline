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

Colors reflect [lasso](https://github.com/)'s Onyx design system. The tokens
mirror lasso's canonical Onyx colors, and the palette tracks your active
light/dark appearance so the text stays readable on either background.

- **Line 1**: Context window battery bar (Onyx accent) with usage percentage, model name (Onyx danger)
- **Line 2**: Git branch (Onyx secondary indigo), working directory (Onyx accent) aligned below the model

### Light/dark resolution

The appearance is resolved from the highest-priority source that has an
opinion, falling back to the next when one is unset:

1. **Claude Code** — the `theme` in `settings.json` under `$CLAUDE_CONFIG_DIR`
   (default `~/.claude`). `light*` themes render the light palette, `dark*` the
   dark one.
2. **lasso** — `theme.resolved` in `~/.lasso/settings.json` (honors `LASSO_DIR`),
   written live on every lasso appearance change.
3. **Terminal / OS** — `COLORFGBG` if your terminal sets it, then macOS system
   appearance (`AppleInterfaceStyle`).

If nothing has an opinion, the dark-forward Onyx canvas is used.

## Requirements

- Node.js 18+

## License

MIT
