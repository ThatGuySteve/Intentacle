#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createTask } from "../../../dist/index.js";
import { analyzeContextGaps } from "../analyze.mjs";

const files = {
  cases: new URL("./cases.json", import.meta.url),
  rubric: new URL("./development-rubric.json", import.meta.url),
};
const allowed = new Set([
  "interactive",
  "financial",
  "remote-url",
  "data-import",
  "navigation",
  "accessibility",
]);
const read = (uri) => {
  const value = readFileSync(uri);
  if (value.length > 1024 * 1024)
    throw new Error("Evaluation input exceeds 1 MiB.");
  return JSON.parse(value.toString("utf8"));
};
const sha256 = (uri) =>
  createHash("sha256").update(readFileSync(uri)).digest("hex");

export function scoreCases(cases, rubric, submissions) {
  const keys = cases.map((c) => c.id);
  if (new Set(keys).size !== keys.length || keys.length === 0)
    throw new Error("Case IDs must be distinct and nonempty.");
  const labels = new Map(rubric.labels.map((r) => [r.id, r]));
  if (labels.size !== keys.length || keys.some((id) => !labels.has(id)))
    throw new Error("Rubric and cases must have exactly matching IDs.");
  const byId = new Map();
  for (const s of submissions) {
    if (
      !keys.includes(s.id) ||
      byId.has(s.id) ||
      !Array.isArray(s.topics) ||
      s.topics.some((t) => !allowed.has(t)) ||
      new Set(s.topics).size !== s.topics.length
    )
      throw new Error("Invalid or duplicate candidate submission.");
    byId.set(s.id, s);
  }
  let truePositive = 0,
    falsePositive = 0,
    falseNegative = 0;
  const results = cases.map((c) => {
    const expected = labels.get(c.id).expected;
    if (!Array.isArray(expected) || expected.some((x) => !allowed.has(x)))
      throw new Error("Invalid rubric topics.");
    const received = byId.get(c.id)?.topics ?? [];
    const tp = received.filter((x) => expected.includes(x));
    const fp = received.filter((x) => !expected.includes(x));
    const fn = expected.filter((x) => !received.includes(x));
    truePositive += tp.length;
    falsePositive += fp.length;
    falseNegative += fn.length;
    return {
      id: c.id,
      expected,
      received,
      true_positive: tp,
      false_positive: fp,
      false_negative: fn,
      missing_submission: !byId.has(c.id),
    };
  });
  const precision =
    truePositive + falsePositive === 0
      ? null
      : truePositive / (truePositive + falsePositive);
  const recall =
    truePositive + falseNegative === 0
      ? null
      : truePositive / (truePositive + falseNegative);
  return {
    totals: {
      cases: cases.length,
      submitted: byId.size,
      missing: cases.length - byId.size,
      true_positive: truePositive,
      false_positive: falsePositive,
      false_negative: falseNegative,
      precision,
      recall,
    },
    cases: results,
  };
}

export function baseline(cases) {
  const checkToTopic = {
    "interaction-states": "interactive",
    "interaction-accessibility": "accessibility",
    "payment-authorization": "financial",
    "external-fetch-security": "remote-url",
  };
  return cases.map(({ id, request }) => {
    const record = createTask(request, `eval-${id}`);
    const result = analyzeContextGaps(record);
    // Evaluate actual emitted checks, not only broad lexical-trigger labels.
    // Some checks (e.g. accessibility) belong to a more specific rubric topic.
    const topics = [
      ...new Set(
        result.candidate_checks.map((c) => checkToTopic[c.id]).filter(Boolean),
      ),
    ];
    return { id, topics };
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (
    args.length > 2 ||
    (args.length && args[0] !== "--prepare" && args[0] !== "--candidate") ||
    (args[0] === "--candidate" && args.length !== 2) ||
    (args[0] === "--prepare" && args.length !== 1)
  )
    throw new Error(
      "Usage: node evaluation/run.mjs [--prepare | --candidate path/to/submissions.json]",
    );
  const input = read(files.cases);
  const cases = input.cases;
  const provenance = {
    case_version: input.version,
    case_sha256: sha256(files.cases),
  };
  if (args[0] === "--prepare") {
    // Output for the acting model, without evaluator-only labels.
    process.stdout.write(JSON.stringify({ provenance, cases }, null, 2) + "\n");
    return;
  }
  const rubric = read(files.rubric);
  const v0 = scoreCases(cases, rubric, baseline(cases));
  const result = {
    classification: "development_diagnostics_not_blind_evaluation",
    provenance: { ...provenance, rubric_sha256: sha256(files.rubric) },
    baseline: v0,
    comparison: null,
  };
  if (args[0] === "--candidate") {
    const incoming = read(resolve(args[1]));
    if (
      incoming.case_sha256 !== provenance.case_sha256 ||
      !Array.isArray(incoming.submissions)
    )
      throw new Error(
        "Candidate results must match the exact case SHA and provide submissions.",
      );
    result.comparison = scoreCases(cases, rubric, incoming.submissions);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    process.stderr.write(`Context evaluation: ${error.message}\n`);
    process.exitCode = 2;
  });
}
