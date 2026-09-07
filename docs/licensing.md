# License decision

Applied on 2026-09-07 following maintainer authorization to choose a standard
open-source license. Intentacle uses [Apache-2.0](../LICENSE), as proposed in
the groundwork and requested by issue
[#2](https://github.com/ThatGuySteve/Intentacle/issues/2).

The repository includes the full license text and project attribution.
`package.json` and the root entry in `package-lock.json` identify the license as
`Apache-2.0`. The README, contribution terms, and roadmap reflect this decision.
The package smoke check verifies that the installed package includes the
license.

Read [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution terms and the
[official Apache-2.0 text](https://www.apache.org/licenses/LICENSE-2.0) for the
license's conditions.

Package publication remains disabled with `private: true` until an intentional
alpha release. The applied proposal is preserved in Git history; its obsolete
patch has been removed from the working tree.
