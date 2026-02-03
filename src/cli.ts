#!/usr/bin/env node
import { program } from "commander";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { glob } from "glob";
import { boxfixMarkdown } from "./markdown.js";

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
  .argument("<patterns...>", "File path(s) or glob pattern(s) to process")
  .option("-o, --output <file>", "Output to file (only valid with single input)")
  .option("-i, --in-place", "Modify files in place")
  .option("-d, --dry-run", "Show what would be changed without modifying files")
  .option("-q, --quiet", "Suppress output except errors")
  .option("-c, --check", "Check if files need fixing (exit code 1 if fixes needed)")
  .option("-j, --json", "Output results as JSON")
  .action(async (patterns: string[], options) => {
    const { output, inPlace, dryRun, quiet, check, json } = options;

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

program.parse();
