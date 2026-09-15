import { parseTask } from "./validate.js";
import { inspectTask } from "./core.js";
import type { Step, TaskRecord } from "./types.js";

export function planClarification(input: unknown, step?: Step) {
  const record = parseTask(input);
  const readiness = inspectTask(record, step);
  const open = record.unknowns.filter((u) => u.status === "open");
  const eligible = open
    .filter(
      (u) =>
        u.next_action !== "inspect_source" &&
        ((u.necessity === "required" && u.blocks.includes(readiness.step)) ||
          (u.necessity === "important" && Boolean(u.effect))),
    )
    .sort(
      (a, b) =>
        Number(b.necessity === "required") - Number(a.necessity === "required"),
    );
  return {
    step: readiness.step,
    questions: eligible.slice(0, 3),
    remaining_question_ids: eligible.slice(3).map((u) => u.id),
    inspect_first: open.filter((u) => u.next_action === "inspect_source"),
    deferred_unknown_ids: open
      .filter(
        (u) => !eligible.includes(u) && u.next_action !== "inspect_source",
      )
      .map((u) => u.id),
    conflicts: record.conflicts.filter((c) => c.status === "open"),
    guidance:
      "Answer several questions in one JSON batch. Use action=defer for unknown or best judgment; this does not resolve a fact or authorize a guess.",
  };
}

export interface ClarificationAnswer {
  id: string;
  action: "answer" | "defer";
  text: string;
}

/** Structured answers apply literally. No model interprets consent or resolves adjacent gaps. */
export function answerUnknowns(
  input: unknown,
  answers: ClarificationAnswer[],
): TaskRecord {
  const record = structuredClone(parseTask(input));
  if (!Array.isArray(answers) || answers.length < 1 || answers.length > 3)
    throw new Error("Provide one to three scoped answers per interaction.");
  if (record.revision === Number.MAX_SAFE_INTEGER)
    throw new Error("Revision limit reached.");
  const seen = new Set<string>();
  for (const answer of answers) {
    if (
      !answer ||
      typeof answer !== "object" ||
      Object.keys(answer).some((k) => !["id", "action", "text"].includes(k)) ||
      typeof answer.text !== "string" ||
      !answer.text.trim() ||
      !["answer", "defer"].includes(answer.action) ||
      seen.has(answer.id)
    )
      throw new Error(
        "Each answer needs a unique id, answer|defer action, and literal nonempty text.",
      );
    if (
      answer.action === "answer" &&
      /^(?:i don['’]?t know|unknown|undecided|not sure|use (?:your )?best judg(?:e)?ment)[.!?]?$/i.test(
        answer.text.trim(),
      )
    )
      throw new Error("An unresolved answer must use action=defer.");
    seen.add(answer.id);
    const unknown = record.unknowns.find(
      (u) => u.id === answer.id && u.status === "open",
    );
    if (!unknown) throw new Error(`Open unknown ${answer.id} does not exist.`);
    const ids = new Set(
      [
        ...record.references,
        ...record.items,
        ...record.unknowns,
        ...record.conflicts,
      ].map((x) => x.id),
    );
    let n = 1;
    while (ids.has(`clarification-${record.revision + 1}-${n}`)) n++;
    const id = `clarification-${record.revision + 1}-${n}`;
    record.references.push({
      id,
      kind: "user_answer",
      availability: "supplied",
      content: answer.text,
      applies_to: [unknown.id],
    });
    if (answer.action === "answer") {
      unknown.status = "resolved";
      unknown.resolution = { text: answer.text, source_ids: [id] };
    }
  }
  record.revision++;
  return parseTask(record);
}
