# Nested Boxes (Before)

Boxes within boxes - each with misaligned content.

```nofix
┌───────────────────────────────┐
│ Outer Container              │
│                            │
│  ┌─────────────────────┐     │
│  │ Inner Box          │      │
│  │ with content│             │
│  └─────────────────────┘     │
│                            │
│  ┌─────────────────────┐     │
│  │ Another Inner│            │
│  │ More content       │      │
│  └─────────────────────┘     │
│                            │
└───────────────────────────────┘
```

Both outer and inner box content lines need padding. `boxfix` handles nested boxes correctly.
