# Experimental task record

The record is the editable source of truth. Exported prose does not update it.
Version `0.1.0-draft` describes one bounded software handoff; it is not a
standard or an execution contract.

## Fields

| Field            | Meaning                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| `schema_version` | Exact experimental format version; unknown versions fail validation             |
| `task_id`        | Stable task identity                                                            |
| `revision`       | Positive integer incremented when recording a change                            |
| `next_step`      | `clarify`, `inspect`, `plan`, or `execute`                                      |
| `references`     | Literal requests, scoped user answers, and supplied/unavailable documents       |
| `items`          | Objective, context, constraint, success criterion, or output statements         |
| `unknowns`       | Questions, necessity, affected steps, next action, and optional resolution      |
| `conflicts`      | Explicitly recorded incompatibilities between item IDs and their affected steps |

IDs are globally unique across references, items, unknowns, and conflicts. They
start with a letter and contain at most 80 letters, digits, underscores, or
hyphens. Preserve IDs across revisions; do not recycle them for different
claims. Assumptions are a derived view of inferred/default items, not another
mutable copy. The flat item list keeps the same provenance rules for all five
item kinds.

## Origin and review

| Origin            | Required attribution                                   | Default use when unreviewed                                |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| `user_stated`     | Supplied user request or an answer scoped to this item | Active user instruction/context                            |
| `source_reported` | Supplied document                                      | Context is reported data; other item kinds remain proposed |
| `inferred`        | Supplied sources plus a rationale                      | Proposed assumption                                        |
| `default`         | Supplied sources plus a rationale                      | Proposed default                                           |

Review states are `unreviewed`, `confirmed`, `delegated`, and `rejected`.
Confirmation or delegation makes an item usable without changing its origin.
Rejection removes it from active instructions. Every review decision references
a supplied `user_answer` whose `applies_to` includes the item ID. Delegation is
valid only for inferred/default items and should describe the scope of a choice.

The CLI's `decide` operation copies the input, adds a scoped answer, replaces
that item's current review state, and increments the revision. Earlier answer
sources remain in the record. Save earlier revisions separately for a full
change history; the record is not an immutable audit log. Unknowns and conflicts
are never resolved as a side effect of confirming an item.

These checks establish data consistency only. A caller can mislabel a fabricated
statement as user input or attach an irrelevant excerpt. The prototype does not
authenticate users, verify semantic entailment, detect factual falsehoods, or
prove that delegation text actually permits a proposed choice. Future inference
must produce proposals for review and cannot manufacture user decisions.

## Unknowns, conflicts, and readiness

Required unknowns name one or more blocked steps. Important and optional
questions have an empty `blocks` array. Irrelevant questions are omitted
entirely.

Steps are checked by exact membership, not by implied sequencing: if missing
information affects both planning and execution, list both. A missing app can
block inspection while allowing a general review plan. The same gap may block a
concrete implementation plan. The author records that scope deliberately.

Resolving an unknown requires resolution text with supplied document references
or a user answer scoped to that unknown. A locator with unavailable content
cannot serve as evidence. Resolving a conflict requires a scoped user answer and
note. Update affected item decisions separately; a conflict flag never silently
chooses which requirement wins.

`inspectTask` reports open unknowns/conflicts whose `blocks` contain the
requested step. No recorded blockers means precisely that. It does not imply the
author has found every ambiguity, conflict, missing capability, or prerequisite.
In particular, a literal `init` scaffold has no machine-discovered unknowns.

## Schema and semantic validation

The bundled schema uses JSON Schema Draft 2020-12 and rejects unknown fields,
invalid enums, empty content, invalid state combinations, and oversized
collections. The TypeScript validator additionally checks global IDs, reference
existence and availability, origin/source compatibility, and review scope.

Always use both checks when consuming an untrusted record. The library's
`validateTask` returns diagnostics without mutating the input; `parseTask`,
`inspectTask`, `decideTask`, and `renderTask` reject invalid records. No
function executes a task, dereferences a locator, or calls an inference service.

## Exports

`renderTask` returns `{ markdown, manifest }`. Ordering follows the record; no
timestamps or random values are added during rendering. Given the same record
and renderer version, output is identical.

The manifest contains task identity/revision, schema/renderer versions,
readiness, each item's disposition, whether its instruction text was emitted,
and all reference, unknown, and conflict IDs. Rejected item instruction text is
omitted; source excerpts remain quoted in the references section and may repeat
historical wording. The manifest describes coverage, not downstream compliance.

There is no compression pass, context-budget trimming, or model-specific
adapter. Hard constraints and material unknowns/conflicts are never silently
dropped to fit a budget. Markdown source quoting escapes HTML and Markdown
syntax; it is a presentation boundary, not a proven prompt-injection defense.

Renderer `markdown/0.1.1` preserves ordinary punctuation such as sentence-ending
periods, parentheses, and mid-line hyphens. It still escapes inline markup,
HTML, and leading heading/list/rule markers, and prefixes every source line with
a blockquote marker. The record format has not changed.

## Editing and compatibility

For now, manually edit the JSON to add statements, resolve questions, or change
the next step, increment `revision`, then validate. `decide` supports review
changes only. Keep source excerpts and earlier revisions if you need to
reconstruct why an item changed. Automatic corrections, source-change
invalidation, free-text answer interpretation, and schema migrations are future
work.
