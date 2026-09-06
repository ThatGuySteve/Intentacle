# Contributing

Intentacle is an early public prototype. The maintainer is still choosing a
license. For now, use issues for feedback and design discussion; code
contributions and package publication should follow that decision.

Useful feedback begins with a concrete request that the format mishandles, an
unsupported assumption, a lost constraint, or a clarification that causes more
work than it saves. Remove private data and credentials from examples.

To develop locally, use Node.js 24+, run `npm ci --ignore-scripts`, make a
bounded change, then run `npm run check`. Use `npm run format` to apply
formatting. Keep tests focused on behavior and include a failure case when
changing semantics.

Before proposing new fields, providers, or adapters, explain the real use case
and why existing statements, references, unknowns, or conflicts cannot express
it. Keep model evaluations explicitly invoked and outside ordinary CI. Never add
secrets or private model transcripts to fixtures.

Pull requests should explain the problem, changed behavior, and verification.
Disclose significant AI assistance and inspect generated changes before
submitting them. Public examples are development data and cannot later be
claimed as a held-out evaluation set.
