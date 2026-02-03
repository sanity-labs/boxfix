# Architecture Diagram

A complex architecture diagram with nested boxes, references, and connections.

## Before

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

## After (Fixed)

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

## What Changed

- Outer container content lines padded to match the 67-character boundary
- Inner boxes within the outer container are left at their own widths
- The separate `reusablePageBlock` box is already correctly aligned

## Notes

This diagram shows a common Sanity CMS pattern where landing pages reference shared reusable content blocks. The tool correctly handles:
- Nested boxes (inner content boxes within the landing pages)
- Connection lines (the vertical reference arrow)
- Mixed indentation levels
