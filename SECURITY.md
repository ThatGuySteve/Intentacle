# Security policy

Intentacle is an experimental local library and CLI. The current development
branch is the only supported version; there are no published releases or support
deadlines yet.

## What the boundary covers

- Structure and provenance checks reject inconsistent IDs, unavailable evidence,
  and review decisions without a supplied answer scoped to the target item.
- External documents remain data. Source-reported context is attributed, and
  embedded requirements do not become selected instructions without a recorded
  user decision.
- The core does not fetch reference locators, execute tasks, call a model, or
  upload records. Dependency installation is separate and can use the network.
- The CLI limits JSON file/stdin input to 1 MiB and refuses to overwrite an
  existing `--out` file.

## What it does not establish

A valid record does not prove its contents are true, complete, written by a real
user, or authorized for execution. A caller can forge a user-answer reference or
mislabel a document claim. Hosts must authenticate users and enforce their own
tool permissions; they must not use a record's `confirmed` state as an access
control decision.

No recorded blockers means no recorded blockers for that step. Unknowns and
contradictions can still have been missed. Markdown quoting controls
presentation; it does not guarantee resistance to prompt injection in a
downstream model. Exports include supplied source excerpts, including historical
answers. Review them before sharing, and keep private records and credentials
out of Git.

## Reporting a concern

Use the repository's
[Security tab](https://github.com/ThatGuySteve/Intentacle/security). If GitHub
offers **Report a vulnerability**, use that private channel. Availability of
private reporting has not been verified, so this policy does not promise that
the button exists.

If it is unavailable, open an issue titled **Private security contact
requested** with no exploit details, credentials, private records, or personal
information. The maintainer can arrange a private channel before receiving the
details. The initial issue itself is public. Do not attach sensitive material to
it.

Once a private channel is established, useful details include the affected
commit, minimal sanitized input, expected boundary, observed behavior, and
impact. Ordinary non-sensitive correctness reports can use the bug-report
template.
