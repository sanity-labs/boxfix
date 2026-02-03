import { describe, it, expect } from "vitest";
import { boxfix, boxfixDiagram } from "../src/boxfix.js";
import { boxfixMarkdown } from "../src/markdown.js";
import { getDisplayWidth, expandTabs, sliceByDisplayColumn, mapDisplayColumnToCharIndex } from "../src/width.js";
import { isDiagram, isBoundaryLine, isContentLine, isTreeLine, hasInnerBoundary } from "../src/diagram-detector.js";
import { extractFilePath } from "../src/cli.js";

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

describe("hasInnerBoundary", () => {
  it("detects inner boundary in content line", () => {
    expect(hasInnerBoundary("│  ┌─────────┐     │")).toBe(true);
  });

  it("detects ASCII inner boundary", () => {
    expect(hasInnerBoundary("| +-------+        |")).toBe(true);
  });

  it("returns false for content line without inner boundary", () => {
    expect(hasInnerBoundary("│ just content     │")).toBe(false);
  });

  it("returns false for boundary line", () => {
    expect(hasInnerBoundary("┌─────────────────┐")).toBe(false);
  });
});

describe("sliceByDisplayColumn", () => {
  it("slices ASCII string by columns", () => {
    expect(sliceByDisplayColumn("hello world", 0, 5)).toBe("hello");
  });

  it("slices string with box chars", () => {
    expect(sliceByDisplayColumn("│ content │", 0, 3)).toBe("│ c");
  });

  it("handles CJK characters (2 columns each)", () => {
    // "日本" = 4 columns
    expect(sliceByDisplayColumn("日本語", 0, 4)).toBe("日本");
  });
});

describe("mapDisplayColumnToCharIndex", () => {
  it("maps column to index for ASCII", () => {
    expect(mapDisplayColumnToCharIndex("hello", 3)).toBe(3);
  });

  it("maps column to index with CJK", () => {
    // "日" is at index 0-1 (columns 0-1), "本" is at index 1 (columns 2-3)
    expect(mapDisplayColumnToCharIndex("日本語", 2)).toBe(1);
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

  it("fixes nested boxes - inner box content", () => {
    // The inner box content "Inner Box" is too short - needs padding
    const input = `┌───────────────────────────────┐
│ Outer Container               │
│  ┌─────────────────────┐      │
│  │ Inner Box          │       │
│  └─────────────────────┘      │
└───────────────────────────────┘`;
    const expected = `┌───────────────────────────────┐
│ Outer Container               │
│  ┌─────────────────────┐      │
│  │ Inner Box           │      │
│  └─────────────────────┘      │
└───────────────────────────────┘`;
    const { result, linesFixed } = boxfixDiagram(input);
    expect(result).toBe(expected);
    expect(linesFixed).toBe(1);
  });

  it("fixes deeply nested boxes (3 levels)", () => {
    const input = `┌─────────────────────────────────────┐
│ Level 1                            │
│  ┌───────────────────────────────┐  │
│  │ Level 2                      │   │
│  │  ┌─────────────────────────┐ │   │
│  │  │ Level 3               │  │    │
│  │  └─────────────────────────┘ │   │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘`;
    const expected = `┌─────────────────────────────────────┐
│ Level 1                             │
│  ┌───────────────────────────────┐  │
│  │ Level 2                       │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Level 3                 │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘`;
    const { result } = boxfixDiagram(input);
    expect(result).toBe(expected);
  });

  it("fixes multiple inner boxes side by side", () => {
    // Content lines have 3 spaces between boxes to align with boundary (2 spaces + 1 for offset)
    const input = `┌─────────────────────────────────────┐
│ ┌─────────┐  ┌─────────┐           │
│ │ Box A  │   │ Box B  │           │
│ └─────────┘  └─────────┘           │
└─────────────────────────────────────┘`;
    const expected = `┌─────────────────────────────────────┐
│ ┌─────────┐  ┌─────────┐            │
│ │ Box A   │  │ Box B   │            │
│ └─────────┘  └─────────┘            │
└─────────────────────────────────────┘`;
    const { result } = boxfixDiagram(input);
    expect(result).toBe(expected);
  });

  it("fixes ASCII nested boxes", () => {
    const input = `+-------------------+
| +-------+        |
| | inner|         |
| +-------+        |
+-------------------+`;
    const expected = `+-------------------+
| +-------+         |
| | inner |         |
| +-------+         |
+-------------------+`;
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

describe("extractFilePath", () => {
  it("extracts path from Claude Code format (tool_input.file_path)", () => {
    const json = { tool_input: { file_path: "docs/readme.md" } };
    expect(extractFilePath(json)).toBe("docs/readme.md");
  });

  it("extracts path from generic format (file_path)", () => {
    const json = { file_path: "test.md" };
    expect(extractFilePath(json)).toBe("test.md");
  });

  it("extracts path from camelCase format (filePath)", () => {
    const json = { filePath: "example.md" };
    expect(extractFilePath(json)).toBe("example.md");
  });

  it("extracts path from nested input format (input.file_path)", () => {
    const json = { input: { file_path: "nested/file.md" } };
    expect(extractFilePath(json)).toBe("nested/file.md");
  });

  it("extracts path from minimal format (path)", () => {
    const json = { path: "simple.md" };
    expect(extractFilePath(json)).toBe("simple.md");
  });

  it("prefers tool_input.file_path over other fields", () => {
    const json = {
      tool_input: { file_path: "priority.md" },
      file_path: "fallback.md",
      path: "last.md",
    };
    expect(extractFilePath(json)).toBe("priority.md");
  });

  it("returns null for empty object", () => {
    expect(extractFilePath({})).toBe(null);
  });

  it("returns null for null input", () => {
    expect(extractFilePath(null)).toBe(null);
  });

  it("returns null for non-object input", () => {
    expect(extractFilePath("string")).toBe(null);
    expect(extractFilePath(123)).toBe(null);
    expect(extractFilePath(undefined)).toBe(null);
  });

  it("returns null for empty string path", () => {
    const json = { file_path: "" };
    expect(extractFilePath(json)).toBe(null);
  });

  it("returns null when no recognizable path field exists", () => {
    const json = { something_else: "value.md" };
    expect(extractFilePath(json)).toBe(null);
  });
});
