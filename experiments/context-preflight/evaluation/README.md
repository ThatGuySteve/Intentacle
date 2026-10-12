# Context-preflight development evaluation (not an efficacy study)

This harness measures the _known_ lexical/checklist issues observed after PR
#12. It does **not** certify that automatic context discovery works. It
introduces no new product capability, network access, repository indexing, model
provider, production data reads, schema changes, or model spending.

## Local runs

After `npm ci && npm run build` in the repository root:

```sh
node experiments/context-preflight/evaluation/run.mjs
mkdir -p local
node experiments/context-preflight/evaluation/run.mjs --prepare > local/preflight-packets.json
```

`--prepare` exports the same twelve source requests and contextual notes to be
supplied to any comparison arm, but deliberately omits rubric annotations. Files
in `local/` are ignored by Git. The default command scores the merged PR #12
implementation with the frozen **public development** rubric; it prints all
cases, including false positives and omissions. Context notes are not read by
the v0 analyzer, consistent with its actual limitations.

To compare another approach, prepare a JSON file,
`local/context-candidate.json`, with this format. `case_sha256` must exactly
match the value in `--prepare`:

```json
{
  "case_sha256": "<sha256 from --prepare>",
  "submissions": [
    { "id": "record-player", "topics": ["interactive", "accessibility"] }
  ]
}
```

Then run:

```sh
node experiments/context-preflight/evaluation/run.mjs --candidate local/context-candidate.json
```

All twelve cases must be included to avoid a missing-submission penalty. The
comparison must not see the evaluator-only rubric, and must use exactly
identical source context, access, and time/token budgets as its baseline. The
allowed _topic labels_ are coarse proxies for investigation relevance, not
proven defects or missing requirements. A model predicting topics is **not** a
model successfully retrieving, inspecting, or validating evidence.

## Current development-only baseline

The twelve labeled scenarios produce the following counts for the current PR #12
rules (scored at topic level; broad universal checks are not scored):

- 5 relevant specialized topic flags.
- 4 irrelevant topic flags.
- 6 expected specialized topics not flagged.
- Precision 5/9; recall 5/11 on these hand-selected annotations.

Examples: invoice-copy, button-color and dashboard-restyling requests trigger
specialized checks inappropriately; API import, page navigation, same-page focus
behavior and a keyboard modal expose unrecognized areas.

**These are not independent model performance results.** The cases were selected
_after_ discovering failures and the labels reflect researcher judgment. Scores
may change with a different reasonable rubric; a model could simply memorize
these public examples. No candidate/context-aware comparator has yet run. No
downstream code quality, review time, or model cost was measured.

## Next credible test

Gather fresh tasks and freeze the information ledger and hidden rubric
**before** running. Compare (a) ordinary handoff, (b) current preflight, and (c)
context-aware review using the same available evidence and budget. Record
unsupported assertions, genuinely additional requirements, review burden,
latency, downstream task success, and total model/tool cost.

The standing Intentacle [evaluation protocol](../../../docs/evaluation.md) has
stricter 40-case and human-pilot continuation gates; this diagnostic does not
replace or satisfy them.

### Exit criterion

If contextual review produces only more speculative questions, cannot cite
relevant inspected sources, or adds unacceptable review cost, stop. If it finds
important requirements the checklist missed, consider a scoped read-only
retrieval experiment rather than expanding the live CLI.
