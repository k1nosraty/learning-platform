# Planning Package Validation

Date: 2026-10-02. These checks verify the planning artifact only; no application tests, live database, provider call, deployment or PDF engine were run.

| Check | Result |
| --- | --- |
| Numbered design documents | 24 present |
| ADRs | 12 present with context/decision/alternatives/consequences/verification |
| Local Markdown links | 119 checked before this validation note; all resolved |
| Original source copies | Byte-for-byte equal to supplied Master/Addendum |
| MVP acceptance IDs | 24 unique P0 IDs and 17 unique acceptance scenarios |
| Markdown formatting | Balanced code fences and consistent generated table column counts |
| Canonical schema/fixtures | JSON parsed; declared 2020-12 dialect; static checker covers the keyword subset used in this schema |
| Structured repository assembly | Manifest metadata + body files equal canonical.expected.json for both fixtures |
| Structured single file | Front matter equals technical fixture canonical JSON |
| Content/domain rules | IDs, references, permitted hierarchy, sibling order, cycles, completion matrix, required publication units and size checked |
| Negative fixture mutations | Invalid kind, schema version, extra field and orphan parent rejected by static checks |
| Progress example | Technical sample: 8 nodes, 5 units, 4 required, 1 optional; three required satisfied gives 75% |
| Generic-content example | Nontechnical sample: 4 nodes, 3 required units; no application-specific technology logic |
| Archive integrity | ZIP is checked for valid entries and packaged file parity when generated |

The local checker is a purpose-specific planning QA script outside the package, not a full production JSON Schema implementation or the future application parser. Foundation must install/pin a standards-compliant 2020-12 validator; Content phase must implement and test the canonical/domain/Markdown contracts.

Manual cross-document review aligned Enrollment terminology, fixed required-unit semantics, immutable version rules, relationship-based permissions, historical report cutoff, private-note exclusions, session revocation and optional AI capability. The package's MVP copy notes its refinements; the earlier standalone scope artifact remains unchanged.

Remaining evidence belongs to implementation gates in [Test Strategy](docs/22-TEST-STRATEGY.md), not this static check. No architecture document is a substitute for actual tenant-isolation, auth, report, AI or restore tests.

Multilingual refinement checked: MVP-22 requires complete fa/en (not merely i18n-ready); translated UI is no longer deferred; UX specifies selector/persistence/RTL; database/API specify locale preferences and report locale; email/notification/report jobs preserve locale semantics; tests and phase gates require both language journeys. Static validation and ZIP parity were rerun after these documentation changes. This does not claim actual translation catalogs or a bilingual application are implemented.
