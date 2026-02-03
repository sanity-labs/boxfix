# Simple Box (Before)

A single box with misaligned content lines - typical LLM output.

```nofix
┌────────────────────────┐
│ User Authentication   │
│ Service│
│                     │
│ Handles login/logout│
└────────────────────────┘
```

Content lines are shorter than the 26-character boundary width. Run `boxfix` to fix.
