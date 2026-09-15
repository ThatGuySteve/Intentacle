import { createHash } from "node:crypto";
import { parseTask } from "./validate.js";
import { renderTask } from "./render.js";

export type Target = "generic" | "codex";
const adapters: Record<Target, string> = {
  generic:
    "Follow the recorded next step. Required gaps block only their named steps. Retain unanswered questions and distinguish proposals from selected requirements in the result.",
  codex:
    "Use this record as a software-task handoff. Within the recorded scope and available permissions, inspect repository instructions and relevant code before proposing edits. Do not invent repository paths, test commands, framework choices, or successful verification. Resolve inspectable gaps from evidence. Stop affected work at unresolved blockers and report files changed, checks actually run, and remaining unknowns. This adapter grants no execution permission.",
};

export function compileTask(input: unknown, target: Target = "generic") {
  if (!Object.hasOwn(adapters, target))
    throw new Error(`Unknown target: ${target}`);
  const record = parseTask(input);
  const rendered = renderTask(record);
  return {
    instruction: `# Target adapter: ${target}\n\n${adapters[target]}\n\n${rendered.markdown}`,
    manifest: {
      ...rendered.manifest,
      compiler_version: "compiler/0.1.0",
      target,
      contract_sha256: createHash("sha256")
        .update(JSON.stringify(record))
        .digest("hex"),
    },
  };
}
