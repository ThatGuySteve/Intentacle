# Roadmap

The first question is whether explicit intent records improve real handoffs
enough to justify their cost in user effort. The schema and CLI exist to test
that claim.

## Foundation — this change

- Experimental record schema, provenance checks, and scoped review decisions.
- Offline CLI/library, deterministic Markdown export, and coverage manifest.
- Twelve original public development fixtures and inexpensive deterministic CI.
- Clear limits: literal initialization, manual records, no model outcome claims.

Complete when a fresh checkout can install, validate the examples, apply a
review decision without changing origin, and render a faithful handoff with all
recorded blockers visible.

## Next: extraction and clarification experiment

1. Define a small inference interface that returns proposed records and
   candidate questions. The caller supplies endpoint configuration; credentials
   stay outside records and exports.
2. Add one tested provider integration and a fake provider for deterministic
   tests. Do not assume that every “compatible” endpoint supports structured
   output.
3. Preserve the raw request on failure. Reject invalid extraction output; permit
   at most one bounded repair attempt before returning an explicit error.
4. Add a terminal review loop for a few scoped choices, free-text alternatives,
   and “I don't know.” Resolve material gaps from supplied evidence where
   possible.
5. Run the comparison in [the evaluation protocol](docs/evaluation.md),
   reporting unsupported assumptions, user effort, outcome quality, latency, and
   total cost.

Complete when the prototype can turn a rough software request into a reviewable
record, preserve unanswered questions, and produce reproducible comparison
artifacts. Choose a license before inviting code contributions or releasing a
package; Apache-2.0 is the current proposal, not an applied license.

## Public alpha, only if evidence supports it

- Improve onboarding and install/release instructions based on actual users.
- Add a small local interface if it reduces effort in the pilot.
- Add a task-specific export or adapter only when a real consumer needs it.
- Use Intentacle to capture its own next feature request and publish the
  resulting handoff as an example.

Accounts, cloud sync, orchestration, a prompt marketplace, a provider gateway,
MCP hosting, and broad agent contracts are outside the current scope.

If a guided worksheet or normal conversation performs as well with less effort,
simplify the product accordingly. More schema fields or adapters are not
evidence of value.
