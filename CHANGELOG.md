# boxfix

## 1.3.0

### Minor Changes

- bb72aa7: Add content trimming for over-wide diagram lines. When content lines have excess spaces making them wider than boundaries, boxfix now trims those spaces to match the boundary width. Previously these lines were silently skipped.

## 1.1.1

### Patch Changes

- Fix multi-pipe connector lines being incorrectly padded. Lines with 3+ vertical bars and only whitespace between them (like `│   │   │`) are now correctly identified as connector lines and excluded from padding.

## 1.0.1

### Patch Changes

- 9591a1d: replaces deprecated glob package

## 1.0.1-beta.2

### Patch Changes

- 9591a1d: replaces deprecated glob package

## 1.0.1-beta.0

### Patch Changes

- 2f600ed: Fix CLI not running when invoked via npx

  The CLI entry point check compared symlink paths with real paths, which never matched when running via npx. Now resolves symlinks before comparing.
