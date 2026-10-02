# Risks, Contingent Decisions and Readiness

The architecture is coherent at design level. External-provider/configuration choices and runtime compatibility are implementation gates, not silently “solved” by documents. No user confirmation is needed to complete this package; existing authorization covers planning. Public deployment is a separate future request.

| ID | Risk / contingent choice | Baseline control | Owner/gate | Verification |
| --- | --- | --- | --- | --- |
| R01 | Personal mode inherits organization complexity | Same enrollment engine, automatic personal workspace | Domain/UX, Phase 1–3 | A01 no-company journey |
| R02 | Arbitrary README interpretation loses meaning | Source/provenance/unmapped panel + editable preview | Content, Phase 2/6 | English/Persian loose fixtures |
| R03 | Canonical/UI/Markdown schemas diverge | One JSON Schema and domain validator | Content, Phase 2 | Round-trip/parity fixtures |
| R04 | Tenant or relationship leak | RLS+composite FKs+service scope | Foundation, Phase 1 | Actual runtime-role tests |
| R05 | Content changes invalidate progress | Immutable versions/pinned enrollment | Content/Learning, Phase 2–3 | v1/v2 invariance |
| R06 | Race or retry doubles effects | Locks/CAS/unique keys/outbox/idempotency | Services, each phase | Controlled concurrency/fault injection |
| R07 | Cutoff/time reporting inconsistent | UTC instants, event/revision history, fixed snapshots | Reporting, Phase 5 | DST/reopen/late-entry fixtures |
| R08 | Auth/ORM adapter/version incompatibility | Pin supported combination and generated auth schema | Foundation, Phase 1 | Real registration/recovery/revocation |
| R09 | AI unavailable/cost/privacy mismatch | Optional bounded adapter, disclosure and budgets | AI, Phase 6 | Real synthetic-source run + failures |
| R10 | PDF RTL/font/pagination failure | Worker Chromium + bundled fonts/print QA | Reporting, Phase 5 | Rendered long mixed-language PDF |
| R11 | pg-boss/outbox mistaken for exactly-once effects | Idempotent handlers and acknowledged email duplicate risk | Jobs, Phase 4 | Crash after enqueue/provider receipt |
| R12 | Private blob or renderer SSRF | Auth proxy/binding, no arbitrary network | Files/Reporting, Phase 4–5 | Unauthorized file and URL fixtures |
| R13 | Runtime DB owner bypasses RLS | Separate roles + FORCE RLS/catalog checks | Foundation, Phase 1 | Grants/pooled context tests |
| R14 | Retention/export legal requirements unresolved | Configurable provisional defaults, controlled operator workflow | Pilot operator, pre-public launch | Organization requirements review |
| R15 | Scope expands to full vision | P0/deferred list and phase gates | Product, each phase | Backlog traceability |
| R16 | Backups incomplete or restore untested | Coherent DB/blob backups and isolated rehearsal | Operator, Phase 7 | A17 timed restore |

## Contingent choices by gate

Foundation: exact versions/lockfile, accessible component primitives, JSON Schema validator, ZIP/YAML libraries, SMTP adapter and local compatible blob service. Choices must satisfy security/contract requirements; alternatives require ADR update where materially different.

Reporting: final font package/license, print page size defaults (A4 baseline), Chromium image, resource caps and deployment worker sizing. Font choice is an implementation dependency, not a missing business rule.

AI: one provider/model, account data-retention settings, availability/structured-output support, cost budget and timeout configuration. Adapter remains optional; no secret or external source transmission is needed for this planning package.

Deployment: Docker-compatible hosting provider, object encryption/backups, alerting destination, final rate/retention policy and beta workload hardware. No cloud vendor is embedded in domain code. A public commercial offering needs actual organizational/legal obligations checked separately, without claiming this engineering plan establishes compliance.

## Decisions already specified

Workspace is tenant root; fixed initial role set; relational composite integrity; tenant-only RLS plus object relationship authorization; immutable content; flat typed canonical nodes; explicit equal-weight required units; immutable review attempts; historical-as-of report cutoff; raw-source privacy; optional bounded AI; REST/application boundary; modular monolith with outbox/worker. These do not need to be rediscovered before coding.

## Definition of design readiness

All Master §120 outputs are mapped in INDEX, normative examples agree with schema/domain rules, links/IDs are consistent, contradictions are explicitly corrected, and no executable app completion claims are made. Implementation readiness means the first phase can start; product readiness still requires the actual release evidence.
