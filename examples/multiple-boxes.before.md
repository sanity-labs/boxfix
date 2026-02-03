# Multiple Boxes (Before)

Multiple boxes in the same diagram with misaligned content.

```nofix
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Service A   │     │ Service B   │     │ Service C   │
│ Port 3000│        │ Port 3001│        │ Port 3002│
└──────────────┘    └──────────────┘    └──────────────┘
       │                  │                            │
       └──────────────────┼───────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Load Balancer│
                 │ nginx:latest│
                 └────────────────┘
```

Each box has content lines that don't match their boundary widths. Run `boxfix` to align.
