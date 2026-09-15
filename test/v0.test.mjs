import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import {
  extractOffline,
  extractTask,
  acceptExtraction,
  createTask,
  validateTask,
  compileTask,
  planClarification,
  answerUnknowns,
  inspectTask,
  createChatProvider,
  prepareBenchmarkCase,
  classifyNecessity,
  decideTask,
} from "../dist/index.js";
const cli = (...args) =>
  spawnSync(process.execPath, ["dist/cli.js", ...args], { encoding: "utf8" });

function semanticCandidate(scaffold) {
  const record = structuredClone(scaffold);
  record.items.push({
    id: "intent",
    kind: "objective",
    text: "Implement subscription billing",
    origin: "inferred",
    source_ids: ["request-1"],
    rationale: "Interpretation of add subscriptions.",
    confidence: 0.7,
    review: { state: "unreviewed" },
  });
  return record;
}

test("offline subscriptions preserves uncertainty and never commits a hidden billing policy", () => {
  const record = extractOffline("Add subscriptions.", "demo");
  assert.equal(validateTask(record).valid, true);
  assert.equal(record.references[0].content, "Add subscriptions.");
  assert.equal(record.items[0].origin, "user_stated");
  assert.equal(record.items[1].origin, "default");
  assert.equal(record.items[1].review.state, "unreviewed");
  assert.ok(
    record.unknowns.some(
      (u) => u.id === "subscription-policy" && u.status === "open",
    ),
  );
  assert.doesNotMatch(
    JSON.stringify(record.items),
    /stripe|monthly|annual|price/i,
  );
  assert.equal(inspectTask(record, "execute").blocked, true);
  const negated = extractOffline(
    "Do not add subscriptions. Just explain the change.",
    "negative",
  );
  assert.ok(!negated.unknowns.some((u) => u.id === "subscription-policy"));
});

test("schema bounds confidence and keeps required unknowns distinct from optional questions", () => {
  const record = extractOffline("Add subscriptions.", "demo");
  for (const confidence of [-0.01, 1.01, "0.7", null]) {
    const bad = structuredClone(record);
    bad.items[1].confidence = confidence;
    assert.equal(validateTask(bad).valid, false);
  }
  assert.equal(
    classifyNecessity({ relevant: false, blocks: true, material: true }),
    "irrelevant",
  );
  assert.equal(
    classifyNecessity({ relevant: true, blocks: true, material: true }),
    "required",
  );
  assert.equal(
    classifyNecessity({ relevant: true, blocks: false, material: true }),
    "important",
  );
  assert.equal(
    classifyNecessity({ relevant: true, blocks: false, material: false }),
    "optional",
  );
});

test("extractor rejects invented authority, sources, resolutions, and paraphrased explicit claims", async () => {
  const scaffold = createTask("Add subscriptions.", "semantic");
  const good = semanticCandidate(scaffold);
  assert.equal(acceptExtraction(scaffold, good).items[1].confidence, 0.7);
  const reordered = structuredClone(good);
  reordered.references = reordered.references.map((ref) =>
    Object.fromEntries(Object.entries(ref).reverse()),
  );
  assert.equal(
    acceptExtraction(scaffold, reordered).items[1].origin,
    "inferred",
    "JSON object key order is not source provenance",
  );
  const mutations = [
    (r) => {
      r.references[0].content = "Add subscriptions with Stripe.";
    },
    (r) => {
      r.items[1].origin = "user_stated";
    },
    (r) => {
      delete r.items[1].confidence;
    },
    (r) => {
      r.revision = 2;
    },
    (r) => {
      r.items[1].review = { state: "confirmed", source_id: "answer" };
      r.references.push({
        id: "answer",
        kind: "user_answer",
        availability: "supplied",
        content: "yes",
        applies_to: ["intent"],
      });
    },
  ];
  for (const mutate of mutations) {
    const bad = structuredClone(good);
    mutate(bad);
    assert.throws(() => acceptExtraction(scaffold, bad));
  }
  let calls = 0;
  await assert.rejects(
    extractTask(
      "Add subscriptions.",
      async () => {
        calls++;
        return "invalid JSON";
      },
      "semantic",
    ),
  );
  assert.equal(calls, 1, "no hidden repair calls or silent success fallback");
  const result = await extractTask(
    "Add subscriptions.",
    async (messages) => {
      assert.match(messages[0].content, /confidence/);
      assert.equal(
        JSON.parse(messages[1].content).references[0].content,
        "Add subscriptions.",
      );
      return JSON.stringify(good);
    },
    "semantic",
  );
  assert.equal(result.items[1].origin, "inferred");
});

test("clarification batches consequential questions without losing deferred or inspectable gaps", () => {
  const record = extractOffline("Add subscriptions.", "demo");
  record.unknowns.push(
    ...Array.from({ length: 5 }, (_, n) => ({
      id: `extra-${n}`,
      question: "A material decision?",
      effect: "Changes the result.",
      necessity: "important",
      blocks: [],
      next_action: "ask_user",
      status: "open",
    })),
  );
  record.unknowns.push(
    {
      id: "inspect-me",
      question: "Existing SDK?",
      necessity: "required",
      blocks: ["execute"],
      next_action: "inspect_source",
      status: "open",
    },
    {
      id: "optional",
      question: "Favorite formatting?",
      necessity: "optional",
      blocks: [],
      next_action: "ask_user",
      status: "open",
    },
  );
  const plan = planClarification(record, "execute");
  assert.equal(plan.questions.length, 3);
  assert.equal(plan.questions[0].necessity, "required");
  assert.ok(plan.remaining_question_ids.length > 0);
  assert.equal(plan.inspect_first[0].id, "inspect-me");
  assert.ok(!plan.questions.some((q) => q.id === "optional"));
  const deferred = answerUnknowns(record, [
    {
      id: "subscription-policy",
      action: "defer",
      text: "Use best judgment; I do not know yet.",
    },
  ]);
  assert.equal(deferred.unknowns[1].status, "open");
  assert.equal(inspectTask(deferred, "execute").blocked, true);
  const resolved = answerUnknowns(record, [
    {
      id: "project-evidence",
      action: "answer",
      text: "Inspect my local ./demo repository.",
    },
  ]);
  assert.equal(resolved.unknowns[0].status, "resolved");
  assert.equal(resolved.unknowns[1].status, "open");
  assert.equal(record.unknowns[0].status, "open", "input remains immutable");
  assert.deepEqual(resolved.references.at(-1).applies_to, ["project-evidence"]);
  assert.throws(() =>
    answerUnknowns(record, [
      { id: "project-evidence", action: "answer", text: "" },
    ]),
  );
  assert.throws(() =>
    answerUnknowns(record, [
      { id: "nonexistent", action: "answer", text: "yes" },
    ]),
  );
});

test("recompilation preserves contract, confidence, blockers, and provenance after review", () => {
  const original = extractOffline("Add subscriptions.", "demo");
  const reviewed = decideTask(
    original,
    "output-proposal",
    "confirmed",
    "Yes, use that output.",
  );
  const before = JSON.stringify(reviewed);
  const generic = compileTask(reviewed);
  const codex = compileTask(reviewed, "codex");
  assert.equal(
    generic.manifest.contract_sha256,
    codex.manifest.contract_sha256,
  );
  assert.equal(JSON.stringify(reviewed), before);
  assert.notEqual(generic.instruction, codex.instruction);
  for (const result of [generic, codex]) {
    assert.match(result.instruction, /Origin: default/);
    assert.match(result.instruction, /Confidence \(uncalibrated\): 0.5/);
    assert.match(result.instruction, /subscription-policy — required, open/);
    assert.equal(result.manifest.readiness.blocked, true);
  }
  assert.throws(() => compileTask(reviewed, "unknown-target"));
});

test("CLI parse, inspect, clarify, validate, and two compilers form a local round trip", () => {
  const folder = mkdtempSync(join(tmpdir(), "intentacle-v0-"));
  try {
    const task = join(folder, "task.json"),
      next = join(folder, "next.json"),
      answers = join(folder, "answers.json");
    assert.equal(
      cli("parse", "Add subscriptions.", "--id", "demo", "--out", task).status,
      0,
    );
    assert.equal(cli("validate", task).status, 0);
    assert.equal(JSON.parse(cli("inspect", task).stdout).blocked, true);
    assert.ok(
      JSON.parse(cli("clarify", task, "--step", "execute").stdout).questions
        .length <= 3,
    );
    assert.equal(
      cli(
        "compile",
        task,
        "--require-ready",
        "--out",
        join(folder, "blocked.md"),
      ).status,
      3,
    );
    writeFileSync(
      answers,
      JSON.stringify([
        { id: "project-evidence", action: "answer", text: "Use ./demo" },
      ]),
    );
    assert.equal(
      cli("clarify", task, "--answers", answers, "--out", next).status,
      0,
    );
    const a = JSON.parse(
      cli("compile", next, "--target", "generic", "--json").stdout,
    );
    const b = JSON.parse(
      cli("compile", next, "--target", "codex", "--json").stdout,
    );
    assert.equal(a.manifest.contract_sha256, b.manifest.contract_sha256);
    assert.equal(cli("parse", "Add subscriptions.", "--out", task).status, 2);
    assert.equal(cli("parse", "request", "--model", "test").status, 2);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("chat transport works against a loopback server and rejects errors, truncation, redirects, and timeouts", async () => {
  let mode = "ok",
    received;
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    received = JSON.parse(body);
    if (mode === "error") {
      res.writeHead(401);
      res.end("secret should never be echoed");
      return;
    }
    if (mode === "redirect") {
      res.writeHead(302, { Location: "/elsewhere" });
      res.end();
      return;
    }
    if (mode === "timeout") return;
    if (mode === "oversize") {
      res.end("x".repeat(1024 * 1024 + 1));
      return;
    }
    const scaffold = JSON.parse(received.messages.at(-1).content);
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        model: "fake-local",
        choices: [
          {
            finish_reason: mode === "truncated" ? "length" : "stop",
            message: { content: JSON.stringify(semanticCandidate(scaffold)) },
          },
        ],
        usage: { prompt_tokens: 12, completion_tokens: 40 },
      }),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const endpoint = `http://127.0.0.1:${server.address().port}/v1/chat/completions`;
  try {
    const provider = createChatProvider({
      endpoint,
      model: "test",
      timeoutMs: 2000,
    });
    const result = await extractTask(
      "Add subscriptions.",
      provider.extract,
      "semantic",
    );
    assert.equal(result.items[1].origin, "inferred");
    assert.equal(received.temperature, 0);
    for (mode of ["error", "redirect", "truncated", "oversize"]) {
      await assert.rejects(
        extractTask("Add subscriptions.", provider.extract, "semantic"),
        (error) => !error.message.includes("secret should"),
      );
    }
    mode = "timeout";
    await assert.rejects(
      extractTask(
        "Add subscriptions.",
        createChatProvider({ endpoint, model: "test", timeoutMs: 30 }).extract,
      ),
    );
    assert.throws(() =>
      createChatProvider({
        endpoint: "http://example.org/chat",
        model: "test",
      }),
    );
    assert.throws(() =>
      createChatProvider({
        endpoint: "https://example.org/chat?key=secret",
        model: "test",
      }),
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("benchmark keeps actual missing arms and evaluator answers out of model packets", () => {
  const scenario = JSON.parse(
    readFileSync("benchmark/corpus/public/subscriptions.json", "utf8"),
  );
  const quick = extractOffline(scenario.request, scenario.id);
  const packets = prepareBenchmarkCase(scenario);
  assert.equal(packets.length, 4);
  assert.deepEqual(
    packets.filter((p) => p.status === "missing").map((p) => p.arm),
    ["prompt-master", "intentacle-guided"],
  );
  assert.doesNotMatch(
    JSON.stringify(packets),
    /Stripe|Notify and provide a grace period/,
  );
  assert.throws(() => prepareBenchmarkCase(scenario, { guided: quick }));
  assert.throws(() =>
    prepareBenchmarkCase(scenario, {
      baseline: {
        instruction: "fake",
        transcript: "fake",
        tool_commit: "main",
      },
    }),
  );
  const guided = answerUnknowns(quick, [
    { id: "project-evidence", action: "answer", text: "Inspect ./demo" },
  ]);
  const ready = prepareBenchmarkCase(scenario, {
    quick,
    guided,
    baseline: {
      instruction: "Actual imported output",
      transcript: "Recorded interaction",
      tool_commit: "a".repeat(40),
    },
  });
  assert.ok(ready.every((p) => p.status === "ready"));
});

test("benchmark preparation and downstream runner retain failures and missing arms under identical settings", async () => {
  const folder = mkdtempSync(join(tmpdir(), "intentacle-bench-"));
  const calls = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    calls.push(JSON.parse(body));
    if (calls.length === 1) {
      res.writeHead(503);
      res.end("failure");
      return;
    }
    res.end(
      JSON.stringify({
        model: "mock-only",
        choices: [
          {
            finish_reason: "stop",
            message: { content: "Mock output, not a model result." },
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 2 },
      }),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const run = (args) =>
    new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ["scripts/benchmark.mjs", ...args]);
      let stderr = "";
      child.stderr.on("data", (c) => {
        stderr += c;
      });
      child.stdout.resume();
      child.on("error", reject);
      child.on("close", (code) => resolve({ code, stderr }));
    });
  try {
    const packets = join(folder, "packets"),
      results = join(folder, "results");
    assert.equal(
      (await run(["prepare", "benchmark/corpus/public", "--out", packets]))
        .code,
      0,
    );
    const prepared = JSON.parse(
      readFileSync(join(packets, "packets.json"), "utf8"),
    );
    assert.equal(prepared.length, 32);
    const endpoint = `http://127.0.0.1:${server.address().port}/v1/chat/completions`;
    const result = await run([
      "run",
      packets,
      "--out",
      results,
      "--endpoint",
      endpoint,
      "--model",
      "mock-only",
    ]);
    assert.equal(result.code, 0, result.stderr);
    const attempts = Array.from({ length: 32 }, (_, i) =>
      JSON.parse(
        readFileSync(
          join(results, `${String(i).padStart(3, "0")}.json`),
          "utf8",
        ),
      ),
    );
    assert.equal(attempts.filter((a) => a.status === "failed").length, 1);
    assert.equal(attempts.filter((a) => a.status === "missing").length, 16);
    assert.equal(attempts.filter((a) => a.status === "completed").length, 15);
    assert.ok(
      attempts.every((a) => a.task_success === null && a.cost === null),
    );
    assert.equal(calls.length, 16);
    assert.ok(
      calls.every(
        (c) =>
          c.model === "mock-only" &&
          c.temperature === 0 &&
          c.max_tokens === 4096,
      ),
    );
    assert.doesNotMatch(
      JSON.stringify(calls),
      /Server sessions stored in Redis|Notify and provide a grace period/,
    );
    const manifest = JSON.parse(
      readFileSync(join(packets, "manifest.json"), "utf8"),
    );
    manifest.packet_sha256 = "bad";
    writeFileSync(join(packets, "manifest.json"), JSON.stringify(manifest));
    assert.equal(
      (
        await run([
          "run",
          packets,
          "--out",
          join(folder, "tampered"),
          "--endpoint",
          endpoint,
          "--model",
          "mock-only",
        ])
      ).code,
      2,
    );
    assert.equal(calls.length, 16, "tampered packets never reach the endpoint");
    assert.equal(
      (
        await run([
          "prepare",
          "benchmark/corpus/evaluator",
          "--out",
          join(folder, "leak"),
        ])
      ).code,
      2,
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    rmSync(folder, { recursive: true, force: true });
  }
});
