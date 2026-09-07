# Foundation review follow-up

Review date: 2026-09-06. Claude opened nine issues against PR #1, with no
separate PR discussion or inline comments visible when this follow-up began. The
findings are primarily onboarding, packaging, and public-groundwork gaps. They
do not establish that the core behavior is free of other defects.

| Issue                                                                               | Assessment and response                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#2 License](https://github.com/ThatGuySteve/Intentacle/issues/2)                   | Applied [Apache-2.0](licensing.md) on 2026-09-07 after maintainer authorization; added full terms, package metadata, contribution guidance, and packaging coverage                                          |
| [#3 Duplicate examples](https://github.com/ThatGuySteve/Intentacle/issues/3)        | Replaced duplicates with distinct blocked-app and supplied-function walkthroughs, matching task IDs, and CLI coverage                                                                                       |
| [#4 Mascot package size](https://github.com/ThatGuySteve/Intentacle/issues/4)       | Excluded artwork from the package and added a 128 KiB tarball budget. Kept the approved original in Git; historical clone size is unchanged                                                                 |
| [#5 Markdown escaping](https://github.com/ThatGuySteve/Intentacle/issues/5)         | Accepted the readability improvement. Renderer 0.1.1 preserves ordinary punctuation while quoting each source line and escaping markup/HTML; added adversarial coverage                                     |
| [#6 Guarded export example](https://github.com/ThatGuySteve/Intentacle/issues/6)    | Quickstart now demonstrates exit code 3 against its own blocked example and a successful guarded export against the supplied-function example                                                               |
| [#7 Community/reporting files](https://github.com/ThatGuySteve/Intentacle/issues/7) | Added security boundaries/reporting guidance, conduct policy, two issue forms, and a PR template. Private advisory availability is not assumed; reporting guidance includes a no-sensitive-details fallback |
| [#8 Landscape/novelty](https://github.com/ThatGuySteve/Intentacle/issues/8)         | Published a refreshed primary-source [landscape review](landscape.md). The earlier groundwork covered it, but the repo did not. Documentation overlap is distinguished from verified runtime behavior       |
| [#9 Defensibility](https://github.com/ThatGuySteve/Intentacle/issues/9)             | Published the survival hypothesis, strongest counterargument, hostile hypotheses, and observations that would support simplifying or contributing upstream                                                  |
| [#10 Decision thresholds](https://github.com/ThatGuySteve/Intentacle/issues/10)     | Declared protocol-v1 sample sizes, quality/effort/safety/cost thresholds, and distinct simplify/pause/stop decisions before extraction or results                                                           |

All nine issues are addressed in the existing foundation PR and should close
when it merges. No model evaluations, participant sessions, competitor product
tests, or package release have been performed as part of this follow-up.
