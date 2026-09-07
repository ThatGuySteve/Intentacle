import { randomUUID } from "node:crypto";
import { parseTask } from "./validate.js";
import {
  SCHEMA_VERSION,
  type Disposition,
  type Item,
  type Readiness,
  type ReviewState,
  type Step,
  type TaskRecord,
} from "./types.js";

export function disposition(item: Item): Disposition {
  if (item.review.state === "rejected") return "rejected";
  if (item.review.state === "confirmed" || item.review.state === "delegated")
    return "active";
  if (
    item.origin === "user_stated" ||
    (item.origin === "source_reported" && item.kind === "context")
  )
    return "active";
  return "proposed";
}

/** Only recorded blockers are checked. This does not certify completeness or permission. */
export function inspectTask(input: unknown, step?: Step): Readiness {
  const record = parseTask(input);
  const next = step ?? record.next_step;
  if (!["clarify", "inspect", "plan", "execute"].includes(next))
    throw new Error(`Unknown step: ${next}`);
  const blockers: Readiness["blockers"] = [
    ...record.unknowns
      .filter((u) => u.status === "open" && u.blocks.includes(next))
      .map((u) => ({ id: u.id, kind: "unknown" as const, reason: u.question })),
    ...record.conflicts
      .filter((c) => c.status === "open" && c.blocks.includes(next))
      .map((c) => ({
        id: c.id,
        kind: "conflict" as const,
        reason: c.description,
      })),
  ];
  return { step: next, blocked: blockers.length > 0, blockers };
}

/** Literal scaffold only: no extraction, inferred requirements, or guessed context. */
export function createTask(
  request: string,
  taskId = `task-${randomUUID()}`,
): TaskRecord {
  return parseTask({
    schema_version: SCHEMA_VERSION,
    task_id: taskId,
    revision: 1,
    next_step: "clarify",
    references: [
      {
        id: "request-1",
        kind: "user_request",
        availability: "supplied",
        content: request,
      },
    ],
    items: [
      {
        id: "objective-1",
        kind: "objective",
        text: request,
        origin: "user_stated",
        source_ids: ["request-1"],
        review: { state: "unreviewed" },
      },
    ],
    unknowns: [],
    conflicts: [],
  });
}

/** The caller records an actual user decision. This API does not authenticate the user. */
export function decideTask(
  input: unknown,
  itemId: string,
  state: Exclude<ReviewState, "unreviewed">,
  reason: string,
): TaskRecord {
  const record = structuredClone(parseTask(input));
  const item = record.items.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error(`Item ${itemId} does not exist.`);
  if (!["confirmed", "delegated", "rejected"].includes(state))
    throw new Error(`Unknown review state: ${state}`);
  if (!reason.trim())
    throw new Error("Record the user's answer or delegation in --reason.");
  if (record.revision === Number.MAX_SAFE_INTEGER)
    throw new Error("Revision limit reached.");
  record.revision += 1;
  const used = new Set(
    [
      ...record.references,
      ...record.items,
      ...record.unknowns,
      ...record.conflicts,
    ].map((entry) => entry.id),
  );
  let suffix = 1;
  let id = `answer-${record.revision}`;
  while (used.has(id)) id = `answer-${record.revision}-${suffix++}`;
  record.references.push({
    id,
    kind: "user_answer",
    availability: "supplied",
    content: reason,
    applies_to: [itemId],
  });
  item.review = { state, source_id: id };
  return parseTask(record);
}
