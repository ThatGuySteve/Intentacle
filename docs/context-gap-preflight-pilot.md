# Context gap preflight — read-only experimental slice

## Purpose

Evaluate whether an inexpensive, conservative candidate-question checklist can surface useful issues **before** software work starts. This is **not** automatic context retrieval, intelligent uncertainty derivation, a new source of truth, or a claim that a system is complete. It must not expand a change request or block a task on its own.

The existing [V0 evaluation gates](evaluation.md) and [roadmap](../ROADMAP.md) remain in force. No public CLI contract, task schema, model provider, hosting, or paid API call changes in this slice.

## Run

From the repo root after `npm ci && npm run build`:

```sh
node experiments/context-preflight/cli.mjs examples/review.task.json
node experiments/context-preflight/cli.mjs examples/subscriptions.task.json
npm test
```

The CLI reads one **local, valid** Intentacle task record (1 MiB maximum). It calls `parseTask` before reporting anything, reads the already-supplied record, and emits JSON to stdout. It does not fetch locators, inspect repositories, contact models, or modify files or task decisions.

Each `candidate_check` is deliberately labeled `candidate_question_not_a_defect`. `request_mentions_topic` reflects lexical hints only, **not** verified coverage. Existing recorded unknowns are repeated separately, preserving `blocks` and `next_action`. No candidate check becomes an unknown or authorization to implement something.

## First development cases (known-history; NOT blind evidence)

1. **Reelweld** — *"Make the record player interactive."* Does the report suggest testing interaction states, input accessibility, and small-screen/interrupt cases without assuming which choices the owner wants?
2. **ProQuote** — *"Automatically invoice an approved job."* Does it surface authorization and reconciliation/idempotency questions without pretending to verify the payment architecture?
3. **Webmanship** — *"Add a website checker where visitors provide a URL."* Does it surface SSRF/redirect and evidence-scope questions without making a site-wide defect claim?

These are developer smoke cases selected with knowledge of prior outcomes. They are **not** scored as independent prediction successes.

## Next empirical step before integration

Freeze fresh tasks and rubrics before outcomes are inspected. Compare a raw request, the existing Intentacle handoff, and the same handoff plus this preflight, with **identical inspection permissions, model budgets, and answer-oracle access**. Keep the rubric invisible to the acting systems. Measure: material missing requirements surfaced, false-positive questions, unsupported assumptions, downstream defects, review time, and full cost. Retain misses and failures in the denominator. Stop or simplify this experiment if added friction exceeds benefit. Do not call this automatic discovery until it demonstrates novel relevant questions beyond a static checklist.

A genuinely adaptive version would need read-only, scoped evidence retrieval; evidence-backed uncertainty derivation; and authorization boundaries. Those are deliberately **not** implemented here. Only add them after comparative evidence warrants the complexity.
