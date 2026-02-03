# boxfix Examples

This directory contains examples of properly aligned diagrams that demonstrate boxfix output.

> **Note:** This repository has a Claude Code hook that automatically runs boxfix on markdown files. This means any intentionally misaligned "Before" examples get auto-fixed. The examples below show what boxfix produces, and inline comparisons show what it fixes.

## What Gets Fixed

boxfix pads short content lines to match boundary widths. Here's what broken input looks like vs fixed output:

**Broken (what LLMs often generate):**
```
┌──────────────┐      ← boundary is 16 chars wide
│ Short│               ← content line is only 8 chars (missing padding)
│ Also short│          ← another short line
└──────────────┘
```

**Fixed (after boxfix):**
```
┌──────────────┐
│ Short        │       ← padded to match boundary
│ Also short   │       ← padded to match boundary
└──────────────┘
```

The boundary lines (`┌───┐`, `└───┘`) are the reference width - content lines are padded to match.

## Examples

| File | Description |
|------|-------------|
| [`simple-box.md`](./simple-box.md) | Single box with content lines |
| [`nested-boxes.md`](./nested-boxes.md) | Boxes within boxes |
| [`multiple-boxes.md`](./multiple-boxes.md) | Several boxes in one diagram |
| [`ascii-style.md`](./ascii-style.md) | ASCII `+---+` style boxes |
| [`architecture.md`](./architecture.md) | Complex architecture diagram |

## Running boxfix

Fix a file and see the output:

```bash
npx boxfix examples/simple-box.md
```

Fix files in place:

```bash
npx boxfix --in-place examples/*.md
```

Check if files need fixing (useful in CI):

```bash
npx boxfix --check examples/*.md
```

## Testing with Broken Input

To test boxfix with actual broken diagrams, create a test file outside this repo or disable the hook temporarily:

```bash
# Create a test file with broken diagram
cat > /tmp/test.md << 'EOF'
```
┌──────────────┐
│ Short│
└──────────────┘
```
EOF

# Run boxfix
npx boxfix /tmp/test.md
```
