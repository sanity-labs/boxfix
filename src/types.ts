/**
 * Result of fixing a diagram or markdown content
 */
export interface BoxfixResult {
  /** The fixed content with corrected alignment */
  fixed: string;
  /** Statistics about the fix operation */
  stats: BoxfixStats;
}

/**
 * Statistics about the fix operation
 */
export interface BoxfixStats {
  /** Number of lines that were fixed */
  linesFixed: number;
  /** Number of code blocks processed */
  blocksProcessed: number;
  /** Number of diagrams detected and processed */
  diagramsFound: number;
}

/**
 * A code block extracted from markdown
 */
export interface CodeBlock {
  /** The full code block including fences */
  raw: string;
  /** The content inside the fences */
  content: string;
  /** The language identifier (if any) */
  language: string | null;
  /** Start position in original string */
  start: number;
  /** End position in original string */
  end: number;
}

/**
 * Box-drawing characters used in ASCII diagrams
 */
export const BOX_CHARS = {
  // Unicode box-drawing
  corners: ["┌", "┐", "└", "┘"],
  horizontal: ["─", "━"],
  vertical: ["│", "┃"],
  tees: ["├", "┤", "┬", "┴", "┼"],
  // ASCII alternatives
  asciiCorners: ["+"],
  asciiHorizontal: ["-", "="],
  asciiVertical: ["|"],
} as const;

/**
 * All right border characters (vertical lines that can end a content line)
 */
export const RIGHT_BORDER_CHARS: string[] = [...BOX_CHARS.vertical, ...BOX_CHARS.asciiVertical];

/**
 * Characters that indicate a boundary line (top/bottom of box)
 */
export const CORNER_CHARS: string[] = [...BOX_CHARS.corners, ...BOX_CHARS.asciiCorners];
