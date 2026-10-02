# Content Examples and Expected Behavior

| Example | Purpose |
| --- | --- |
| [sample-learning-path/README.md](sample-learning-path/README.md) | Structured general technical path with required, optional and approval activities |
| [sample-learning-path/roadmap.yml](sample-learning-path/roadmap.yml) | Normative manifest and body references |
| [sample-learning-path/canonical.expected.json](sample-learning-path/canonical.expected.json) | Expected adapter result, including body text |
| [sample-learning-path/single-file.md](sample-learning-path/single-file.md) | Equivalent structured single Markdown import |
| [loose-readme/README.md](loose-readme/README.md) | Human-written Persian roadmap; no internal schema required |
| [loose-readme/EXPECTED-BEHAVIOR.md](loose-readme/EXPECTED-BEHAVIOR.md) | Semantic/source-retention requirements, not exact AI prose |
| [nontechnical-onboarding/README.md](nontechnical-onboarding/README.md) | Proof that path structure is not hardcoded for technology |
| [nontechnical-onboarding/roadmap.yml](nontechnical-onboarding/roadmap.yml) | Self-confirmed training fixture |
| [nontechnical-onboarding/canonical.expected.json](nontechnical-onboarding/canonical.expected.json) | Canonical parity fixture |

The technical fixture has four required units: two tasks, one standalone lesson confirmation and one approval project. It also has one optional exercise. In an organization, approving the project after the other three required units are satisfied yields 100%; before approval progress is 75%. In personal mode, show and confirm conversion of approval to self rule before publishing/start.

Structured repository round-trip compares canonical supported fields, not generated export filenames or application UUIDs. `canonical.expected.json` and `single-file.md` are fixture companions, not additional manifest-listed nodes; importer may warn about unlisted Markdown without creating duplicates. A production export need not include expected-test JSON files.
