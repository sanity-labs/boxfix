import { BOX_CHARS, CORNER_CHARS } from "./types.js";

/**
 * Check if content appears to be an ASCII diagram (as opposed to regular code)
 */
export function isDiagram(content: string): boolean {
  const lines = content.split("\n");

  // Must have at least 2 lines to be a box diagram
  if (lines.length < 2) {
    return false;
  }

  // Check for box-drawing characters
  const hasBoxChars = lines.some((line) => {
    // Check for Unicode box-drawing
    const hasUnicodeBox = [...BOX_CHARS.corners, ...BOX_CHARS.horizontal, ...BOX_CHARS.vertical].some(
      (char) => line.includes(char)
    );
    // Check for ASCII box-drawing (+ with - or |)
    const hasAsciiBox =
      line.includes("+") && (line.includes("-") || line.includes("|"));

    return hasUnicodeBox || hasAsciiBox;
  });

  if (!hasBoxChars) {
    return false;
  }

  // Check for boundary lines (lines with corners)
  const hasBoundaryLine = lines.some((line) =>
    CORNER_CHARS.some((char) => line.includes(char))
  );

  return hasBoundaryLine;
}

/**
 * Check if a line is a tree structure line (should not be normalized)
 * Tree lines use ├── patterns and do NOT start and end with │ (box content)
 */
export function isTreeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2) return false;

  const verticalChars: string[] = [...BOX_CHARS.vertical, ...BOX_CHARS.asciiVertical];
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  // If line starts and ends with vertical border chars, it's a content line, not a tree
  if (verticalChars.includes(firstChar) && verticalChars.includes(lastChar)) {
    return false;
  }

  // Tree patterns: lines that START with ├ or └ (tree structure)
  const treeStartChars = ["├", "└"];
  if (treeStartChars.includes(firstChar)) {
    return true;
  }

  return false;
}

/**
 * Check if a line is a boundary line (top/bottom of a box)
 * Boundary lines START and END with corner characters and contain horizontal lines
 * This distinguishes them from content lines that may contain inner box boundaries
 */
export function isBoundaryLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  // Unicode boundary: starts and ends with corner characters
  const unicodeCorners: readonly string[] = BOX_CHARS.corners;
  const startsWithUnicodeCorner = unicodeCorners.includes(firstChar);
  const endsWithUnicodeCorner = unicodeCorners.includes(lastChar);

  if (startsWithUnicodeCorner && endsWithUnicodeCorner) {
    // Must also contain horizontal lines
    const hasHorizontal = BOX_CHARS.horizontal.some((c) => trimmed.includes(c));
    if (hasHorizontal) {
      return true;
    }
  }

  // ASCII boundary: starts and ends with + and contains horizontal lines
  if (firstChar === "+" && lastChar === "+") {
    const hasAsciiHorizontal = BOX_CHARS.asciiHorizontal.some((c) =>
      trimmed.includes(c)
    );
    if (hasAsciiHorizontal) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a line is a content line that should be normalized
 * Content lines both START and END with a vertical border character
 * and have content between them (minimum 3 chars: border + content + border)
 * This distinguishes them from standalone connector lines (e.g., just "│" for arrows)
 */
export function isContentLine(line: string): boolean {
  const trimmed = line.trim();
  // Need at least 3 chars: start border, some content, end border
  if (trimmed.length < 3) return false;

  const verticalChars: string[] = [...BOX_CHARS.vertical, ...BOX_CHARS.asciiVertical];

  // Check if line both starts and ends with a vertical border
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  return verticalChars.includes(firstChar) && verticalChars.includes(lastChar);
}
