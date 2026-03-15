import { BoxfixResult, BoxfixStats, RIGHT_BORDER_CHARS, BoxRegion } from "./types.js";
import {
  getDisplayWidth,
  expandTabs,
  padBeforeLastChar,
  sliceByDisplayColumn,
  replaceByDisplayColumn,
} from "./width.js";
import {
  isDiagram,
  isBoundaryLine,
  isContentLine,
  isTreeLine,
  hasInnerBoundary,
  findInnerTopCornerColumn,
  hasBottomCornerAtColumn,
  findBoundaryEndColumn,
} from "./diagram-detector.js";

/**
 * Find all inner box regions within a diagram
 * An inner box is detected by finding a top-left corner (┌ or +) not at column 0,
 * then tracking until we find the matching bottom-left corner (└ or +) at the same column
 */
function findInnerBoxRegions(lines: string[]): BoxRegion[] {
  const regions: BoxRegion[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    // Look for inner top boundaries in this line
    if (!hasInnerBoundary(line)) {
      continue;
    }

    // Find all inner top corners in this line
    let searchCol = 0;
    while (true) {
      const startCol = findInnerTopCornerColumn(line, searchCol);
      if (startCol === -1) {
        break;
      }

      // Find the end column of this boundary
      const endCol = findBoundaryEndColumn(line, startCol);

      // Look for the matching bottom boundary
      let endLine = -1;
      for (let bottomIdx = lineIdx + 1; bottomIdx < lines.length; bottomIdx++) {
        if (hasBottomCornerAtColumn(lines[bottomIdx], startCol)) {
          // Verify it's a complete bottom boundary by checking end column too
          const bottomEndCol = findBoundaryEndColumn(lines[bottomIdx], startCol);
          if (bottomEndCol === endCol) {
            endLine = bottomIdx;
            break;
          }
        }
      }

      if (endLine !== -1) {
        regions.push({
          startLine: lineIdx,
          endLine,
          startCol,
          endCol,
        });
      }

      // Continue searching for more inner boxes on this line
      searchCol = endCol;
    }
  }

  return regions;
}

/**
 * Result of extracting an inner box
 */
interface ExtractedBox {
  content: string;
  /** Width of each extracted line (may differ from boundary width for content lines) */
  lineWidths: number[];
}

/**
 * Extract an inner box as a standalone diagram
 * For content lines, finds the actual right border position to avoid including outer box padding
 * Returns null if the extraction doesn't produce a valid box
 */
function extractInnerBox(lines: string[], region: BoxRegion): ExtractedBox | null {
  const extractedLines: string[] = [];
  const lineWidths: number[] = [];
  const verticalChars = ["│", "┃", "║", "|"];

  for (let i = region.startLine; i <= region.endLine; i++) {
    const line = lines[i];
    let extracted = sliceByDisplayColumn(line, region.startCol, region.endCol);
    let extractedWidth = getDisplayWidth(extracted);

    // For content lines (not top/bottom boundary), trim to the actual right border
    if (i !== region.startLine && i !== region.endLine) {
      // Find the last vertical border character in the extracted content
      let lastBorderIdx = -1;
      for (let j = extracted.length - 1; j >= 0; j--) {
        if (verticalChars.includes(extracted[j])) {
          lastBorderIdx = j;
          break;
        }
      }
      if (lastBorderIdx !== -1 && lastBorderIdx < extracted.length - 1) {
        // Trim to end at the border character and track the actual width
        extracted = extracted.slice(0, lastBorderIdx + 1);
        extractedWidth = getDisplayWidth(extracted);
      }
    }

    extractedLines.push(extracted);
    lineWidths.push(extractedWidth);
  }

  const content = extractedLines.join("\n");

  // Validate that the extraction produced a valid box
  // The first line should be a boundary line (start with corner character)
  const firstLine = extractedLines[0];
  const topCorners = ["┌", "╔", "╭", "┏", "+"];
  if (!firstLine || !topCorners.includes(firstLine[0])) {
    // Extraction didn't produce a valid box (misaligned inner box)
    return null;
  }

  // Also validate that content lines start with vertical border
  // (they might be offset if the inner box is misaligned)
  for (let i = 1; i < extractedLines.length - 1; i++) {
    const contentLine = extractedLines[i];
    if (contentLine && !verticalChars.includes(contentLine[0])) {
      // Content line doesn't start with border - misaligned inner box
      return null;
    }
  }

  return { content, lineWidths };
}

/**
 * Reinsert a fixed inner box back at its original position
 * Uses the original extracted widths and adjusts for width changes to maintain outer spacing
 */
function reinsertInnerBox(
  lines: string[],
  region: BoxRegion,
  fixedInner: string,
  originalWidths: number[]
): string[] {
  const fixedLines = fixedInner.split("\n");
  const result = [...lines];

  for (let i = 0; i < fixedLines.length; i++) {
    const lineIdx = region.startLine + i;
    if (lineIdx < result.length) {
      const originalWidth = originalWidths[i] || 0;
      const fixedWidth = getDisplayWidth(fixedLines[i]);
      const widthDiff = fixedWidth - originalWidth;

      // Extend the end column to consume trailing space if the fixed content is wider
      // This maintains the total line width by taking space from after the inner box
      const endCol = region.startCol + originalWidth + Math.max(0, widthDiff);

      result[lineIdx] = replaceByDisplayColumn(
        result[lineIdx],
        region.startCol,
        endCol,
        fixedLines[i]
      );
    }
  }

  return result;
}

/**
 * Fix a single ASCII diagram by correcting right border alignment
 *
 * Algorithm:
 * 1. Find and recursively fix any inner boxes first
 * 2. Process the diagram top to bottom, tracking current box context
 * 3. When we see a boundary line, update the target width for subsequent lines
 * 4. For content lines shorter than target (by small margin), pad them
 * 5. This handles nested/stacked boxes correctly by using local context
 */
export function boxfixDiagram(content: string): {
  result: string;
  linesFixed: number;
} {
  // Expand tabs first
  const expanded = expandTabs(content);
  let lines = expanded.split("\n");
  let totalLinesFixed = 0;

  // Phase 1: Find and recursively fix inner boxes
  const regions = findInnerBoxRegions(lines);

  // Sort regions: process right-to-left (higher startCol first) to avoid column invalidation
  // Also process deeper boxes first (those that start on later lines)
  regions.sort((a, b) => {
    if (a.startCol !== b.startCol) {
      return b.startCol - a.startCol; // Right to left
    }
    return b.startLine - a.startLine; // Later lines first
  });

  for (const region of regions) {
    const extracted = extractInnerBox(lines, region);
    // Skip if extraction didn't produce a valid box (misaligned inner box)
    if (extracted === null) {
      continue;
    }
    const { result: fixedInner, linesFixed: innerFixed } = boxfixDiagram(extracted.content);
    totalLinesFixed += innerFixed;
    lines = reinsertInnerBox(lines, region, fixedInner, extracted.lineWidths);
  }

  // Phase 2: Fix outer box (existing logic)

  // Find all boundary line widths to use as reference
  const boundaryWidths = new Set<number>();
  for (const line of lines) {
    if (isBoundaryLine(line)) {
      boundaryWidths.add(getDisplayWidth(line));
    }
  }

  // If no boundary lines found, return with just inner fixes
  if (boundaryWidths.size === 0) {
    return { result: lines.join("\n"), linesFixed: totalLinesFixed };
  }

  // Process each line, tracking current box context
  let outerLinesFixed = 0;
  let currentTargetWidth = 0;

  const fixedLines = lines.map((line) => {
    const lineWidth = getDisplayWidth(line);

    // If this is a boundary line, update current target width
    if (isBoundaryLine(line)) {
      currentTargetWidth = lineWidth;
      return line;
    }

    // Skip tree lines and non-content lines
    if (isTreeLine(line) || !isContentLine(line)) {
      return line;
    }

    // Check if line ends with a right border character
    const trimmed = line.trimEnd();
    const lastChar = trimmed.slice(-1);
    if (!RIGHT_BORDER_CHARS.includes(lastChar)) {
      return line;
    }

    // Find the best matching target width for this line
    // It should be a boundary width that's slightly larger than the current line
    let targetWidth = currentTargetWidth;

    // Look for a boundary width that this line is close to (within 1-3 chars)
    for (const bw of boundaryWidths) {
      const diff = bw - lineWidth;
      if (diff > 0 && diff <= 3) {
        // This boundary is a good match - prefer it if it's closer than current target
        if (targetWidth === 0 || Math.abs(bw - lineWidth) < Math.abs(targetWidth - lineWidth)) {
          targetWidth = bw;
        }
      }
    }

    // Only fix if we have a target and line is shorter
    // TODO: Support boundary expansion when content is longer than boundary.
    // Currently we only pad short lines - we don't expand boundaries to fit overflow.
    if (targetWidth === 0 || lineWidth >= targetWidth) {
      return line;
    }

    // Preserve any trailing whitespace after the border character
    const trailingWhitespace = line.slice(trimmed.length);

    // Pad before the last character
    const { padded, spacesAdded } = padBeforeLastChar(trimmed, targetWidth);

    if (spacesAdded > 0) {
      outerLinesFixed++;
      return padded + trailingWhitespace;
    }

    return line;
  });

  return {
    result: fixedLines.join("\n"),
    linesFixed: totalLinesFixed + outerLinesFixed,
  };
}

/**
 * Fix ASCII diagrams in a string (without markdown parsing)
 * This is the core function that processes raw diagram content
 */
export function boxfix(content: string): BoxfixResult {
  // If content is a diagram, fix it directly
  if (isDiagram(content)) {
    const { result, linesFixed } = boxfixDiagram(content);
    return {
      fixed: result,
      stats: {
        linesFixed,
        blocksProcessed: 1,
        diagramsFound: 1,
      },
    };
  }

  // Not a diagram, return unchanged
  return {
    fixed: content,
    stats: {
      linesFixed: 0,
      blocksProcessed: 0,
      diagramsFound: 0,
    },
  };
}

/**
 * Create empty stats object
 */
export function emptyStats(): BoxfixStats {
  return {
    linesFixed: 0,
    blocksProcessed: 0,
    diagramsFound: 0,
  };
}

/**
 * Merge multiple stats objects
 */
export function mergeStats(
  ...statsArray: BoxfixStats[]
): BoxfixStats {
  return statsArray.reduce(
    (acc, stats) => ({
      linesFixed: acc.linesFixed + stats.linesFixed,
      blocksProcessed: acc.blocksProcessed + stats.blocksProcessed,
      diagramsFound: acc.diagramsFound + stats.diagramsFound,
    }),
    emptyStats()
  );
}
