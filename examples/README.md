# boxfix Examples

This directory contains examples of diagrams that boxfix can fix. Each file shows "Before" (misaligned) and "After" (fixed) versions.

## Examples

| File | Description |
|------|-------------|
| [`simple-box.md`](./simple-box.md) | Single box with short content lines |
| [`nested-boxes.md`](./nested-boxes.md) | Boxes within boxes |
| [`multiple-boxes.md`](./multiple-boxes.md) | Several boxes in one diagram |
| [`ascii-style.md`](./ascii-style.md) | ASCII `+---+` style boxes |
| [`architecture.md`](./architecture.md) | Complex architecture diagram with nested elements |

## Running the Examples

Fix a single example and see the output:

```bash
npx boxfix examples/simple-box.md
```

Check if examples need fixing (useful in CI):

```bash
npx boxfix --check examples/*.md
```

## What Gets Fixed

boxfix pads short content lines to match boundary widths:

```
Before:                         After:
┌──────────────┐               ┌──────────────┐
│ Short      │      →         │ Short         │
│ Also short │                │ Also short    │
└──────────────┘               └──────────────┘
```

The boundary lines (`┌───┐`, `└───┘`) are left unchanged - they're the reference width.
