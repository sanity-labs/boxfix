#!/usr/bin/env node
import { program } from "commander";
import { readFileSync, writeFileSync, existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import { boxfixMarkdown } from "./markdown.js";

/**
 * Extract file path from common JSON field patterns used by AI agents.
 * Supports multiple formats for agent-agnostic integration.
 */
export function extractFilePath(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;

  // Check common path locations (order of precedence)
  const candidates = [
    (obj.tool_input as Record<string, unknown>)?.file_path, // Claude Code, Cursor
    obj.file_path, // Generic
    obj.filePath, // camelCase variant
    (obj.input as Record<string, unknown>)?.file_path, // Nested input object
    obj.path, // Minimal
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return null;
}

/**
 * Read JSON from stdin and extract file path for hook processing.
 * Returns null if stdin is TTY, JSON is invalid, or path is not a markdown file.
 */
async function readHookInput(): Promise<string | null> {
  // Return null if stdin is TTY (no piped input)
  if (process.stdin.isTTY) {
    return null;
  }

  // Read all stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const input = Buffer.concat(chunks).toString("utf-8").trim();

  if (!input) {
    return null;
  }

  // Parse JSON
  let json: unknown;
  try {
    json = JSON.parse(input);
  } catch {
    return null;
  }

  // Extract file path
  const filePath = extractFilePath(json);
  if (!filePath) {
    return null;
  }

  // Only process markdown files
  if (!filePath.endsWith(".md") && !filePath.endsWith(".markdown")) {
    return null;
  }

  return filePath;
}

interface FileResult {
  file: string;
  linesFixed: number;
  blocksProcessed: number;
  diagramsFound: number;
}

interface JsonOutput {
  files: FileResult[];
  summary: {
    totalFiles: number;
    filesWithFixes: number;
    totalLinesFixed: number;
    totalDiagramsFound: number;
  };
}

program
  .name("boxfix")
  .description("Fix misaligned ASCII diagram borders in markdown files")
  .version("1.0.0")
  .argument("[patterns...]", "File path(s) or glob pattern(s) to process")
  .option("-o, --output <file>", "Output to file (only valid with single input)")
  .option("-i, --in-place", "Modify files in place")
  .option("-d, --dry-run", "Show what would be changed without modifying files")
  .option("-q, --quiet", "Suppress output except errors")
  .option("-c, --check", "Check if files need fixing (exit code 1 if fixes needed)")
  .option("-j, --json", "Output results as JSON")
  .option(
    "--hook",
    "Read JSON from stdin, extract file path, and fix in-place (for agent integration)"
  )
  .action(async (patterns: string[], options) => {
    const { output, inPlace, dryRun, quiet, check, json, hook } = options;

    // Hook mode: read JSON from stdin and process file
    if (hook) {
      const filePath = await readHookInput();
      if (!filePath || !existsSync(filePath)) {
        process.exit(0); // Silent success
      }

      try {
        const content = readFileSync(filePath, "utf-8");
        const result = boxfixMarkdown(content);
        if (result.stats.linesFixed > 0) {
          writeFileSync(filePath, result.fixed, "utf-8");
        }
      } catch {
        // Ignore errors in hook mode
      }
      process.exit(0);
    }

    // Normal mode requires patterns
    if (!patterns || patterns.length === 0) {
      console.error("Error: No files specified");
      process.exit(1);
    }

    // Expand glob patterns
    const files: string[] = [];
    for (const pattern of patterns) {
      if (existsSync(pattern)) {
        files.push(pattern);
      } else {
        const matches = await glob(pattern);
        files.push(...matches);
      }
    }

    if (files.length === 0) {
      if (json) {
        console.log(JSON.stringify({ error: "No files found matching the given pattern(s)" }));
      } else {
        console.error("Error: No files found matching the given pattern(s)");
      }
      process.exit(1);
    }

    // Validate options
    if (output && files.length > 1) {
      if (json) {
        console.log(JSON.stringify({ error: "--output can only be used with a single input file" }));
      } else {
        console.error("Error: --output can only be used with a single input file");
      }
      process.exit(1);
    }

    if (output && inPlace) {
      if (json) {
        console.log(JSON.stringify({ error: "Cannot use both --output and --in-place" }));
      } else {
        console.error("Error: Cannot use both --output and --in-place");
      }
      process.exit(1);
    }

    if (check && (inPlace || output)) {
      if (json) {
        console.log(JSON.stringify({ error: "--check cannot be used with --in-place or --output" }));
      } else {
        console.error("Error: --check cannot be used with --in-place or --output");
      }
      process.exit(1);
    }

    let totalFixed = 0;
    let filesModified = 0;
    const fileResults: FileResult[] = [];

    for (const file of files) {
      try {
        const content = readFileSync(file, "utf-8");
        const result = boxfixMarkdown(content);

        const fileResult: FileResult = {
          file,
          linesFixed: result.stats.linesFixed,
          blocksProcessed: result.stats.blocksProcessed,
          diagramsFound: result.stats.diagramsFound,
        };
        fileResults.push(fileResult);

        if (result.stats.linesFixed > 0) {
          filesModified++;
          totalFixed += result.stats.linesFixed;
        }

        if (check || dryRun) {
          if (!quiet && !json && result.stats.linesFixed > 0) {
            const prefix = check ? "" : "[dry-run] ";
            console.log(
              `${prefix}${file}: ${result.stats.linesFixed} line(s) ${check ? "need fixing" : "would be fixed"}`
            );
          }
          continue;
        }

        if (output) {
          // Output to specified file
          writeFileSync(output, result.fixed, "utf-8");
          if (!quiet && !json) {
            console.log(`Written to ${output}`);
          }
        } else if (inPlace) {
          // Modify in place
          if (result.stats.linesFixed > 0) {
            writeFileSync(file, result.fixed, "utf-8");
            if (!quiet && !json) {
              console.log(`${file}: fixed ${result.stats.linesFixed} line(s)`);
            }
          } else if (!quiet && !json) {
            console.log(`${file}: no changes needed`);
          }
        } else {
          // Output to stdout (single file)
          if (files.length === 1 && !json) {
            process.stdout.write(result.fixed);
          } else if (!json) {
            // Multiple files without --in-place: show summary
            if (!quiet) {
              if (result.stats.linesFixed > 0) {
                console.log(`${file}: ${result.stats.linesFixed} line(s) need fixing`);
              } else {
                console.log(`${file}: ok`);
              }
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (json) {
          console.log(JSON.stringify({ error: `Error processing ${file}: ${message}` }));
        } else {
          console.error(`Error processing ${file}: ${message}`);
        }
        process.exit(1);
      }
    }

    // JSON output
    if (json) {
      const jsonOutput: JsonOutput = {
        files: fileResults,
        summary: {
          totalFiles: files.length,
          filesWithFixes: filesModified,
          totalLinesFixed: totalFixed,
          totalDiagramsFound: fileResults.reduce((sum, f) => sum + f.diagramsFound, 0),
        },
      };
      console.log(JSON.stringify(jsonOutput, null, 2));
    } else if ((inPlace || dryRun || check) && files.length > 1 && !quiet) {
      // Summary for batch operations
      const action = check ? "need fixing" : dryRun ? "would be fixed" : "fixed";
      console.log(
        `\nSummary: ${totalFixed} line(s) ${action} in ${filesModified} file(s)`
      );
    }

    // Exit with code 1 if --check found issues
    if (check && totalFixed > 0) {
      process.exit(1);
    }
  });

// Only run when executed directly, not when imported
// Use realpathSync to resolve symlinks (npx creates symlinks in .bin/)
function checkIsMain(): boolean {
  if (typeof import.meta.url === "undefined" || !process.argv[1]) {
    return false;
  }
  try {
    const moduleRealPath = realpathSync(fileURLToPath(import.meta.url));
    const argvRealPath = realpathSync(process.argv[1]);
    return moduleRealPath === argvRealPath;
  } catch {
    return false;
  }
}

if (checkIsMain()) {
  program.parse();
}
