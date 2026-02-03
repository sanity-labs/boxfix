import { BoxfixResult, BoxfixStats, RIGHT_BORDER_CHARS } from "./types.js";
import { getDisplayWidth, expandTabs, padBeforeLastChar } from "./width.js";
import {
  isDiagram,
  isBoundaryLine,
  isContentLine,
  isTreeLine,
} from "./diagram-detector.js";

/**
 * Fix a single ASCII diagram by correcting right border alignment
 *
 * Algorithm:
 * 1. Process the diagram top to bottom, tracking current box context
 * 2. When we see a boundary line, update the target width for subsequent lines
 * 3. For content lines shorter than target (by small margin), pad them
 * 4. This handles nested/stacked boxes correctly by using local context
 */
export function boxfixDiagram(content: string): {
  result: string;
  linesFixed: number;
} {
  // Expand tabs first
  const expanded = expandTabs(content);
  const lines = expanded.split("\n");

  // Find all boundary line widths to use as reference
  const boundaryWidths = new Set<number>();
  for (const line of lines) {
    if (isBoundaryLine(line)) {
      boundaryWidths.add(getDisplayWidth(line));
    }
  }

  // If no boundary lines found, return unchanged
  if (boundaryWidths.size === 0) {
    return { result: content, linesFixed: 0 };
  }

  // Process each line, tracking current box context
  let linesFixed = 0;
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
      linesFixed++;
      return padded + trailingWhitespace;
    }

    return line;
  });

  return {
    result: fixedLines.join("\n"),
    linesFixed,
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
