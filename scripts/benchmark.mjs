import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { execFileSync } from "node:child_process";
import {
  prepareBenchmarkCase,
  hashArtifact,
  BENCHMARK_PROTOCOL,
  createChatProvider,
} from "../dist/index.js";

const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const optional = async (path) => {
  try {
    return await read(path);
  } catch (e) {
    if (e.code === "ENOENT") return undefined;
    throw e;
  }
};
const save = (path, data) =>
  writeFile(path, JSON.stringify(data, null, 2) + "\n", { flag: "wx" });
async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: "string" },
      artifacts: { type: "string" },
      endpoint: { type: "string" },
      model: { type: "string" },
    },
  });
  const [command, input] = positionals;
  if (
    positionals.length !== 2 ||
    !values.out ||
    !["prepare", "run"].includes(command)
  )
    throw new Error(
      "Usage: node scripts/benchmark.mjs prepare benchmark/corpus/public --out local/packets [--artifacts local/arms] OR run local/packets --out local/run --endpoint URL --model NAME",
    );
  if (command === "prepare" && (values.endpoint || values.model))
    throw new Error("prepare never calls a model.");
  if (command === "run" && values.artifacts)
    throw new Error("--artifacts is only supported by prepare.");
  const output = resolve(values.out);
  await mkdir(output); // New directory only; never mix or overwrite runs.
  if (command === "prepare") {
    const packets = [];
    for (const name of (await readdir(input))
      .filter((n) => n.endsWith(".json"))
      .sort()) {
      const scenario = await read(join(input, name));
      if (Object.keys(scenario).sort().join(",") !== "id,request")
        throw new Error("Only public id/request files may enter preparation.");
      const options = values.artifacts
        ? {
            quick: await optional(join(values.artifacts, "quick", name)),
            guided: await optional(join(values.artifacts, "guided", name)),
            baseline: await optional(
              join(values.artifacts, "prompt-master", name),
            ),
          }
        : {};
      packets.push(...prepareBenchmarkCase(scenario, options));
    }
    if (!packets.length) throw new Error("No public cases found.");
    await save(join(output, "packets.json"), packets);
    await save(join(output, "manifest.json"), {
      protocol: BENCHMARK_PROTOCOL,
      stage: "development",
      packet_sha256: hashArtifact(packets),
      source_commit: execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
      working_tree_dirty: Boolean(
        execFileSync("git", ["status", "--porcelain"], {
          encoding: "utf8",
        }).trim(),
      ),
      counts: {
        ready: packets.filter((p) => p.status === "ready").length,
        missing: packets.filter((p) => p.status === "missing").length,
      },
      model_results: "not run",
      decision_gate: "inconclusive",
    });
    console.log(
      `Prepared ${packets.length} arm packets; absent arms stay missing. No model calls.`,
    );
    return;
  }
  if (!values.endpoint || !values.model)
    throw new Error(
      "run requires an explicit --endpoint and --model; this may incur provider costs.",
    );
  const packets = await read(join(input, "packets.json"));
  const manifest = await read(join(input, "manifest.json"));
  if (
    !Array.isArray(packets) ||
    !packets.length ||
    packets.length > 160 ||
    hashArtifact(packets) !== manifest.packet_sha256
  )
    throw new Error(
      "Packet hash mismatch or invalid run size (1..160 packets).",
    );
  const config = {
    endpoint: values.endpoint,
    model: values.model,
    maxTokens: 4096,
    timeoutMs: 60000,
    ...(process.env.INTENTACLE_API_KEY
      ? { apiKey: process.env.INTENTACLE_API_KEY }
      : {}),
  };
  const provider = createChatProvider(config);
  await save(join(output, "manifest.json"), {
    protocol: BENCHMARK_PROTOCOL,
    packet_sha256: manifest.packet_sha256,
    model: config.model,
    temperature: 0,
    max_tokens: config.maxTokens,
    timeout_ms: config.timeoutMs,
    endpoint_origin: new URL(config.endpoint).origin,
    model_calls_max: packets.filter((p) => p.status === "ready").length,
    upstream_metrics:
      "not collected; import extraction and clarification costs before any comparison",
    decision_gate: "inconclusive",
  });
  let i = 0;
  for (const packet of packets) {
    let result = {
      case_id: packet.case_id,
      arm: packet.arm,
      status: "missing",
      output: null,
      usage: null,
      latency_ms: null,
      task_success: null,
      unsupported_commitments: null,
      cost: null,
      error: packet.reason,
    };
    if (packet.status === "ready") {
      const started = performance.now();
      try {
        const completion = await provider.complete([
          { role: "user", content: packet.instruction },
        ]);
        result = {
          ...result,
          status: "completed",
          output: completion.text,
          usage: completion.usage,
          latency_ms: completion.latency_ms,
          returned_model: completion.model,
          error: null,
        };
      } catch {
        result = {
          ...result,
          status: "failed",
          latency_ms: Math.round(performance.now() - started),
          error:
            "Model call failed; attempt retained. Inspect endpoint locally.",
        };
      }
    }
    await save(join(output, `${String(i++).padStart(3, "0")}.json`), result);
    console.log(`${packet.case_id} / ${packet.arm}: ${result.status}`);
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 2;
});
