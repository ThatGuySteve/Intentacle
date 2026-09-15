import { createHash } from "node:crypto";
import { extractOffline } from "./extract.js";
import { compileTask, type Target } from "./compile.js";
import { parseTask } from "./validate.js";
import type { TaskRecord } from "./types.js";

export const BENCHMARK_PROTOCOL = "v0-development/1";
export interface PublicCase {
  id: string;
  request: string;
}
export interface BaselineArtifact {
  instruction: string;
  tool_commit: string;
  transcript: string;
}
export interface BenchmarkPacket {
  case_id: string;
  arm: "control" | "prompt-master" | "intentacle-quick" | "intentacle-guided";
  status: "ready" | "missing";
  instruction: string | null;
  input_sha256: string;
  artifact_sha256: string | null;
  reason: string | null;
}
export function hashArtifact(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** Only public inputs enter this boundary. Oracle/rubric data belongs outside the model packets. */
export function prepareBenchmarkCase(
  scenario: PublicCase,
  options: {
    target?: Target;
    quick?: TaskRecord;
    guided?: TaskRecord;
    baseline?: BaselineArtifact;
  } = {},
): BenchmarkPacket[] {
  if (
    !/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(scenario.id) ||
    !scenario.request.trim()
  )
    throw new Error("Invalid public benchmark case.");
  const quick = options.quick ?? extractOffline(scenario.request, scenario.id);
  const checkRequest = (record: TaskRecord) => {
    parseTask(record);
    const request = record.references.find((r) => r.id === "request-1");
    if (
      request?.kind !== "user_request" ||
      request.content !== scenario.request
    )
      throw new Error(
        "Benchmark contract does not preserve the public request.",
      );
  };
  checkRequest(quick);
  if (options.guided) {
    checkRequest(options.guided);
    if (
      options.guided.task_id !== quick.task_id ||
      options.guided.revision <= quick.revision
    )
      throw new Error(
        "Guided artifact must be a later revision of the quick task.",
      );
    if (!options.guided.references.some((r) => r.kind === "user_answer"))
      throw new Error(
        "Guided artifact requires a recorded user interaction; do not relabel Quick.",
      );
  }
  if (
    options.baseline &&
    (!options.baseline.instruction.trim() ||
      !options.baseline.transcript.trim() ||
      !/^[a-f0-9]{40}$/.test(options.baseline.tool_commit))
  )
    throw new Error(
      "Baseline requires actual output, transcript, and pinned 40-character tool commit.",
    );
  const packet = (
    arm: BenchmarkPacket["arm"],
    instruction: string | null,
    artifact: unknown,
    reason: string | null,
  ): BenchmarkPacket => ({
    case_id: scenario.id,
    arm,
    status: instruction === null ? "missing" : "ready",
    instruction,
    input_sha256: hashArtifact(scenario),
    artifact_sha256: artifact === null ? null : hashArtifact(artifact),
    reason,
  });
  return [
    packet("control", scenario.request, scenario, null),
    packet(
      "prompt-master",
      options.baseline?.instruction ?? null,
      options.baseline ?? null,
      options.baseline
        ? null
        : "Actual Prompt Master output and transcript not supplied.",
    ),
    packet(
      "intentacle-quick",
      compileTask(quick, options.target).instruction,
      quick,
      null,
    ),
    packet(
      "intentacle-guided",
      options.guided
        ? compileTask(options.guided, options.target).instruction
        : null,
      options.guided ?? null,
      options.guided
        ? null
        : "A genuinely clarified task revision was not supplied.",
    ),
  ];
}
