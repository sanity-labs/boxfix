# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**boxfix** (`@sanity-labs/boxfix`) is a CLI tool and library that fixes misaligned ASCII diagram borders in markdown files. LLMs often generate diagrams where content lines are shorter than boundary lines - this tool detects and pads those lines to proper width.

## Commands

```bash
# Build (uses tsup)
npm run build

# Run tests
npm test              # Watch mode
npm run test:run      # Single run

# Type checking
npm run typecheck

# CLI usage (after build)
./dist/cli.js input.md              # Output to stdout
./dist/cli.js input.md --in-place   # Fix in place
./dist/cli.js --check *.md          # CI mode (exit 1 if fixes needed)
```

## Architecture

The codebase follows a pipeline approach for processing diagrams:

```
Markdown → Extract Code Blocks → Detect Diagrams → Fix → Reconstruct
```

### Core Modules

- **`src/types.ts`** - Type definitions and box-drawing character constants (`BOX_CHARS`, `RIGHT_BORDER_CHARS`, `CORNER_CHARS`)
- **`src/width.ts`** - Display width calculation using `string-width` library (handles CJK, emoji, ANSI codes)
- **`src/diagram-detector.ts`** - Heuristics to identify diagrams vs code: `isDiagram`, `isBoundaryLine`, `isContentLine`, `isTreeLine`
- **`src/boxfix.ts`** - Core algorithm: finds boundary widths, pads content lines to match
- **`src/markdown.ts`** - Extracts fenced code blocks, processes diagrams, reconstructs markdown
- **`src/cli.ts`** - Commander-based CLI with glob support

### Key Algorithm (boxfixDiagram)

1. Collect all boundary line widths (lines starting/ending with corners like `┌`, `┐`, `+`)
2. For each content line (starts/ends with `│` or `|`):
   - Find a boundary width that's 1-3 chars wider than the line
   - Pad spaces before the right border character to match

### Boundary vs Content Detection

- **Boundary lines**: Start AND end with corner chars (`┌┐└┘+`), contain horizontal chars (`─-`)
- **Content lines**: Start AND end with vertical chars (`│|`), minimum 3 chars
- **Tree lines**: Start with `├` or `└` but don't end with vertical char (excluded from processing)

## Testing

Tests are in `test/boxfix.test.ts` using Vitest. The test file covers:
- Width calculation (ASCII, Unicode box-drawing, CJK)
- Diagram detection heuristics
- Line type classification (boundary, content, tree)
- Fixing of various box styles (Unicode, ASCII, nested)
- Markdown code block processing

## Entry Points

- **Library**: `src/index.ts` exports `boxfixMarkdown`, `boxfix`, `boxfixDiagram`, detection functions, and width utilities
- **CLI**: `src/cli.ts` is the bin entry point (`boxfix` command)
