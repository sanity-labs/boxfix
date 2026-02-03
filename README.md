# boxfix

LLMs generate ASCII diagrams with broken borders. This fixes them.

```
Before                          After
┌─────────────────────┐         ┌─────────────────────┐
│ Component A        │    →     │ Component A         │
│ with content       │          │ with content        │
└─────────────────────┘         └─────────────────────┘
```

## The Problem

LLMs generate ASCII diagrams with misaligned right borders. The top and bottom boundary lines (`┌───┐`, `└───┘`) are usually correct because they're repetitive patterns. But content lines with variable text end up short:

```
┌─────────────────────────┐
│ This line is too short│   ← Right border doesn't align
│ API Gateway           │   ← Same problem here
└─────────────────────────┘
```

This happens because:
- LLMs count characters inconsistently when content varies
- Boundary lines are easy (repeat `─` until done)
- Content lines require precise space calculation

See the [`examples/`](./examples/) directory for more before/after examples.

## Installation

```bash
npm install -g boxfix
```

Or use directly with npx:

```bash
npx boxfix input.md
```

## Usage

```bash
# Output to stdout
boxfix input.md

# Fix files in place
boxfix input.md --in-place
boxfix **/*.md -i

# Check mode for CI (exit code 1 if fixes needed)
boxfix --check *.md

# JSON output for agents/tooling
boxfix input.md --json

# Preview changes without modifying
boxfix input.md --dry-run

# Multiple files
boxfix doc1.md doc2.md --in-place
```

### Options

| Flag | Short | Description |
|------|-------|-------------|
| `--in-place` | `-i` | Modify files in place |
| `--output <file>` | `-o` | Write to specific file (single input only) |
| `--check` | `-c` | Check mode - exit 1 if fixes needed |
| `--json` | `-j` | Output results as JSON |
| `--dry-run` | `-d` | Preview changes without modifying |
| `--quiet` | `-q` | Suppress output except errors |
| `--hook` | | Read JSON from stdin, extract file path, fix in-place (for AI agents) |

### JSON Output

```json
{
  "files": [
    {
      "file": "input.md",
      "linesFixed": 3,
      "blocksProcessed": 2,
      "diagramsFound": 1
    }
  ],
  "summary": {
    "totalFiles": 1,
    "filesWithFixes": 1,
    "totalLinesFixed": 3,
    "totalDiagramsFound": 1
  }
}
```

## How It Works

### The Boundary-Anchored Approach

The key insight: **boundary lines are reliable, content lines aren't**.

```
┌─────────────────────┐  ← Boundary: LLMs get this right (repetitive)
│ Content here       │   ← Content: LLMs mess this up (variable)
│ More content       │   ← Content: Same problem
└─────────────────────┘  ← Boundary: LLMs get this right (repetitive)
```

**Algorithm:**

1. **Scan** - Find all boundary lines (`┌───┐`, `└───┘`, `+---+`)
2. **Measure** - Record the display width of each boundary line
3. **Match** - For each content line ending with `│` or `|`:
   - Find a boundary width that's 1-3 characters wider
   - This is the "target width" for that line
4. **Pad** - Insert spaces before the right border character

### Supported Diagram Styles

**Unicode box-drawing:**
```
┌───────┐    ╔═══════╗
│ Box 1 │    ║ Box 2 ║
└───────┘    ╚═══════╝
```

**ASCII:**
```
+-------+
| Box 3 |
+-------+
```

**Nested boxes:**
```
┌─────────────────┐
│ ┌─────────────┐ │
│ │ Inner      │  │
│ └─────────────┘ │
└─────────────────┘
```

### What It Doesn't Touch

- Tree structures (`├── folder`)
- Lines without border characters
- Already-aligned diagrams
- Non-diagram code blocks

## Programmatic API

```typescript
import { boxfixMarkdown, boxfix } from 'boxfix';

// Process markdown with code blocks
const result = boxfixMarkdown(markdownContent);
console.log(result.fixed); // Fixed content
console.log(result.stats); // { linesFixed, blocksProcessed, diagramsFound }

// Process raw diagram content
const diagram = boxfix(diagramContent);
```

### Exports

| Function | Description |
|----------|-------------|
| `boxfixMarkdown(md)` | Process markdown, fixing diagrams in code blocks |
| `boxfix(content)` | Process raw content (auto-detects if diagram) |
| `boxfixDiagram(content)` | Process content known to be a diagram |
| `isDiagram(content)` | Check if content appears to be a diagram |
| `isBoundaryLine(line)` | Check if line is a box boundary |
| `isContentLine(line)` | Check if line is box content |
| `isTreeLine(line)` | Check if line is a tree structure (excluded from processing) |
| `getDisplayWidth(str)` | Get visual width (handles Unicode, CJK, emoji) |
| `expandTabs(str)` | Expand tabs to spaces for consistent width calculation |

### Type Exports

```typescript
import type { BoxfixResult, BoxfixStats, CodeBlock } from 'boxfix';

interface BoxfixResult {
  fixed: string;          // The fixed content
  stats: BoxfixStats;     // Processing statistics
}

interface BoxfixStats {
  linesFixed: number;       // Lines that were padded
  blocksProcessed: number;  // Code blocks examined
  diagramsFound: number;    // Diagrams detected
}

interface CodeBlock {
  raw: string;              // Full block including fences
  content: string;          // Content inside fences
  language: string | null;  // Language identifier
  start: number;            // Start position in source
  end: number;              // End position in source
}
```

## Integrations

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: boxfix
        name: Fix diagram borders
        entry: npx boxfix --check
        language: system
        files: '\.md$'
```

### GitHub Actions

```yaml
# .github/workflows/diagrams.yml
name: Check Diagrams
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npx boxfix --check **/*.md
```

### AI Agent Hooks

The `--hook` flag enables seamless integration with AI coding agents. It reads JSON from stdin, extracts the file path from common field patterns, and silently processes markdown files.

**Key features:**
- Reads JSON payload from stdin (as provided by agent hooks)
- Extracts file path from common JSON structures
- Silently skips non-markdown files
- Always exits 0 to never break agentic workflows
- Works with Claude Code, Cursor, Windsurf, and other agents

**Supported JSON formats:**

| Format | Example | Used by |
|--------|---------|---------|
| `tool_input.file_path` | `{"tool_input":{"file_path":"..."}}` | Claude Code |
| `file_path` | `{"file_path":"..."}` | Cursor, Windsurf |
| `filePath` | `{"filePath":"..."}` | Generic (camelCase) |
| `path` | `{"path":"..."}` | Minimal |

#### Claude Code

Automatically fix diagrams as Claude writes them using [hooks](https://code.claude.com/docs/en/hooks).

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx boxfix --hook"
          }
        ]
      }
    ]
  }
}
```

#### Cursor

Cursor 1.7+ supports [hooks](https://cursor.com/docs/agent/hooks) for agent lifecycle control.

Add to `.cursor/hooks.json`:

```json
{
  "afterFileEdit": [
    {
      "command": "npx boxfix --hook"
    }
  ]
}
```

#### Windsurf

Windsurf (Codeium) supports [Cascade Hooks](https://docs.windsurf.com/windsurf/cascade/hooks) for automation.

Add to `.windsurf/hooks.json`:

```json
{
  "post_write_code": [
    {
      "command": "npx boxfix --hook"
    }
  ]
}
```

#### OpenCode

OpenCode supports plugins for extensibility. You can use the [oh-my-opencode](https://www.npmjs.com/package/oh-my-opencode) package which provides Claude Code hook compatibility, or create a custom plugin.

#### Other Agents

For any agent that pipes JSON with a file path to stdin on file edit events, the `--hook` flag should work out of the box. The tool checks for file paths in common locations (see table above) and silently exits 0 if no valid markdown path is found.

## Why "boxfix"?

It fixes boxes. That's it.

## Limitations

**Current scope:** boxfix pads short content lines to match boundary widths. It assumes the boundary lines are correct and adjusts content to fit.

**What it doesn't do (yet):**
- Expand boundaries when content is longer than the box
- Shrink content that overflows
- Reflow text within boxes

If your diagram has content that overflows the boundaries, you'll need to either:
1. Manually widen the boundary lines, or
2. Shorten the content

Boundary expansion is planned for a future release.

## License

MIT
