# Does the record remain useful as models improve?

Assessment dated 2026-09-06: **usefulness is plausible; defensibility is weak
and unproven.** No model comparison, external adoption study, or revenue
evidence has been collected for Intentacle.

## The survival hypothesis

A stronger model may extract intent more accurately and need fewer questions.
People may still need to distinguish what was requested from what was inferred,
revise an earlier choice, and move work between assistants without losing the
decision history. If users repeatedly retain and edit the task record, better
models could make extraction cheaper while leaving that handoff useful.

The implemented rules support this experiment: origin survives confirmation,
delegation names an item, source-reported instructions remain proposals, and
gaps need explicit resolution references. These are format/implementation rules.
They are not authenticated proof of what a human said, and do not establish that
source content entails a claim. A fabricated user-answer reference can still
pass consistency checks.

## The strongest counterargument

A capable assistant can maintain the same JSON or a labeled Markdown brief. An
existing spec tool can add the same fields, review states, and export checks.
The [landscape review](landscape.md) shows substantial overlap already,
particularly in ClarifyPrompt and Spec Kit. The format and renderer are
straightforward to copy. Users may prefer the context and history in their
current assistant and never reuse an external record after its first export.

Model improvements could also reduce the underlying error rate so far that the
remaining value does not pay for another interface, question, or file. Better
extraction is therefore neither automatic validation nor automatic refutation of
Intentacle. Observable use after extraction is the distinguishing test.

## Hostile hypotheses and evidence

| Hypothesis                                   | What would support it                                                                                         | Response                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| H9: current models infer well enough         | The record fails both quality and handoff-effort gates against ordinary conversation                          | Simplify or stop according to the predeclared evaluation rules                            |
| H11: users see another prompt optimizer      | Participants only copy the final prose and do not retain or update records                                    | Treat the guided prose surface as the product; do not call record adoption established    |
| H13: model-specific adapters become obsolete | A generic export matches an adapter within two successes per 40 paired cases, with no added severe violations | Keep only transport compatibility where needed; drop bespoke prompt tuning                |
| H14: ecosystems settle on another format     | Real consumers require an existing protocol/schema and discard Intentacle's custom semantics                  | Map to the useful existing format or contribute upstream; do not invent another transport |
| H15: there is no meaningful defensibility    | A small extension reproduces the useful behavior with equal or lower user effort                              | Prefer the extension unless standalone maintenance has another explicit purpose           |

H13 is a future decision rule, not a claim that an adapter exists or has been
evaluated. H14 is an observation to gather from consumers, not a forecast that a
particular protocol will win.

## What could accumulate value

Realistic, clearly licensed failure cases; reproducible evaluations that report
negative results; trustworthy maintenance; and integrations that remove repeated
work could be useful assets. None exists at sufficient scale to claim an
advantage today. A schema URL, logo, star count, or growing adapter list is not
evidence of one. The maintainer's own projects do not count as independent
adoption, and default telemetry would undermine the intended local workflow.

The [evaluation protocol](evaluation.md) defines quality/effort thresholds and
repeated record-use criteria. If its first gate passes, repeat the comparison on
new cases with a materially stronger or newer model before claiming the value
survives model improvement. If that repeat fails, reduce the scope or pause; do
not explain away the result as users needing more instruction.

Commercial viability needs separate evidence of a problem people will pay to
solve. Learning, personal utility, and a useful public contribution can still be
valid project outcomes without a standalone business or defensible market
position.
