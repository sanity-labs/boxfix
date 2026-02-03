# Multiple Boxes

Multiple boxes in the same diagram, each with independent boundaries.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Service A    │    │ Service B    │    │ Service C    │
│ Port 3000    │    │ Port 3001    │    │ Port 3002    │
└──────────────┘    └──────────────┘    └──────────────┘
       │                  │                            │
       └──────────────────┼───────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Load Balancer  │
                 │ nginx:latest   │
                 └────────────────┘
```

- Each service box is padded to 16 characters
- The load balancer box is padded to 18 characters
- Connection lines (│, └, ┼) are left untouched
