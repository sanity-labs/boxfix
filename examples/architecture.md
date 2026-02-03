# Architecture Diagram

A complex architecture diagram with nested boxes, references, and connections.

```
┌─────────────────────────────────────────────────────────────────┐
│  Landing Page A                    Landing Page B               │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │ content[]            │         │ content[]                │  │
│  │  ├─ heroPageBlock    │         │  ├─ featureSpotlight     │  │
│  │  ├─ reference ───────┼────┬────┼──┤ reference ────────────┤  │
│  │  └─ articlePageBlock │    │    │  └─ quotePageBlock       │  │
│  └──────────────────────┘    │    └──────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────────┐
                    │  reusablePageBlock     │
                    │  (document)            │
                    │                        │
                    │  title: "Shared CTA"   │
                    │  invertColor: false    │
                    │  content[0]:           │
                    │    callToActionBlock   │
                    └────────────────────────┘
```

This diagram shows a Sanity CMS pattern where landing pages reference shared reusable content blocks. The tool correctly handles:
- Nested boxes (inner content boxes within the landing pages)
- Connection lines (the vertical reference arrow)
- Mixed indentation levels
