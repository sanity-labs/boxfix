# Simple Box

The most common case: a single box where content lines are shorter than the boundary.

## Before

```
┌────────────────────────┐
│ User Authentication    │
│ Service                │
│                        │
│ Handles login/logout   │
└────────────────────────┘
```

## After (Fixed)

```
┌────────────────────────┐
│ User Authentication    │
│ Service                │
│                        │
│ Handles login/logout   │
└────────────────────────┘
```

## What Changed

Each content line was padded with spaces before the `│` to match the boundary width of 26 characters.
