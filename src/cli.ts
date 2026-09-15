#!/usr/bin/env node
import { open, readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  createTask,
  parseTask,
  extractOffline,
  extractTask,
  createChatProvider,
  planClarification,
  answerUnknowns,
  compileTask,
  decideTask,
  inspectTask,
  renderTask,
  validateTask,
} from "./index.js";
import type { Target, ClarificationAnswer } from "./index.js";
import type { ReviewState, Step } from "./types.js";

const LIMIT = 1024 * 1024;
const HELP = `Intentacle — local-first intent compiler V0 (experimental)

Usage:
  intentacle parse "request" [--provider offline|chat] [--endpoint URL --model NAME] [--id task-id] [--out task.json]
  intentacle clarify task.json [--step inspect|plan|execute] [--answers answers.json] [--out next.json]
  intentacle compile task.json [--target generic|codex] [--json] [--require-ready] [--out task.md]
  intentacle init "literal request" [--id task-id] [--out task.json]
  intentacle validate task.json
  intentacle inspect task.json [--step clarify|inspect|plan|execute] [--full]
  intentacle render task.json [--json] [--require-ready] [--out task.md]
  intentacle decide task.json item-id confirm|delegate|reject --reason "user answer" [--out next.json]

Use - instead of task.json to read JSON from stdin. Output defaults to stdout.
--out creates a new file and refuses to overwrite an existing one.
init copies the request literally; it does not run AI extraction.
validate checks structure and provenance, not readiness or factual truth.
Exit codes: 0 success, 2 invalid input/I/O/usage, 3 blocked (--require-ready).
Only parse --provider chat calls a model, at the explicitly configured endpoint.
Use INTENTACLE_API_KEY for optional credentials. No command executes a task or fetches references.
Offline parse is a conservative scaffold plus a narrow subscriptions demo, not semantic extraction.
`;

async function input(path: string): Promise<unknown> {
  if (path === "-") {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      const bytes = Buffer.from(chunk as Uint8Array);
      size += bytes.length;
      if (size > LIMIT) throw new Error("Input exceeds the 1 MiB limit.");
      chunks.push(bytes);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }
  const handle = await open(path, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile())
      throw new Error("Input must be a regular file or - for stdin.");
    if (stat.size > LIMIT) throw new Error("Input exceeds the 1 MiB limit.");
    const buffer = Buffer.alloc(LIMIT + 1);
    let size = 0;
    while (size < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        size,
        buffer.length - size,
        null,
      );
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > LIMIT) throw new Error("Input exceeds the 1 MiB limit.");
    return JSON.parse(buffer.subarray(0, size).toString("utf8"));
  } finally {
    await handle.close();
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean" },
      out: { type: "string" },
      id: { type: "string" },
      step: { type: "string" },
      json: { type: "boolean" },
      full: { type: "boolean" },
      "require-ready": { type: "boolean" },
      reason: { type: "string" },
      provider: { type: "string" },
      endpoint: { type: "string" },
      model: { type: "string" },
      target: { type: "string" },
      answers: { type: "string" },
    },
  });
  if (values.help) {
    process.stdout.write(HELP);
    return;
  }
  if (values.version) {
    process.stdout.write(
      `${JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).version}\n`,
    );
    return;
  }
  if (!positionals.length) {
    process.stdout.write(HELP);
    return;
  }
  const [command, path, item, action] = positionals;
  const allowed: Record<string, string[]> = {
    init: ["id", "out"],
    parse: ["id", "out", "provider", "endpoint", "model"],
    clarify: ["step", "answers", "out"],
    compile: ["target", "json", "require-ready", "out"],
    validate: [],
    inspect: ["step", "full"],
    render: ["json", "require-ready", "out"],
    decide: ["reason", "out"],
  };
  if (!command || !Object.hasOwn(allowed, command))
    throw new Error("Unknown command. Run intentacle --help.");
  for (const key of Object.keys(values)) {
    if (!allowed[command]?.includes(key))
      throw new Error(`--${key} is not supported by ${command}.`);
  }
  if (!path || positionals.length !== (command === "decide" ? 4 : 2))
    throw new Error(`Invalid arguments for ${command}. Run intentacle --help.`);
  let output: unknown;
  let plain = false;
  switch (command) {
    case "parse": {
      const provider = values.provider ?? "offline";
      if (provider === "offline") {
        if (values.endpoint || values.model)
          throw new Error("Use --provider chat for an explicit model call.");
        output = extractOffline(path, values.id);
      } else if (provider === "chat") {
        if (!values.endpoint || !values.model)
          throw new Error("chat requires --endpoint and --model.");
        const config = {
          endpoint: values.endpoint,
          model: values.model,
          ...(process.env.INTENTACLE_API_KEY
            ? { apiKey: process.env.INTENTACLE_API_KEY }
            : {}),
        };
        output = await extractTask(
          path,
          createChatProvider(config).extract,
          values.id,
        );
      } else throw new Error("Unknown provider; choose offline or chat.");
      break;
    }
    case "clarify": {
      if (values.answers && values.step)
        throw new Error(
          "--step selects questions; omit it when applying answers.",
        );
      const record = await input(path);
      output = values.answers
        ? answerUnknowns(
            record,
            (await input(values.answers)) as ClarificationAnswer[],
          )
        : planClarification(record, values.step as Step | undefined);
      break;
    }
    case "compile": {
      const result = compileTask(
        await input(path),
        (values.target ?? "generic") as Target,
      );
      if (values["require-ready"] && result.manifest.readiness.blocked) {
        process.stderr.write(
          `Blocked for ${result.manifest.readiness.step}: ${result.manifest.readiness.blockers.map((b) => b.id).join(", ")}\n`,
        );
        process.exitCode = 3;
        return;
      }
      output = values.json ? result : result.instruction;
      plain = !values.json;
      break;
    }
    case "init":
      output = createTask(path, values.id);
      break;
    case "validate": {
      const result = validateTask(await input(path));
      output = { valid: result.valid, diagnostics: result.diagnostics };
      if (!result.valid) process.exitCode = 2;
      break;
    }
    case "inspect": {
      const record = parseTask(await input(path));
      const readiness = inspectTask(record, values.step as Step | undefined);
      output = values.full
        ? {
            readiness,
            record,
            assumptions: record.items.filter(
              (i) => i.origin === "inferred" || i.origin === "default",
            ),
            clarification: planClarification(
              record,
              values.step as Step | undefined,
            ),
          }
        : readiness;
      break;
    }
    case "render": {
      const result = renderTask(await input(path));
      if (values["require-ready"] && result.manifest.readiness.blocked) {
        process.stderr.write(
          `Blocked for ${result.manifest.readiness.step}: ${result.manifest.readiness.blockers.map((blocker) => blocker.id).join(", ")}\n`,
        );
        process.exitCode = 3;
        return;
      }
      output = values.json ? result : result.markdown;
      plain = !values.json;
      break;
    }
    case "decide": {
      const states: Record<string, Exclude<ReviewState, "unreviewed">> = {
        confirm: "confirmed",
        delegate: "delegated",
        reject: "rejected",
      };
      const state = action ? states[action] : undefined;
      if (!state || !item || !values.reason)
        throw new Error(
          "decide requires an item, confirm|delegate|reject, and --reason.",
        );
      output = decideTask(await input(path), item, state, values.reason);
      break;
    }
  }
  const serialized = plain
    ? String(output)
    : `${JSON.stringify(output, null, 2)}\n`;
  if (values.out) {
    const handle = await open(values.out, "wx");
    try {
      await handle.writeFile(serialized, "utf8");
    } finally {
      await handle.close();
    }
  } else process.stdout.write(serialized);
}

process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});
main().catch((error: unknown) => {
  process.stderr.write(
    `Intentacle: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 2;
  process.stdin.destroy();
});
