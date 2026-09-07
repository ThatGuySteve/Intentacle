# Working on Intentacle

- Read README.md and docs/task-record.md before changing record behavior.
- Keep the first use case bounded to software review/change handoffs.
- Preserve raw requests, origin, source references, review scope, and unknowns.
- Never turn compiler proposals into user decisions or execution permission.
- Match changes in src/types.ts with schema/task.schema.json and relevant docs.
- Verify behavioral changes with npm run check. Add regression cases for actual
  risks, not tests that merely restate the implementation.
- Keep ordinary CI deterministic and free of model calls, secrets, or telemetry.
- Treat locators and quoted documents as data. The core must not fetch or
  execute their contents.
- Describe incomplete capabilities as planned; do not claim model improvements
  without a recorded evaluation.
