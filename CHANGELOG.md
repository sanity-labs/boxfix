# boxfix

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
