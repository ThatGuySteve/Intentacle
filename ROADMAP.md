# Roadmap

The first question is whether explicit intent records improve real handoffs
enough to justify their cost in user effort. The schema and CLI exist to test
that claim.

## Foundation — retained

- Experimental record schema, provenance checks, and scoped review decisions.
- Offline CLI/library, deterministic Markdown export, and coverage manifest.
- Twelve original public development fixtures and inexpensive deterministic CI.
- Clear limits: literal initialization, manual records, no model outcome claims.

Complete when a fresh checkout can install, validate the examples, apply a
review decision without changing origin, and render a faithful handoff with all
recorded blockers visible.

## V0 implementation — current

The original record and review semantics are retained. V0 adds confidence and
unknown effects/choices, conservative offline parsing, an optional configurable
chat-completions extractor, bounded structured clarification, and generic/Codex
compilation. Invalid model output fails without hidden repairs. The adapter
boundary is two strings around the same complete provenance-preserving export.

The benchmark has eight public development cases, separate evaluator ledgers,
four-arm preparation, and an opt-in downstream runner. No real-model extraction,
Prompt Master comparison, human pilot, or outcome study has been completed.

## Next: calibration before expansion

1. Run semantic extraction on a chosen local model and inspect missing
   constraints, misleading explicit spans, confidence, and classification
   errors.
2. Pin Prompt Master and produce real baseline transcripts, using the same
   answer oracle. Record upstream tokens, time, decisions, failures, and cost
   for all arms.
3. Use the public development cases to debug the harness; they cannot satisfy
   the predeclared gates. Freeze new cases and rubrics before scored
   comparisons.
4. Test whether the record helps a real edit/target-transfer task. Retain fewer
   fields or stop if it adds friction without improving outcomes or handoffs.

See [the V0 decisions](docs/v0.md), [benchmark usage](benchmark/README.md), and
[evaluation protocol](docs/evaluation.md). No model server or package is
shipped.

## Public alpha, only if evidence supports it

- Improve onboarding and install/release instructions based on actual users.
- Add a small local interface if it reduces effort in the pilot.
- Add a task-specific export or adapter only when a real consumer needs it.
- Use Intentacle to capture its own next feature request and publish the
  resulting handoff as an example.

Accounts, cloud sync, orchestration, a prompt marketplace, a provider gateway,
MCP hosting, and broad agent contracts are outside the current scope.

Use
[evaluation protocol v1](docs/evaluation.md#predeclared-decision-gates-version-1)
to decide: on 40 paired cases, continue for at least four additional successes
over both simple baselines, or for comparable quality with 25% less handoff
effort in the human pilot. Safety and cost guards apply to either route. An
incomplete study is inconclusive, not a win. If the record fails but a worksheet
qualifies, simplify; if neither qualifies after two bounded redesigns, stop
standalone feature investment. More schema fields or adapters are not evidence
of value.
