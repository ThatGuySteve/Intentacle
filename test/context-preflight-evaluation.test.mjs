import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { scoreCases } from "../experiments/context-preflight/evaluation/run.mjs";

const base = new URL("../experiments/context-preflight/evaluation/", import.meta.url);
const cases = JSON.parse(readFileSync(new URL("cases.json", base))).cases;
const rubric = JSON.parse(readFileSync(new URL("development-rubric.json", base)));

test("development corpus has complete, unique IDs and evaluator labels", () => {
  assert.equal(cases.length, 12);
  const results = scoreCases(cases, rubric, []);
  assert.equal(results.totals.missing, 12);
  assert.ok(results.totals.false_negative > 0);
});

test("missing submissions are counted as misses, never silently excluded", () => {
  const result = scoreCases(cases, rubric, [{ id: "record-player", topics: ["interactive"] }]);
  assert.equal(result.totals.submitted, 1);
  assert.equal(result.totals.missing, 11);
  assert.ok(result.cases.find((x) => x.id === "auto-invoice").missing_submission);
});

test("duplicate cases, duplicate submissions and invented topics fail closed", () => {
  assert.throws(() => scoreCases([cases[0], cases[0]], rubric, []), /distinct/);
  assert.throws(() => scoreCases(cases, rubric, [{ id: "fake", topics: [] }]), /Invalid/);
  assert.throws(() => scoreCases(cases, rubric, [
    { id: "record-player", topics: [] }, { id: "record-player", topics: [] },
  ]), /Invalid/);
  assert.throws(() => scoreCases(cases, rubric, [
    { id: "record-player", topics: ["financial", "financial"] },
  ]), /Invalid/);
  assert.throws(() => scoreCases(cases, rubric, [
    { id: "record-player", topics: ["safe-to-merge"] },
  ]), /Invalid/);
});

test("false positives and false negatives remain visible", () => {
  const result = scoreCases(cases, rubric, [
    { id: "invoice-copy", topics: ["financial"] },
    { id: "external-import", topics: [] },
  ]);
  assert.deepEqual(result.cases.find((x) => x.id === "invoice-copy").false_positive, ["financial"]);
  assert.deepEqual(result.cases.find((x) => x.id === "external-import").false_negative, ["data-import"]);
});
