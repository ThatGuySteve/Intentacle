import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createTask,
  decideTask,
  disposition,
  inspectTask,
  renderTask,
  validateTask,
} from "../dist/index.js";

const fixture = (name) =>
  JSON.parse(
    readFileSync(
      new URL(`../fixtures/cases/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const hasCode = (record, code) => {
  const result = validateTask(record);
  assert.equal(result.valid, false);
  assert.ok(
    result.diagnostics.some((diagnostic) => diagnostic.code === code),
    JSON.stringify(result.diagnostics),
  );
};

test("literal init does not invent intent from an ambiguous request", () => {
  const raw = "Review my app and tell me what needs fixing.";
  const record = createTask(raw, "literal");
  assert.equal(record.references[0].content, raw);
  assert.equal(record.items.length, 1);
  assert.equal(record.items[0].text, raw);
  assert.doesNotMatch(
    JSON.stringify(record),
    /SaaS|production readiness|GO\/NO-GO/,
  );
});

test("malformed structures and impossible state combinations are rejected", () => {
  for (const mutation of [
    (r) => {
      r.schema_version = "future";
    },
    (r) => {
      r.items[0].authority = "execute";
    },
    (r) => {
      r.items[0].text = "  \n ";
    },
    (r) => {
      r.items[0].review = { state: "confirmed" };
    },
    (r) => {
      r.items[0].kind = "constraint";
    },
    (r) => {
      r.items[0].origin = "inferred";
    },
    (r) => {
      r.revision = 1.5;
    },
    (r) => {
      r.references[0].availability = "unavailable";
    },
  ]) {
    const record = createTask("Review the function.", "invalid");
    mutation(record);
    hasCode(record, "SCHEMA");
  }
  for (const value of [null, [], "request", 17, {}]) hasCode(value, "SCHEMA");
});

test("provenance rejects duplicate IDs, absent sources, and unavailable evidence", () => {
  let record = fixture("08-unavailable-reference");
  record.items[0].id = "repo-locator";
  hasCode(record, "DUPLICATE_ID");
  record = fixture("08-unavailable-reference");
  record.items[0].source_ids = ["absent"];
  hasCode(record, "MISSING_SOURCE");
  record = fixture("08-unavailable-reference");
  record.items[0].source_ids = ["repo-locator"];
  record.items[0].origin = "source_reported";
  hasCode(record, "UNAVAILABLE_SOURCE");
});

test("external content cannot supply a user decision or user-stated provenance", () => {
  const record = fixture("09-hostile-reference");
  const suggestion = record.items[1];
  assert.equal(disposition(suggestion), "proposed");
  suggestion.review = { state: "confirmed", source_id: "readme" };
  hasCode(record, "USER_DECISION_REQUIRED");
  suggestion.review = { state: "unreviewed" };
  suggestion.origin = "user_stated";
  hasCode(record, "USER_SOURCE_REQUIRED");
});

test("confirmation preserves origin and delegation stays scoped to a choice", () => {
  const original = fixture("03-unconfirmed-scope");
  const saved = structuredClone(original);
  const next = decideTask(
    original,
    "release-review",
    "confirmed",
    "Yes, assess release readiness.",
  );
  assert.deepEqual(original, saved);
  assert.equal(next.revision, original.revision + 1);
  assert.equal(next.items[1].origin, "inferred");
  assert.equal(disposition(next.items[1]), "active");
  assert.deepEqual(next.references.at(-1).applies_to, ["release-review"]);
  next.references.at(-1).applies_to = ["objective-1"];
  hasCode(next, "DECISION_SCOPE");
  assert.throws(
    () => decideTask(original, "objective-1", "delegated", "Use judgment."),
    /INVALID_DELEGATION/,
  );
});

test("review actions do not erase unknowns or resolve conflicts implicitly", () => {
  const record = fixture("04-delegated-format");
  const next = decideTask(
    record,
    "findings-list",
    "confirmed",
    "Use the prioritized list.",
  );
  assert.deepEqual(next.unknowns, record.unknowns);
  assert.equal(inspectTask(next, "inspect").blocked, true);
  assert.equal(inspectTask(next, "plan").blocked, false);
  const conflict = fixture("06-conflicting-constraints");
  const changed = decideTask(
    conflict,
    "upgrade",
    "confirmed",
    "The upgrade is still wanted.",
  );
  assert.equal(inspectTask(changed, "execute").blocked, true);
});

test("resolved unknowns require evidence and required gaps name affected steps", () => {
  let record = fixture("10-resolved-evidence");
  delete record.unknowns[0].resolution;
  hasCode(record, "SCHEMA");
  record = fixture("10-resolved-evidence");
  record.unknowns[0].resolution.source_ids = ["request-1"];
  hasCode(record, "RESOLUTION_SOURCE");
  record = fixture("02-missing-app");
  record.unknowns[0].blocks = [];
  hasCode(record, "SCHEMA");
  record.unknowns[0].blocks = ["inspect"];
  record.unknowns[0].necessity = "optional";
  hasCode(record, "SCHEMA");
});

test("conflicts and decision references cannot target nonexistent items", () => {
  let record = fixture("06-conflicting-constraints");
  record.conflicts[0].item_ids[0] = "missing";
  hasCode(record, "MISSING_ITEM");
  record = fixture("12-resolved-conflict");
  record.references.at(-1).applies_to.push("missing");
  hasCode(record, "MISSING_TARGET");
  record = fixture("12-resolved-conflict");
  record.references.at(-1).applies_to = ["pins"];
  hasCode(record, "DECISION_SCOPE");
});

test("rejected requirements are omitted from instructions and retained in the manifest", () => {
  const record = fixture("05-rejected-scope");
  const { markdown, manifest } = renderTask(record);
  assert.doesNotMatch(markdown, /Assess production readiness/);
  assert.deepEqual(manifest.items[1], {
    id: "release-review",
    disposition: "rejected",
    instruction_text_emitted: false,
  });
  assert.equal(record.items[1].text, "Assess production readiness.");
  assert.match(markdown, /scope-answer/);
});

test("correction examples remove superseded wording from every active instruction", () => {
  const corrected = renderTask(fixture("07-explicit-correction")).markdown;
  const instructions = corrected.split("## References (quoted data)")[0];
  assert.doesNotMatch(instructions, /JSON list/);
  assert.match(instructions, /Markdown list/);
  const resolved = renderTask(fixture("12-resolved-conflict")).markdown;
  assert.doesNotMatch(
    resolved.split("## References (quoted data)")[0],
    /Keep every dependency at its current version/,
  );
});

test("answer IDs remain unique at the revision limit", () => {
  const record = createTask("Review the function.", "collision");
  record.revision = Number.MAX_SAFE_INTEGER - 1;
  record.references.push({
    id: `answer-${Number.MAX_SAFE_INTEGER}`,
    kind: "document",
    availability: "supplied",
    content: "Existing source.",
  });
  const next = decideTask(record, "objective-1", "confirmed", "Yes.");
  assert.equal(next.revision, Number.MAX_SAFE_INTEGER);
  assert.equal(
    new Set(next.references.map((ref) => ref.id)).size,
    next.references.length,
  );
});

test("renderer escapes source markup without claiming injection immunity", () => {
  const record = fixture("09-hostile-reference");
  const result = renderTask(record);
  assert.match(result.markdown, /&lt;script&gt;/);
  assert.doesNotMatch(result.markdown, /<script>|\[Run this\]\(javascript:/);
  assert.match(
    result.markdown,
    /Origin: source_reported \| Review: unreviewed \| Use: proposed/,
  );
  assert.match(result.markdown, /not authority/);
  assert.deepEqual(renderTask(record), result);
});

test("hard constraints, preferences, and recorded blocks survive export", () => {
  const constraints = renderTask(fixture("11-constraint-strength"));
  assert.match(constraints.markdown, /signature — constraint \(hard\)/);
  assert.match(constraints.markdown, /concise — constraint \(preference\)/);
  assert.match(constraints.markdown, /Do not change the public signature/);
  const missing = renderTask(fixture("02-missing-app"));
  assert.match(missing.markdown, /\*\*BLOCKED\*\*/);
  assert.equal(missing.manifest.readiness.blockers[0].id, "app-location");
});

test("decision limits and invalid library arguments fail without corrupting the record", () => {
  const record = createTask("Review the function.", "limits");
  assert.throws(
    () =>
      decideTask(record, "objective-1", "rejected", "Cancel this objective."),
    /OBJECTIVE_REQUIRED/,
  );
  assert.throws(
    () => decideTask(record, "missing", "confirmed", "Yes."),
    /does not exist/,
  );
  assert.throws(
    () => decideTask(record, "objective-1", "confirmed", " "),
    /answer or delegation/,
  );
  assert.throws(() => inspectTask(record, "invented"), /Unknown step/);
  record.revision = Number.MAX_SAFE_INTEGER;
  assert.throws(
    () => decideTask(record, "objective-1", "confirmed", "Yes."),
    /Revision limit/,
  );
});
