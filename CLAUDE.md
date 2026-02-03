# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**boxfix** is a CLI tool and library that fixes misaligned ASCII diagram borders in markdown files. LLMs often generate diagrams where content lines are shorter than boundary lines - this tool detects and pads those lines to proper width.

## Workflow

This project uses a PR-based workflow with branch protection on `main`:

- **No direct pushes to main** - All changes require a pull request
- **CI must pass** - Tests run on Node 22 and 24
- **Approval required** - At least 1 review needed before merge
- **Conventional commits** - Use `feat:`, `fix:`, `docs:`, etc.

When making changes:
1. Create a feature branch from `main`
2. Make changes and ensure CI passes locally
3. Open a PR and wait for review
4. Squash or rebase merge when approved

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## Commands

```bash
# Build (uses tsup)
pnpm build

# Run tests
pnpm test              # Watch mode
pnpm test:run          # Single run

# Type checking
pnpm typecheck

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

**Current scope:** The algorithm pads short content to match boundaries. It does NOT expand boundaries when content overflows - that's a planned future enhancement.

See `examples/` directory for before/after examples of various diagram types.

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
