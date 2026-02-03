# Architecture Diagram (Before)

A complex architecture diagram with misaligned content throughout.

```nofix
┌─────────────────────────────────────────────────────────────────┐
│  Landing Page A                    Landing Page B              │
│  ┌──────────────────────┐         ┌──────────────────────────┐ │
│  │ content[]           │          │ content[]               │  │
│  │  ├─ heroPageBlock   │          │  ├─ featureSpotlight    │  │
│  │  ├─ reference ───────┼────┬────┼──┤ reference ────────────┤ │
│  │  └─ articlePageBlock│     │    │  └─ quotePageBlock      │  │
│  └──────────────────────┘    │    └──────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────────┐
                    │  reusablePageBlock    │
                    │  (document)           │
                    │                       │
                    │  title: "Shared CTA" │
                    │  invertColor: false  │
                    │  content[0]:         │
                    │    callToActionBlock │
                    └────────────────────────┘
```

Multiple nested boxes with varying content line widths. `boxfix` handles the complexity.
