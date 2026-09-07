# Evaluation protocol: proposal, not results

The twelve repository fixtures test deterministic record behavior. They do not
show that Intentacle improves a model's work. No model evaluation runner or paid
evaluation is included in this foundation.

## Comparisons

For the same software review/change scenario, compare:

1. Raw request followed by ordinary conversation and clarification.
2. Guided objective/context/constraints/success/output worksheet.
3. Intentacle's explicit record and reviewed assumptions, compiled to Markdown.

An existing-tool arm is also required before claiming a standalone advantage:
start with ClarifyPrompt for prompt handoffs or Spec Kit for software-spec work,
as scoped in [the landscape review](landscape.md). Freeze the selected tool,
version, allowed customization, and task mapping before running that comparison.
If access or task incompatibility prevents a fair run, record it as unevaluated;
do not award Intentacle a win by omission.

Use the same downstream model, supplied context, tool access, and task budget.
Count extraction, repair, clarification, and downstream calls in the total cost.
Keep interaction and output-generation settings with each result. Do not improve
one arm by secretly supplying answers unavailable to the other arms.

## Information ledger

Each future evaluation case needs separate materials:

| Material                                | Who can see it                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Raw request and supplied context        | Every arm                                                                           |
| Inspectable evidence                    | Every arm with the same inspection permissions                                      |
| User-answer ledger                      | Clarification oracle, responding only to requested decisions                        |
| Genuinely undecided preferences         | Oracle responds that the choice is undecided; permitted delegation remains explicit |
| Scoring rubric and allowed alternatives | Evaluator only until the evaluation is frozen                                       |

A hidden answer is not evidence the system can legitimately guess. Distinguish
answerable preferences, inspectable facts, and unresolved choices in the
scoring. Use original scenarios or clearly licensed material and exclude private
project information and credentials.

## Outcomes

Score task completion against the rubric, requirement coverage, unsupported
assumptions, violated hard constraints, and unresolved questions honestly
retained. Also record decision items requested, user time/effort, model tokens,
latency, total cost, and blind user preference where feasible. A single “prompt
quality” score does not establish benefit.

## Predeclared decision gates, version 1

Declared 2026-09-06 before extraction or outcome results exist. These numbers
are maintainer product choices, not research-derived effect sizes or a
statistical power calculation. They govern whether to spend another bounded
development cycle; passing them does not justify a population-level performance
claim.

First use 12 fresh calibration cases to debug the harness and rubric. They are
development data once inspected and never count toward the decision set. Then
freeze **40 new paired cases**, eight per family: review scope, bounded changes,
conflicting constraints, missing evidence, and correction/handoff. Split by
source project or task family, not paraphrases of repository fixtures. Evaluate
conversation (C), worksheet (W), and record (R) on the same cases with an
identical answer oracle. Freeze a case-specific edit/handoff turn as well as the
initial request, and score the complete interaction. All attempts, invalid
outputs, repairs, and failures stay in the denominator. No stopping early after
favorable results and no replacement of difficult cases after results are
visible.

Before each run, record dataset/rubric hashes, protocol version/commit, model
and configuration, tool access, question/time/token limits, seeds where
supported, and total compute/spend cap. Runs are explicitly invoked. If the cap
prevents all 40 cases, report insufficient evidence; do not weaken the minimum
or silently spend more. This document authorizes no hosted API spending.

Use these definitions:

- **Task success:** binary, all essential rubric conditions for the requested
  next step are met with no hard-constraint violation. Correctly retaining an
  unresolvable blocker can be success when the rubric calls for it; unnecessary
  blocking is failure. Safe abstention cannot be used to pass every case.
- **Unsupported commitment:** a factual or user-preference claim treated as
  established without support in the information/answer ledger. Report both item
  counts and the fraction of cases with at least one. Explicitly labeled,
  appropriately scoped proposals are not unsupported commitments.
- **Severe violation:** fabricated confirmation/authorization, source
  instructions promoted into user authority, or a consequential hard-boundary
  violation such as an unrequested destructive action. Fix category/severity
  examples in the rubric before scoring. Human adjudication should be blind to
  the arm where feasible.
- **Total inference cost:** every extraction, repair, clarification, and
  downstream call, priced using the same recorded schedule. Equal zero-spend
  local runs pass the monetary guard; that does not make their compute time
  free.
- **Active effort:** human time forming the handoff, reviewing additions,
  answering questions, correcting errors, and completing the prescribed
  edit/transfer. Exclude model wait from this measure and report it separately
  as latency.

| Decision                                            | Baseline and minimum sample                                                                                                        | Numerical gate                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Continue R on task quality                          | R versus **both C and W**, 40 paired cases each                                                                                    | At least **4 additional successes / 40** against each; no additional severe-violation case where that baseline was safe; unsupported-commitment case count no higher than either baseline; total inference cost at most **1.5×** each baseline            |
| Continue R on record utility if quality gate misses | Same 40 cases, plus the human pilot below                                                                                          | At most **2 fewer successes / 40** than each baseline, the same severe-violation/unsupported-commitment/cost guards, **25% lower median active effort** than both in the human handoff tasks, and repeated record use by at least **5 of 8** participants |
| Retain guided clarification UX                      | Human pilot, all arms                                                                                                              | R's median active clarification time at most **45 seconds**, median no more than **2 decision items**, and no decline beyond the quality guard above. Do not conceal unresolved questions to meet the target                                              |
| Establish advantage over an existing tool E         | R versus a preselected E, **40 new paired cases**; same human protocol if claiming effort benefit                                  | Apply the same **+4/40 quality** or **−2/40 plus 25% effort** gate and the same safety/cost guards. An unevaluated E leaves this claim open                                                                                                               |
| Prefer the smaller worksheet                        | W versus C, 40 paired cases, after R fails both continuation routes                                                                | W meets the **+4/40** quality route or the **−2/40 plus 25% effort** route against C, with the same safety/cost guards; ship the worksheet rather than expand the record                                                                                  |
| Pause                                               | Any required cohort is incomplete, scoring is unreliable, or repeated runs disagree on whether a gate passes                       | Mark inconclusive; no positive result claim and no automatic expansion                                                                                                                                                                                    |
| Stop standalone investment                          | Neither R nor W qualifies after at most **2 bounded redesigns** beyond the first scored version, each assessed on a new frozen set | Stop feature expansion; archive the experiment or maintain a small personal utility/template                                                                                                                                                              |

The human pilot is **8 consenting participants × 6 sessions = 48 sessions**, two
per arm. Use 16 task scenarios, each tested once per arm by different
participants; balance task difficulty and arm order so nobody repeats the same
scenario. Every session includes the prescribed edit/handoff. Compare median
active effort per arm and publish the task/participant breakdown, not just
pooled medians. “Repeated use” means a participant reopens and meaningfully
edits the canonical record in both R sessions instead of editing only exported
prose. Until this pilot exists, the record-utility route remains untested. The
maintainer's own use alone does not satisfy it. Human comparison to E requires a
separately frozen balanced pilot; do not quietly relabel an existing C/W session
as that arm.

Report raw paired outcomes and uncertainty with every result. These
finite-sample gates do not establish significance or equivalence. Repeat on an
independent cohort before broad quality claims, and on a stronger/newer model
before claiming the advantage survives model improvement. A repeated severe
boundary failure blocks release until corrected regardless of the average score.

Any threshold or rubric change gets a new protocol version, written rationale,
and a new untouched evaluation set. Earlier results remain published under their
original rules. A redesign is limited to one stated hypothesis and one
predeclared time/spend budget; repeatedly changing thresholds is not a redesign.
This keeps “simplify,” “pause,” and “stop” distinct and prevents favorable
reinterpretation after the outcome is known.
