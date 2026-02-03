import { CodeBlock, BoxfixResult } from "./types.js";
import { isDiagram } from "./diagram-detector.js";
import { boxfixDiagram, emptyStats, mergeStats } from "./boxfix.js";

/**
 * Regular expression to match fenced code blocks in markdown
 * Captures: opening fence, language, content, closing fence
 */
const CODE_BLOCK_REGEX = /^(```+)(\w*)\n([\s\S]*?)\n\1$/gm;

/**
 * Extract all fenced code blocks from markdown content
 */
export function extractCodeBlocks(markdown: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = new RegExp(CODE_BLOCK_REGEX.source, "gm");

  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({
      raw: match[0],
      content: match[3],
      language: match[2] || null,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return blocks;
}

/**
 * Process a markdown string, finding and fixing diagram code blocks
 */
export function boxfixMarkdown(markdown: string): BoxfixResult {
  const blocks = extractCodeBlocks(markdown);

  if (blocks.length === 0) {
    return {
      fixed: markdown,
      stats: emptyStats(),
    };
  }

  let result = markdown;
  let offset = 0;
  let totalStats = emptyStats();

  for (const block of blocks) {
    // Check if this code block contains a diagram
    if (!isDiagram(block.content)) {
      totalStats = mergeStats(totalStats, {
        linesFixed: 0,
        blocksProcessed: 1,
        diagramsFound: 0,
      });
      continue;
    }

    // Fix the diagram
    const { result: fixedContent, linesFixed } = boxfixDiagram(
      block.content
    );

    // Reconstruct the code block with fixed content
    const fence = block.raw.match(/^(`+)/)?.[1] || "```";
    const lang = block.language || "";
    const newBlock = `${fence}${lang}\n${fixedContent}\n${fence}`;

    // Replace in result string (accounting for previous replacements)
    const adjustedStart = block.start + offset;
    const adjustedEnd = block.end + offset;
    result =
      result.slice(0, adjustedStart) + newBlock + result.slice(adjustedEnd);

    // Update offset for next replacement
    offset += newBlock.length - block.raw.length;

    totalStats = mergeStats(totalStats, {
      linesFixed,
      blocksProcessed: 1,
      diagramsFound: 1,
    });
  }

  return {
    fixed: result,
    stats: totalStats,
  };
}
