# Apache-2.0 proposal — not applied

Issue [#2](https://github.com/ThatGuySteve/Intentacle/issues/2) asks the
maintainer to choose the project's license. Apache-2.0 was already the
groundwork proposal; the owner has not yet selected it. The repository remains
`UNLICENSED` until that decision is made.

The [prepared patch](proposals/apache-2.0.patch) contains the full terms and
these exact changes:

| File                                   | Proposed change                                                          |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `LICENSE`                              | Add the standard Apache License 2.0 text with project attribution        |
| `package.json` and `package-lock.json` | Set the project license to `Apache-2.0`                                  |
| `README.md`                            | State the selected license and keep package publication disabled         |
| `CONTRIBUTING.md`                      | State contribution terms instead of postponing contributions             |
| `ROADMAP.md`                           | Mark license selection complete; keep the separate alpha/publishing work |

`private: true` remains in place. Choosing a license and publishing a package
are separate actions.

Apache-2.0 permits reuse and distribution subject to its terms, includes a
contributor patent grant, and does not grant general trademark rights. Those are
substantive grants by the rights holders, so this is a reviewable proposal
rather than an inferred owner selection. Read the
[official terms](https://www.apache.org/licenses/LICENSE-2.0), particularly
sections 2–6, before adopting it.

After owner confirmation, apply the patch, update this decision note and the PR
description, and run `npm run check`. The patch is based on the review-follow-up
working tree and can be checked with:

```sh
git apply --check docs/proposals/apache-2.0.patch
```
