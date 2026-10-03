# Gated Development Roadmap

Architecture package M0 and Phases 1 Foundation and 2 Content engine are delivered on `develop`; runtime evidence and setup are in [Foundation](FOUNDATION.md) and [Content](CONTENT.md). Phase 3 Learning awaits a separate start instruction. M1 is usable core without AI; M2 completes bounded AI conversion and pilot readiness. No time estimate is imposed before team/capacity evidence exists.

| Phase | Deliverable | Exit gate |
| --- | --- | --- |
| 0 Design | This package: requirements/domain/contracts/ERD/security/ADRs/examples | Document/schema/example checks pass; contingent decisions assigned to gates |
| 1 Foundation | Real workspace repository, identity, verified onboarding, personal/organization membership, roles/relations, invitations, migrations/RLS | Fresh install, real dev email, A07/A08/A16 core isolation/access; exact dependencies pinned |
| 2 Content engine | Visual editor, canonical validator, structured/loose imports, source preview, draft CAS, immutable publication, export | Fixture round-trip, malicious input, conflict/idempotency, personal start rules and version invariants |
| 3 Learning | Individual enrollment, next work, completion/events/cycles, notes/time/timeline, learner dashboard | Required/optional arithmetic, pinning, privacy, deadlines/time revisions, duplicates/reopens |
| 4 Evidence/review | Private files, attempts, changes/approval, scoped review queue, essential notifications/audit/outbox | Real revision cycle, stale review/self-approval denied, retry/job atomicity and access revocation |
| 5 Reports — M1 | Shared report service, snapshot, print/PDF, personal progress export, manager dashboard | Actual downloadable factual PDF, mixed language/page QA, cutoff/time correctness; both core journeys pass |
| 6 README AI — M2 | Configured real provider adapter, provenance, budget/disclosure/fallback | A05/A06 real-provider run, schema/permission validation, no-publish tests and non-AI operation |
| 7 Pilot hardening — M2 | Responsive/accessibility, full E2E/security/load, runbook/backups/deployment rehearsal | A01–A17, beta workload evidence, restore test, no mocked production actions |

## Foundation implementation slice

Include locale routing/resolution, account preference, pre-login language selection, fa/en catalogs and RTL/LTR shell in Foundation. Each subsequent phase must supply both translations for its new surfaces, including errors/emails. Bilingual report rendering belongs to Phase 5; end-to-end localization completeness is a pilot gate, not a feature postponed beyond MVP.

Start with exact version/adapter compatibility → source/CI/compose → migration roles + schema → auth lifecycle → idempotent personal onboarding → organization/membership → invitations/relationships → permission service/RLS integration tests → minimal genuine shell. Do not construct 30 dashboard pages before proving tenant isolation.

## Every phase

Run targeted unit/integration/E2E checks, then lint/typecheck/build and clean-database migrations. Manually verify one real journey using real persisted operations. Update docs/contracts/ADRs to match changes. Fix failures before next phase. Record commands/outcome/environment in a validation note; avoid claims based solely on screenshots or successful compilation.

## What “incremental” means

A phase delivers a vertical working slice. Missing later features are omitted from navigation. Development-only demo data is seeded by command; production domain behavior is never hardcoded to it. A smaller usable milestone can be reviewed without claiming full MVP completion.

## Deferred roadmap

After pilot validates value: templates/teams/cohorts, advanced import/re-import, prerequisite rules, assessments/certificates, richer reporting/share links, commercialization/enterprise/integrations. Order is a later product decision. Do not build billing/marketplace/SSO before the core is proven.

## Change control

If an implementation discovery changes an invariant, update ADR + affected contracts + fixture/test expectations before proceeding. Security/data-integrity corrections can be done within authorized scope; major product additions require a new scope discussion, not quietly expanding P0. Public deployment requires a concrete validated artifact and explicit user instruction to publish.
