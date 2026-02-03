# Multiple Boxes

Multiple boxes in the same diagram, each with independent boundaries.

## Before

The service boxes have short content lines:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Service A   │    │ Service B   │    │ Service C      │
│ Port 3000   │    │ Port 3001   │    │ Port 3002      │
└──────────────┘    └──────────────┘    └──────────────┘
       │                  │                            │
       └──────────────────┼──────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Load Balancer  │
                 │ nginx:latest   │
                 └────────────────┘
```

## After (Fixed)

All content lines padded to match their boundary widths:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Service A    │    │ Service B    │    │ Service C    │
│ Port 3000    │    │ Port 3001    │    │ Port 3002    │
└──────────────┘    └──────────────┘    └──────────────┘
       │                  │                            │
       └──────────────────┼──────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Load Balancer  │
                 │ nginx:latest   │
                 └────────────────┘
```

## What Changed

- Each of the three service boxes was padded to 16 characters
- The load balancer box was padded to 18 characters
- Connection lines (│, └, ┼) are left untouched
