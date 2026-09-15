# V0 development benchmark

Eight deliberately underspecified public cases cover subscriptions, review,
auth, a landing page, conflicting constraints, missing evidence, negation, and
CSV export. They are calibration/development data, not held-out evidence. No
outcomes have been scored and no benchmark win is claimed.

`corpus/public/` contains only `id` and `request`. `corpus/evaluator/` contains
user-answer ledgers, ambiguities, unsupported assumptions to avoid, expected
intent elements, and empty scoring fields. The runner never reads that
directory. A human oracle should disclose answers only when an arm asks the
corresponding question; all arms get equal access. Guessing a hidden answer is
not justified requirement coverage. Publicly visible ledgers cannot serve as
untouched test data.

## Prepare without model calls

From the repository root, after `npm run build`:

```sh
mkdir local
node scripts/benchmark.mjs prepare benchmark/corpus/public --out local/packets
```

Every case has four slots: raw control, Prompt Master, Intentacle Quick, and
Intentacle Guided. By default only raw and conservative offline Quick are ready.
Missing baseline/Guided slots remain missing. This is a plumbing smoke run, not
a fair comparison of semantic approaches.

To supply actual artifacts, create these directories under `local/arms/`:

| Directory        | File shape (use public case filename)                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `quick/`         | Valid task JSON from actual semantic extraction                                               |
| `guided/`        | A later revision of that task, with scoped actual user answers                                |
| `prompt-master/` | JSON with `instruction`, full interaction `transcript`, and pinned 40-character `tool_commit` |

```sh
node scripts/benchmark.mjs prepare benchmark/corpus/public --artifacts local/arms --out local/complete-packets
```

The import boundary checks raw-request preservation and basic
revision/interaction requirements. It does not authenticate transcripts or prove
fairness. Manually verify that Guided descends from the corresponding Quick
record and only uses answers obtained through the shared oracle. Keep all
extraction failures, repairs, clarification decisions, latency, tokens, and
spend in an upstream ledger.

## Explicitly run a downstream endpoint

This command calls the endpoint once for each ready arm and may incur provider
costs. It uses one model, temperature 0, max_tokens 4096, and a 60-second
timeout per attempt. At most 160 packets are accepted; there are no automatic
retries. Choose a local model for a no-API-spend plumbing run.

```sh
node scripts/benchmark.mjs run local/complete-packets --out local/run-001 --endpoint http://127.0.0.1:1234/v1/chat/completions --model YOUR_LOCAL_MODEL
```

Optional key: `INTENTACLE_API_KEY`. Output directories must be new. The runner
checks the prepared packet hash, writes run settings before calls, and saves
each attempt separately. Failures and missing arms stay in the result set.
Interrupted runs are partial; missing attempt files are not successes. Review
returned model identities: a gateway silently changing models invalidates a
controlled comparison. Run files may contain private prompts; keep them in
`local/`.

Usage tokens (when supplied), latency, raw outputs, and failures are recorded.
Task success, unsupported commitments, and cost remain `null` until adjudicated
and priced. The runner does not execute generated code or score prompt
aesthetics. It does not implement an automatic clarification oracle, upstream
inference-cost collection, blind judging, counterbalanced ordering, or an
end-to-end agent execution sandbox. It therefore cannot yet produce a
decision-grade aggregate.

Before claiming a result, add a frozen protocol with identical downstream tools,
settings and budgets, all upstream costs, randomized/counterbalanced arm order,
blind manual scoring, complete attempt denominators, and actual downstream task
verification. The original [evaluation gates](../docs/evaluation.md) remain
unchanged. The added four-arm development harness is not a relabeling of the
original C/W/R study and cannot satisfy its 40-case or human-pilot requirements.
