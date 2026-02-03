import { describe, it, expect } from "vitest";
import { boxfix, boxfixDiagram } from "../src/boxfix.js";
import { boxfixMarkdown } from "../src/markdown.js";
import { getDisplayWidth, expandTabs } from "../src/width.js";
import { isDiagram, isBoundaryLine, isContentLine, isTreeLine } from "../src/diagram-detector.js";

describe("getDisplayWidth", () => {
  it("calculates width of ASCII string", () => {
    expect(getDisplayWidth("hello")).toBe(5);
  });

  it("calculates width of string with box-drawing chars", () => {
    expect(getDisplayWidth("┌───┐")).toBe(5);
  });

  it("calculates width of CJK characters (2 columns each)", () => {
    expect(getDisplayWidth("日本")).toBe(4);
  });

  it("calculates width of mixed content", () => {
    expect(getDisplayWidth("│ 日本 │")).toBe(8);
  });
});

describe("expandTabs", () => {
  it("expands tab to spaces", () => {
    expect(expandTabs("a\tb")).toBe("a       b");
  });

  it("handles multiple tabs", () => {
    expect(expandTabs("\t\t")).toBe("                ");
  });
});

describe("isDiagram", () => {
  it("detects Unicode box diagram", () => {
    const diagram = `┌───┐
│ x │
└───┘`;
    expect(isDiagram(diagram)).toBe(true);
  });

  it("detects ASCII box diagram", () => {
    const diagram = `+---+
| x |
+---+`;
    expect(isDiagram(diagram)).toBe(true);
  });

  it("rejects plain text", () => {
    expect(isDiagram("hello world")).toBe(false);
  });

  it("rejects code without box chars", () => {
    expect(isDiagram("const x = 1;\nreturn x;")).toBe(false);
  });
});

describe("isBoundaryLine", () => {
  it("detects Unicode boundary line", () => {
    expect(isBoundaryLine("┌───────────────┐")).toBe(true);
  });

  it("detects ASCII boundary line", () => {
    expect(isBoundaryLine("+---------------+")).toBe(true);
  });

  it("rejects content line", () => {
    expect(isBoundaryLine("│ content │")).toBe(false);
  });

  it("rejects content line containing inner box boundary", () => {
    // This is a content line of an outer box that contains an inner box's bottom boundary
    expect(isBoundaryLine("│ └────┘   │")).toBe(false);
  });
});

describe("isContentLine", () => {
  it("detects line ending with │", () => {
    expect(isContentLine("│ content │")).toBe(true);
  });

  it("detects line ending with |", () => {
    expect(isContentLine("| content |")).toBe(true);
  });

  it("rejects boundary line", () => {
    expect(isContentLine("┌───┐")).toBe(false);
  });
});

describe("isTreeLine", () => {
  it("detects tree prefix ├", () => {
    expect(isTreeLine("├── child")).toBe(true);
  });

  it("detects tree prefix └", () => {
    expect(isTreeLine("└── last")).toBe(true);
  });

  it("does not reject box content with ├ and closing corner", () => {
    // This is a box line, not a tree line
    expect(isTreeLine("│  ├─ reference ────────────┤ │")).toBe(false);
  });
});

describe("boxfixDiagram", () => {
  it("fixes missing space before right border", () => {
    // Boundary is 11 chars wide, content is 10 (missing 1 space)
    const input = `┌─────────┐
│ content│
└─────────┘`;
    const expected = `┌─────────┐
│ content │
└─────────┘`;
    const { result } = boxfixDiagram(input);
    expect(result).toBe(expected);
  });

  it("fixes multiple lines", () => {
    // Boundary is 11 chars wide, content lines are 9 (missing 2 spaces)
    const input = `┌─────────┐
│ line 1│
│ line 2│
└─────────┘`;
    const expected = `┌─────────┐
│ line 1  │
│ line 2  │
└─────────┘`;
    const { result, linesFixed } = boxfixDiagram(input);
    expect(result).toBe(expected);
    expect(linesFixed).toBe(2);
  });

  it("does not modify already aligned diagram", () => {
    const input = `┌───────┐
│ good  │
└───────┘`;
    const { result, linesFixed } = boxfixDiagram(input);
    expect(result).toBe(input);
    expect(linesFixed).toBe(0);
  });

  it("handles nested boxes - fixes outer only", () => {
    // Outer boundary is 14 chars wide
    // Line 1: 13 wide (needs +1 space)
    // Line 2: 12 wide (needs +2 spaces)
    // Line 3: 12 wide (needs +2 spaces)
    const input = `┌────────────┐
│ ┌────┐    │
│ │ in │   │
│ └────┘   │
└────────────┘`;
    const expected = `┌────────────┐
│ ┌────┐     │
│ │ in │     │
│ └────┘     │
└────────────┘`;
    const { result, linesFixed } = boxfixDiagram(input);
    expect(result).toBe(expected);
    expect(linesFixed).toBe(3);
  });

  it("handles ASCII box style", () => {
    const input = `+-------+
| hello|
+-------+`;
    const expected = `+-------+
| hello |
+-------+`;
    const { result } = boxfixDiagram(input);
    expect(result).toBe(expected);
  });
});

describe("boxfix", () => {
  it("fixes diagram content", () => {
    const input = `┌───┐
│ x│
└───┘`;
    const result = boxfix(input);
    expect(result.fixed).toBe(`┌───┐
│ x │
└───┘`);
    expect(result.stats.linesFixed).toBe(1);
    expect(result.stats.diagramsFound).toBe(1);
  });

  it("returns unchanged for non-diagram", () => {
    const input = "just some text";
    const result = boxfix(input);
    expect(result.fixed).toBe(input);
    expect(result.stats.linesFixed).toBe(0);
    expect(result.stats.diagramsFound).toBe(0);
  });
});

describe("boxfixMarkdown", () => {
  it("processes diagram in code block", () => {
    const input = `# Title

\`\`\`
┌───┐
│ x│
└───┘
\`\`\`

Some text.`;

    const expected = `# Title

\`\`\`
┌───┐
│ x │
└───┘
\`\`\`

Some text.`;

    const result = boxfixMarkdown(input);
    expect(result.fixed).toBe(expected);
    expect(result.stats.linesFixed).toBe(1);
    expect(result.stats.diagramsFound).toBe(1);
  });

  it("skips non-diagram code blocks", () => {
    const input = `\`\`\`typescript
const x = 1;
\`\`\``;
    const result = boxfixMarkdown(input);
    expect(result.fixed).toBe(input);
    expect(result.stats.diagramsFound).toBe(0);
    expect(result.stats.blocksProcessed).toBe(1);
  });

  it("handles multiple code blocks", () => {
    const input = `\`\`\`
┌───┐
│ a│
└───┘
\`\`\`

Text between.

\`\`\`
┌───┐
│ b│
└───┘
\`\`\``;

    const result = boxfixMarkdown(input);
    expect(result.stats.linesFixed).toBe(2);
    expect(result.stats.diagramsFound).toBe(2);
    expect(result.stats.blocksProcessed).toBe(2);
  });
});
