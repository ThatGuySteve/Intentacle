# Public development fixtures

These twelve original synthetic records are regression cases. They are manually
authored examples of intended record behavior, not the output of an extractor or
evidence of model performance.

`cases/` contains standalone task records. `expectations.json` names each
scenario and independently lists expected blocked steps and
active/proposed/rejected items. User answers and evidence needed to understand
each decision are in the record's references; no hidden answer is given to an
inference system here.

```sh
npm run fixtures
```

The runner checks every fixture's validity, readiness for all four steps,
dispositions, deterministic export, manifest coverage, and lack of input
mutation. Malformed records and adversarial state mutations are tested
separately in `test/core.test.mjs`.

| Case                    | Behavior                                                  |
| ----------------------- | --------------------------------------------------------- |
| Literal request         | Do not invent SaaS context or release-readiness intent    |
| Missing app             | Preserve a blocker without blocking unrelated preparation |
| Unconfirmed scope       | Keep plausible narrowing proposed                         |
| Delegated format        | Scope delegation and retain inferred origin               |
| Rejected scope          | Exclude rejected instructions while retaining lineage     |
| Conflicting constraints | Carry a recorded tradeoff forward                         |
| Explicit correction     | Preserve an earlier output choice as rejected             |
| Unavailable reference   | Do not treat a locator as inspected content               |
| Hostile reference       | External instructions do not become selected requirements |
| Resolved evidence       | Preserve document attribution for a resolution            |
| Constraint strength     | Keep hard constraints distinct from preferences           |
| Resolved conflict       | Require a scoped user answer for the recorded resolution  |

All of these cases become development data on publication. Future evaluation
needs separate scenarios and held-out scoring materials; see
[the protocol](../docs/evaluation.md).
