# Nested Boxes

Boxes within boxes - each box has its own boundary that content aligns to.

```
┌───────────────────────────────┐
│ Outer Container               │
│                               │
│  ┌─────────────────────┐      │
│  │ Inner Box           │      │
│  │ with content        │      │
│  └─────────────────────┘      │
│                               │
│  ┌─────────────────────┐      │
│  │ Another Inner       │      │
│  │ More content        │      │
│  └─────────────────────┘      │
│                               │
└───────────────────────────────┘
```

- Outer box content lines padded to match the 33-character outer boundary
- Inner box content lines padded to match their 23-character boundaries
- Each box is fixed independently based on its own boundary width
