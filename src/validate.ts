import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import type {
  Diagnostic,
  Reference,
  TaskRecord,
  ValidationResult,
} from "./types.js";

const schema: object = JSON.parse(
  readFileSync(new URL("../schema/task.schema.json", import.meta.url), "utf8"),
);
const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
});
const checkShape = ajv.compile<TaskRecord>(schema);

/** Structural/provenance consistency, not natural-language truth or authorization. */
export function validateTask(input: unknown): ValidationResult {
  if (!checkShape(input)) {
    return {
      valid: false,
      diagnostics: (checkShape.errors ?? []).map((error) => ({
        code: "SCHEMA",
        path: error.instancePath || "/",
        message: `${error.message ?? "Invalid structure"} ${JSON.stringify(error.params)}`,
      })),
    };
  }
  const record = input;
  const diagnostics: Diagnostic[] = [];
  const fail = (code: string, path: string, message: string) =>
    diagnostics.push({ code, path, message });
  const ids = new Set<string>();
  for (const name of [
    "references",
    "items",
    "unknowns",
    "conflicts",
  ] as const) {
    record[name].forEach((entry, i) => {
      if (ids.has(entry.id))
        fail(
          "DUPLICATE_ID",
          `/${name}/${i}/id`,
          `ID ${entry.id} is already used.`,
        );
      ids.add(entry.id);
    });
  }
  const refs = new Map(record.references.map((ref) => [ref.id, ref]));
  const itemIds = new Set(record.items.map((item) => item.id));
  const reviewTargets = new Set([
    ...itemIds,
    ...record.unknowns.map((u) => u.id),
    ...record.conflicts.map((c) => c.id),
  ]);
  function supplied(id: string, path: string): Reference | undefined {
    const ref = refs.get(id);
    if (!ref) fail("MISSING_SOURCE", path, `Source ${id} does not exist.`);
    else if (ref.availability !== "supplied")
      fail("UNAVAILABLE_SOURCE", path, `Source ${id} has no supplied content.`);
    return ref?.availability === "supplied" ? ref : undefined;
  }
  function answer(id: string, target: string, path: string): void {
    const ref = supplied(id, path);
    if (!ref) return;
    if (ref.kind !== "user_answer")
      fail(
        "USER_DECISION_REQUIRED",
        path,
        "A supplied user answer is required.",
      );
    else if (!ref.applies_to?.includes(target))
      fail("DECISION_SCOPE", path, `Answer ${id} does not apply to ${target}.`);
  }
  record.references.forEach((ref, i) =>
    ref.applies_to?.forEach((target) => {
      if (!reviewTargets.has(target))
        fail(
          "MISSING_TARGET",
          `/references/${i}/applies_to`,
          `Target ${target} does not exist.`,
        );
    }),
  );
  record.items.forEach((item, i) => {
    const path = `/items/${i}`;
    const sources = item.source_ids.map((id) =>
      supplied(id, `${path}/source_ids`),
    );
    if (
      item.origin === "user_stated" &&
      !sources.some(
        (ref) =>
          ref?.kind === "user_request" ||
          (ref?.kind === "user_answer" && ref.applies_to?.includes(item.id)),
      )
    ) {
      fail(
        "USER_SOURCE_REQUIRED",
        path,
        "User-stated items need a user request or an answer scoped to this item.",
      );
    }
    if (
      item.origin === "source_reported" &&
      !sources.some((ref) => ref?.kind === "document")
    ) {
      fail(
        "DOCUMENT_SOURCE_REQUIRED",
        path,
        "Source-reported items need a supplied document.",
      );
    }
    if (item.review.source_id)
      answer(item.review.source_id, item.id, `${path}/review/source_id`);
    if (
      item.review.state === "delegated" &&
      item.origin !== "inferred" &&
      item.origin !== "default"
    ) {
      fail(
        "INVALID_DELEGATION",
        `${path}/review`,
        "Only an inferred or default choice can be delegated; delegation does not establish facts.",
      );
    }
  });
  if (
    !record.items.some(
      (item) => item.kind === "objective" && item.review.state !== "rejected",
    )
  ) {
    fail(
      "OBJECTIVE_REQUIRED",
      "/items",
      "At least one non-rejected objective is required.",
    );
  }
  record.unknowns.forEach((unknown, i) =>
    unknown.resolution?.source_ids.forEach((id) => {
      const path = `/unknowns/${i}/resolution/source_ids`;
      const ref = supplied(id, path);
      if (ref?.kind === "user_answer") answer(id, unknown.id, path);
      else if (ref && ref.kind !== "document")
        fail(
          "RESOLUTION_SOURCE",
          path,
          "Resolution needs a supplied document or a scoped user answer.",
        );
    }),
  );
  record.conflicts.forEach((conflict, i) => {
    conflict.item_ids.forEach((id) => {
      if (!itemIds.has(id))
        fail(
          "MISSING_ITEM",
          `/conflicts/${i}/item_ids`,
          `Item ${id} does not exist.`,
        );
    });
    if (conflict.resolution)
      answer(
        conflict.resolution.source_id,
        conflict.id,
        `/conflicts/${i}/resolution/source_id`,
      );
  });
  return diagnostics.length
    ? { valid: false, diagnostics }
    : { valid: true, record, diagnostics: [] };
}

export class InvalidTaskError extends Error {
  constructor(public readonly diagnostics: Diagnostic[]) {
    super(
      diagnostics.map((d) => `${d.code} ${d.path}: ${d.message}`).join("\n"),
    );
    this.name = "InvalidTaskError";
  }
}

export function parseTask(input: unknown): TaskRecord {
  const result = validateTask(input);
  if (!result.valid) throw new InvalidTaskError(result.diagnostics);
  return result.record;
}
