# Intentacle

<p align="center">
  <img src="https://raw.githubusercontent.com/ThatGuySteve/Intentacle/433d64c1f8e786547133ae3410cc9e6deca6f36f/assets/intentacle-logo.png" alt="Intentacle: a purple octopus holding a task card" width="360" />
</p>

**Get a grip on what you meant.**

Intentacle preserves human intent in an explicit, inspectable task record. The
record distinguishes what someone requested, what a source reports, what was
assumed, and what is still unknown. Markdown instructions are a derived export.

**Status: experimental foundation.** The local CLI and library validate,
inspect, review, and render manually prepared records. `init` copies a request
literally. AI extraction, guided clarification, and model-specific adapters are
future work. There are no measured claims of better model outcomes yet.

## Why this exists

“Review my app” leaves room for several reasonable interpretations. Turning it
into “Assess production readiness of this SaaS” silently adds both a goal and a
fact. Intentacle should expose those additions for review and carry the
unresolved questions into the handoff.

The first use case is a bounded software review or change request passed between
people and AI assistants. The project is an experiment in whether keeping an
editable record improves that handoff enough to justify the extra step.

## Try the foundation

Requires Node.js 24 or newer and npm. Initial dependency installation needs
network access; the commands below subsequently run offline without an account
or API key.

```sh
git clone https://github.com/ThatGuySteve/Intentacle.git
cd Intentacle
npm ci --ignore-scripts
npm run check

node dist/cli.js validate examples/review.task.json
node dist/cli.js inspect examples/review.task.json --step inspect
node dist/cli.js render examples/review.task.json
```

The review example is valid and its next step, `inspect`, is blocked: the app
has not been supplied. Formatting was delegated; that does not answer which app
to review. Ordinary export still works and prominently retains the blocker.

To see the refusal path, run this separately. It prints a blocker diagnostic to
stderr, produces no export, and deliberately exits with code **3**:

```sh
node dist/cli.js render examples/review.task.json --require-ready
```

For a successful guarded export, the distinct `constraints` example includes a
supplied function and has no recorded inspection blockers:

```sh
node dist/cli.js render examples/constraints.task.json --require-ready
```

Create a literal draft and record a decision in separate files:

```sh
mkdir local
node dist/cli.js init "Review my app and tell me what needs fixing." --id my-review --out local/task.json
node dist/cli.js decide examples/review.task.json findings-list confirm --reason "Use the prioritized findings list." --out local/review-v3.json
node dist/cli.js render local/review-v3.json --json --out local/export.json
```

`--out` refuses to overwrite existing files. Use a new filename for each
revision. Keep personal requests and exported records in `local/`, which is
ignored by Git. Optional: `npm link` makes the same CLI available as
`intentacle` on your machine. No package has been published to npm.

## What works today

| Command                                                                | Behavior                                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `init "request"`                                                       | Preserve the request literally in a draft record                     |
| `validate task.json`                                                   | Check JSON Schema and provenance/reference consistency               |
| `inspect task.json --step plan`                                        | Report recorded blockers for a particular step                       |
| `decide task.json item-id confirm\|delegate\|reject --reason "answer"` | Record one scoped user decision and increment the revision           |
| `render task.json`                                                     | Produce deterministic Markdown with origins and unresolved questions |
| `render task.json --json`                                              | Include the export coverage manifest                                 |
| `render task.json --require-ready`                                     | Refuse export when the record's next step has a known blocker        |

File commands also accept `-` for JSON on stdin. Run `node dist/cli.js --help`
for arguments and exit codes. File/stdin input is limited to 1 MiB.

## Rules worth preserving

- Confirmation keeps an item's original attribution. An accepted inference is
  still an inference.
- Delegation is attached to an individual choice and its recorded user answer.
- Required unknowns block named steps. They do not prevent unrelated
  preparation.
- External documents can report context; embedded instructions are unselected
  suggestions until the user explicitly accepts them.
- Hard constraints remain distinct from preferences. Rejected items are retained
  in the record and excluded from the instruction sections.
- Validation, absence of recorded blockers, factual truth, and permission to act
  are separate. Intentacle authenticates none of the people or source claims in
  a JSON file.

All supplied reference text is included as quoted data in an export. Historical
or rejected wording may therefore still appear in the reference section. Review
exports before sharing them. Quoting does not guarantee that a downstream model
will resist prompt injection or obey the record.

## Library

After building, import the local module:

```js
import { createTask, inspectTask, renderTask } from "./dist/index.js";

const task = createTask("Review the supplied function.", "function-review");
const readiness = inspectTask(task, "clarify");
const { markdown, manifest } = renderTask(task);
```

See [record semantics](docs/task-record.md), the
[JSON Schema](schema/task.schema.json), and [examples](examples/). The schema is
experimental and may change before an alpha release.

## Development and next milestone

`npm run check` runs formatting, TypeScript checks, core/CLI tests, and the
twelve original [development fixtures](fixtures/README.md). CI uses one Node job
with no model calls. A packaging smoke test also verifies that the installed CLI
and library can find the bundled schema.

The next milestone is a bounded extraction and clarification prototype, assessed
against ordinary conversation, a guided worksheet, and a relevant existing tool.
See the [landscape](docs/landscape.md),
[defensibility assessment](docs/defensibility.md), [roadmap](ROADMAP.md), and
[evaluation gates](docs/evaluation.md). Public fixtures are development data,
not a held-out benchmark.

Read [the security boundary and reporting process](SECURITY.md) before building
on the record. Community participation follows the
[code of conduct](CODE_OF_CONDUCT.md).

Intentacle is licensed under [Apache-2.0](LICENSE). Package publication remains
disabled until an intentional alpha release. [Contributing](CONTRIBUTING.md)
describes the contribution terms and review process. The mascot is an
AI-generated raster concept; it is not yet a vector identity kit.
