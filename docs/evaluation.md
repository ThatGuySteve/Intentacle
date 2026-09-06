# Evaluation protocol: proposal, not results

The twelve repository fixtures test deterministic record behavior. They do not
show that Intentacle improves a model's work. No model evaluation runner or paid
evaluation is included in this foundation.

## Comparisons

For the same software review/change scenario, compare:

1. Raw request followed by ordinary conversation and clarification.
2. Guided objective/context/constraints/success/output worksheet.
3. Intentacle's explicit record and reviewed assumptions, compiled to Markdown.

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

Fix the rubric and thresholds before collecting results. Start with a small
paired pilot, report every attempted case and failure, and avoid statistical
claims that the sample cannot support. Later split by task family or source
project rather than superficial paraphrases. Published development fixtures
cannot serve as a held-out test set.

The useful outcome might be a smaller guided builder. Continue only if
preserving the record or exposing assumptions produces enough observable benefit
to pay for the added interaction and implementation effort.
