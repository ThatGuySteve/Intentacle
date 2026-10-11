#!/usr/bin/env node
import { open } from "node:fs/promises";
import { parseTask } from "../../dist/index.js";
import { analyzeContextGaps } from "./analyze.mjs";

const MAX_BYTES = 1024 * 1024;
const path = process.argv[2];
if (process.argv.length !== 3 || !path || path === "-") {
  process.stderr.write("Usage: node experiments/context-preflight/cli.mjs path/to/task.json\n");
  process.exitCode = 2;
} else {
  let handle;
  try {
    handle = await open(path, "r");
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error("Input must be a regular file no larger than 1 MiB.");
    const data = await handle.readFile({ encoding: "utf8" });
    if (Buffer.byteLength(data, "utf8") > MAX_BYTES) throw new Error("Input exceeds the 1 MiB limit.");
    const record = parseTask(JSON.parse(data));
    process.stdout.write(JSON.stringify(analyzeContextGaps(record), null, 2) + "\n");
  } catch (error) {
    process.stderr.write(`Context preflight: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  } finally {
    await handle?.close();
  }
}
