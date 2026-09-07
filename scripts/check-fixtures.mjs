import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import {
  disposition,
  inspectTask,
  renderTask,
  validateTask,
} from "../dist/index.js";

const expectations = JSON.parse(
  await readFile(
    new URL("../fixtures/expectations.json", import.meta.url),
    "utf8",
  ),
);
const files = await readdir(new URL("../fixtures/cases/", import.meta.url));
assert.equal(
  expectations.length,
  12,
  "Keep the first twelve development scenarios explicit.",
);
assert.deepEqual(
  files.sort(),
  expectations.map((entry) => `${entry.name}.json`).sort(),
);
for (const entry of expectations) {
  const record = JSON.parse(
    await readFile(
      new URL(`../fixtures/cases/${entry.name}.json`, import.meta.url),
      "utf8",
    ),
  );
  const before = JSON.stringify(record);
  const result = validateTask(record);
  assert.equal(
    result.valid,
    true,
    `${entry.name}: ${JSON.stringify(result.diagnostics)}`,
  );
  const blocked = ["clarify", "inspect", "plan", "execute"].filter(
    (step) => inspectTask(record, step).blocked,
  );
  assert.deepEqual(
    blocked,
    entry.expected.blocked_steps,
    `${entry.name}: blocked steps`,
  );
  for (const state of ["active", "proposed", "rejected"]) {
    assert.deepEqual(
      record.items
        .filter((item) => disposition(item) === state)
        .map((item) => item.id),
      entry.expected[state],
      `${entry.name}: ${state}`,
    );
  }
  const first = renderTask(record);
  assert.deepEqual(
    renderTask(record),
    first,
    `${entry.name}: deterministic render`,
  );
  assert.deepEqual(
    first.manifest.items.map((item) => item.id),
    record.items.map((item) => item.id),
  );
  assert.deepEqual(
    first.manifest.reference_ids,
    record.references.map((ref) => ref.id),
  );
  assert.deepEqual(
    first.manifest.unknown_ids,
    record.unknowns.map((gap) => gap.id),
  );
  assert.deepEqual(
    first.manifest.conflict_ids,
    record.conflicts.map((conflict) => conflict.id),
  );
  for (const omitted of first.manifest.items.filter(
    (item) => !item.instruction_text_emitted,
  ))
    assert.equal(omitted.disposition, "rejected");
  assert.equal(
    JSON.stringify(record),
    before,
    "Validation, inspection, and rendering must not mutate records.",
  );
  console.log(`PASS ${entry.name}`);
}
console.log(
  "12 public development fixtures passed. No model evaluation was performed.",
);
