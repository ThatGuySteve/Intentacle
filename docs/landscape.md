# Competitive landscape and novelty

Reviewed 2026-09-06, before implementing extraction. This is a public summary of
the founding groundwork, refreshed against the primary sources linked below. It
is a documentation survey, not a comparative product benchmark or exhaustive
code audit. No competitor was installed or exercised against a model in this
review.

**Assessment:** guided clarification, structured specifications, reusable
prompts, and cross-agent workflows already exist. Intentacle has not established
unique capabilities or superior outcomes. Its narrower hypothesis is that
maintaining statement origin, scoped review decisions, and unresolved questions
through edits and handoffs saves enough mistakes or effort to justify a separate
tool.

## Closest alternatives

“Not established” below means the reviewed documentation did not establish the
exact invariant. It is not a claim that the product lacks the capability.
Approval of a whole specification, trace logging, and source context inspection
are useful but do not by themselves prove item-level origin survives subsequent
confirmation.

| System and primary source                                                                          | Documented overlap                                                                                                                  | Provenance, source authority, and unresolved questions                                                                                                                                                          | Implication                                                                                     |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [ClarifyPrompt MCP](https://github.com/LumabyteCo/clarifyprompt-mcp)                               | Context-aware prompt compilation, workspace inspection, clarification, platform tuning, local traces, and accepted-outcome feedback | Its context bundle and trace inspection are relevant provenance features. Persistent item origin after review, source-instruction isolation, and evidence-only gap resolution are not established by the README | Closest prompt-oriented comparator. Inspect its record interfaces before duplicating extraction |
| [GitHub Spec Kit](https://github.com/github/spec-kit)                                              | Specification, clarification, planning, tasks, cross-artifact analysis, implementation, and extensions/presets across coding agents | Explicit spec artifacts and clarification overlap strongly. The exact origin/review invariant and scoped unknown-resolution semantics are not established by the README                                         | Compare against a real spec workflow; a preset or extension could be sufficient                 |
| [Kiro specs](https://kiro.dev/docs/specs/)                                                         | Requirements/bug analysis, design, implementation tasks, acceptance criteria, and requirement analysis                              | Human-readable requirement and design artifacts support review. The three exact item-level invariants are not established by this feature overview                                                              | Already covers far more of software delivery; Intentacle should not rebuild that lifecycle      |
| [Tessl spec-driven development tile](https://tessl.io/registry/tessl-labs/spec-driven-development) | Clarifying questions, structured specs, user approval, implementation, and verification                                             | Whole-spec approval is documented. Per-item retained origin, source authority isolation, and resolution provenance are not established by the tile                                                              | Approval alone is insufficient differentiation; compare the actual reviewed artifacts           |
| [SpecD](https://github.com/specd-sdd/SpecD)                                                        | Behavioral specifications, change lifecycle, verification, and optional approval checkpoints                                        | Spec conformance and governance are explicit. The exact origin/review and unknown-resolution semantics are not established by the README                                                                        | Substantial overlap with the deferred agent-contract concept; keep current scope smaller        |

ClarifyPrompt's README describes traces as optimization records and an
inspectable context bundle. That should be tested directly against Intentacle's
editable task record, rather than dismissed because the public output is a
prompt. Spec Kit already exposes extensions and presets, making an upstream
implementation a real alternative to maintaining a separate workflow. These are
inferences from the linked documentation, not findings that Intentacle wins
either comparison.

## Other tools named in the brief

| System and primary source                                                                                                                                      | Documented purpose or verification limit                                                                                                                           | Consequence                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| [PromptPerfect](https://promptperfect.jina.ai/) and [Jina's indexed service notice](https://promptperfect.jina.ai/api)                                         | Prompt optimization. The primary site's search-indexed notice says availability ended after September 1, 2026; direct page extraction returned no readable content | Historical category reference; current operational availability was not tested and it is not a committed live benchmark arm        |
| [Trammel PE, creator's description](https://www.linkedin.com/posts/seancofoid_your-ai-agent-keeps-failing-you-keep-tweaking-activity-7466194159079686147-nZcg) | Describes a local HTML interface for scope, tools, subtasks, completion, and output                                                                                | Close to a guided builder. Canonical source/release and deeper semantics remain unverified; do not claim a feature gap             |
| [Orxis](https://orxis.vercel.app/)                                                                                                                             | Interactive custom-instruction builder covering persona, task, tone, and rules                                                                                     | Guided forms and constraints are established; persistent assistant configuration differs from a particular evolving task           |
| [Poe Prompt Coach](https://github.com/beenotung/poe-prompt-coach)                                                                                              | Questions, document context, model choice, and iterative prompt refinement                                                                                         | Clarification UX is not novel. This identifies a third-party app, not a universal Poe feature                                      |
| [Promptimal](https://github.com/shobrook/promptimal)                                                                                                           | Prompt optimization with a genetic algorithm and an evaluator                                                                                                      | Optimizing a prompt against a metric does not recover an unstated private preference                                               |
| [Meta prompt-ops](https://github.com/meta-llama/prompt-ops)                                                                                                    | Dataset/metric-based prompt optimization with inference-provider support                                                                                           | Evaluation and target optimization already have infrastructure; avoid creating another optimizer by default                        |
| PromptVault: [bspann](https://github.com/bspann/promptvault) and [tech-sumit](https://github.com/tech-sumit/promptvault)                                       | Different projects document prompt versioning/search and prompt storage/reuse                                                                                      | The name is ambiguous. Neither README establishes the full set of task-record invariants; versioning alone is weak differentiation |

For these adjacent tools, the exact combination of origin surviving review,
source documents remaining non-authoritative, and unresolved questions requiring
explicit resolution was not established. That is an unresolved comparison, not a
blanket “unsupported” feature matrix. Documentation-based strengths should not
be promoted into measured model-quality claims either.

## Protocols are potential transports

[MCP elicitation (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
defines ways to request structured user input; it is a potential clarification
transport. [A2A's specification](https://a2a-protocol.org/latest/specification/)
defines tasks, messages, artifacts, and structured data parts. An intent record
could be an application payload. Neither transport description establishes
Intentacle's application-level meaning for origin, delegation, or readiness. Pin
a supported protocol version and negotiate semantics when implementing an
adapter. JSON transport by itself does not establish interoperability.

## Novelty claims we can and cannot make

We can describe the behavior of the current validator, review operation, and
renderer, with regression evidence. We cannot claim that structured prompts,
clarifying questions, JSON, provenance in general, or model adapters are new. We
also cannot claim that no existing tool can maintain this record. A normal
coding assistant could already create and edit a JSON file or a similarly
labeled brief.

Before selecting the extraction architecture, inspect ClarifyPrompt and Spec Kit
against six concrete probes: propose an inferred scope; confirm it without
erasing origin; delegate formatting without resolving a missing repository;
reject a source-embedded instruction; make an explicit user correction; export
and reload while preserving the resulting states. Record versions, inputs,
actual outputs, and whether custom code/templates were needed. These probes are
planned work, not completed product tests.

If an existing tool passes those probes with a small template or extension,
prefer that route unless the [evaluation gates](evaluation.md) show a separate
product offers additional benefit. If it does not, the missing behavior is a
testable integration opportunity, not proof of a durable business advantage. See
[defensibility](defensibility.md).
