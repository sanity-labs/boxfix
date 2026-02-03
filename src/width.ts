import stringWidth from "string-width";

/**
 * Get the display width of a string, accounting for:
 * - CJK characters (2 columns each)
 * - Emoji (variable width)
 * - ANSI escape codes (0 width)
 * - Combining characters (0 width)
 */
export function getDisplayWidth(str: string): number {
  return stringWidth(str);
}

/**
 * Expand tabs to spaces (default 8-space tab stops)
 */
export function expandTabs(str: string, tabSize = 8): string {
  let result = "";
  let column = 0;

  for (const char of str) {
    if (char === "\t") {
      const spacesToAdd = tabSize - (column % tabSize);
      result += " ".repeat(spacesToAdd);
      column += spacesToAdd;
    } else {
      result += char;
      // For width calculation, use 1 for regular chars
      // This is a simplification - actual width calculated elsewhere
      column += 1;
    }
  }

  return result;
}

/**
 * Pad a string to a target display width by inserting spaces before the last character
 */
export function padBeforeLastChar(
  line: string,
  targetWidth: number
): { padded: string; spacesAdded: number } {
  const currentWidth = getDisplayWidth(line);
  const spacesNeeded = targetWidth - currentWidth;

  if (spacesNeeded <= 0) {
    return { padded: line, spacesAdded: 0 };
  }

  // Insert spaces before the last character
  const beforeLast = line.slice(0, -1);
  const lastChar = line.slice(-1);

  return {
    padded: beforeLast + " ".repeat(spacesNeeded) + lastChar,
    spacesAdded: spacesNeeded,
  };
}
