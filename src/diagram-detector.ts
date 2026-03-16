import { BOX_CHARS, CORNER_CHARS } from "./types.js";
import { getDisplayWidth } from "./width.js";

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

  // Unicode boundary: starts and ends with corner or tee characters
  const boundaryEndChars: string[] = [...BOX_CHARS.corners, ...BOX_CHARS.tees];
  const startsWithBoundaryChar = boundaryEndChars.includes(firstChar);
  const endsWithBoundaryChar = boundaryEndChars.includes(lastChar);

  if (startsWithBoundaryChar && endsWithBoundaryChar) {
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
 * Check if a line is a connector line between multiple boxes
 * Connector lines have more than 2 vertical bars with only whitespace between them
 * Example: "│   │   │" (connector) vs "│ foo │ bar │" (table row with content)
 */
export function isConnectorLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;

  const verticalChars: string[] = [...BOX_CHARS.vertical, ...BOX_CHARS.asciiVertical];

  // Split by vertical chars and collect segments
  const segments: string[] = [];
  let current = "";

  for (const char of trimmed) {
    if (verticalChars.includes(char)) {
      segments.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  segments.push(current); // last segment after final pipe

  // Count vertical chars (segments.length - 1)
  const pipeCount = segments.length - 1;

  // Need more than 2 vertical chars to be a connector line
  if (pipeCount <= 2) return false;

  // Check interior segments (skip first and last as they can be empty)
  // All interior segments must be whitespace-only
  for (let i = 1; i < segments.length - 1; i++) {
    if (segments[i].trim() !== "") {
      return false; // Has non-whitespace content
    }
  }

  return true;
}

/**
 * Check if a line is a content line that should be normalized
 * Content lines both START and END with a vertical border character
 * and have content between them (minimum 3 chars: border + content + border)
 * This distinguishes them from standalone connector lines (e.g., just "│" for arrows)
 */
export function isContentLine(line: string): boolean {
  const trimmed = line.trim();
  // Need at least 2 chars: start border + end border (empty content is valid)
  if (trimmed.length < 2) return false;

  const verticalChars: string[] = [...BOX_CHARS.vertical, ...BOX_CHARS.asciiVertical];

  // Check if line both starts and ends with a vertical border
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  // Exclude connector lines (multiple pipes with only whitespace between)
  if (isConnectorLine(line)) {
    return false;
  }

  return verticalChars.includes(firstChar) && verticalChars.includes(lastChar);
}

/**
 * Check if a content line contains an inner box boundary
 * (a corner character that is not at the start of the line)
 */
export function hasInnerBoundary(line: string): boolean {
  const trimmed = line.trim();

  // Must be a content line first
  if (!isContentLine(line)) {
    return false;
  }

  // Check for corner chars not at position 0
  const topCorners = ["┌", "╔", "╭", "┏", "+"];

  // Skip first character (the outer border) and look for inner boundaries
  for (let i = 1; i < trimmed.length - 1; i++) {
    if (topCorners.includes(trimmed[i])) {
      return true;
    }
  }

  return false;
}

/**
 * Find the display column of a top-left corner character in a line
 * Returns -1 if not found
 */
export function findInnerTopCornerColumn(line: string, startSearchCol = 0): number {
  const topCorners = ["┌", "╔", "╭", "┏", "+"];
  let currentCol = 0;

  for (const char of line) {
    if (currentCol > startSearchCol && topCorners.includes(char)) {
      return currentCol;
    }
    currentCol += getDisplayWidth(char);
  }

  return -1;
}

/**
 * Find the display column of a bottom-left corner character at a specific column
 * Returns true if a bottom corner exists at the given column
 */
export function hasBottomCornerAtColumn(line: string, col: number): boolean {
  const bottomCorners = ["└", "╚", "╰", "┗", "+"];
  let currentCol = 0;

  for (const char of line) {
    if (currentCol === col) {
      return bottomCorners.includes(char);
    }
    if (currentCol > col) {
      return false;
    }
    currentCol += getDisplayWidth(char);
  }

  return false;
}

/**
 * Find the right edge of a box boundary starting at a given column
 * Returns the column after the last character of the boundary
 */
export function findBoundaryEndColumn(line: string, startCol: number): number {
  const horizontalChars = ["─", "━", "═", "-", "="];
  const endCorners = ["┐", "┘", "╗", "╝", "╮", "╯", "┓", "┛", "+"];
  let currentCol = 0;
  let lastBoundaryCol = startCol;

  for (const char of line) {
    if (currentCol > startCol) {
      if (endCorners.includes(char)) {
        return currentCol + getDisplayWidth(char);
      }
      if (horizontalChars.includes(char) || char === " ") {
        lastBoundaryCol = currentCol + getDisplayWidth(char);
      }
    }
    currentCol += getDisplayWidth(char);
  }

  return lastBoundaryCol;
}
