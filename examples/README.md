# boxfix Examples

This directory contains examples of properly aligned diagrams that demonstrate boxfix output.

## What Gets Fixed

boxfix pads short content lines to match boundary widths. Here's what broken input looks like vs fixed output:

**Broken (what LLMs often generate):**
```nofix
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

Each example has a `.before.md` version showing typical broken LLM output and a fixed version:

| Before (broken) | After (fixed) | Description |
|-----------------|---------------|-------------|
| [`simple-box.before.md`](./simple-box.before.md) | [`simple-box.md`](./simple-box.md) | Single box with content lines |
| [`nested-boxes.before.md`](./nested-boxes.before.md) | [`nested-boxes.md`](./nested-boxes.md) | Boxes within boxes |
| [`multiple-boxes.before.md`](./multiple-boxes.before.md) | [`multiple-boxes.md`](./multiple-boxes.md) | Several boxes in one diagram |
| [`ascii-style.before.md`](./ascii-style.before.md) | [`ascii-style.md`](./ascii-style.md) | ASCII `+---+` style boxes |
| [`architecture.before.md`](./architecture.before.md) | [`architecture.md`](./architecture.md) | Complex architecture diagram |

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

The `.before.md` files use the `nofix` language tag to preserve broken diagrams:

````markdown
```nofix
┌──────────────┐
│ Short        │
└──────────────┘
```
````

Code blocks with `nofix` or `*-nofix` language tags are skipped by boxfix.
