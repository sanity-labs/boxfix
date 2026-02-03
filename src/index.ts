/**
 * boxfix
 * Fix misaligned ASCII diagram borders in markdown files
 */

export { boxfix, boxfixDiagram } from "./boxfix.js";
export { boxfixMarkdown } from "./markdown.js";
export { isDiagram, isBoundaryLine, isContentLine, isTreeLine } from "./diagram-detector.js";
export { getDisplayWidth, expandTabs } from "./width.js";
export type { BoxfixResult, BoxfixStats, CodeBlock } from "./types.js";
