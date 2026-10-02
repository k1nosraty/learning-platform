# Proposed Implementation Repository Structure

This planning package contains docs, ADRs, schema contracts and content fixtures only. Create source folders during Foundation, not empty fake implementation now. Keep this package as the repository root documentation.

| Future path | Responsibility |
| --- | --- |
| apps/web/app/ | Next routes/pages/layouts, auth adapter routes and API v1 transport |
| apps/web/components/ | Accessible UI and report presentation; no authoritative business rules |
| apps/web/lib/server/ | Composition root, auth/tenant boundary and service wiring |
| apps/worker/src/ | Worker startup, outbox dispatch, typed handlers and health signals |
| packages/domain/src/workspaces/ | Membership, role and relationship invariants |
| packages/domain/src/content/ | Canonical validation, unit derivation and version rules |
| packages/domain/src/learning/ | Progress/state/cycle/time semantics |
| packages/domain/src/evidence/ | Attempt/review invariants |
| packages/domain/src/reporting/ | Factual model and cutoff rules |
| packages/application/src/ | Authorized commands/queries, transaction orchestration, DTOs |
| packages/contracts/src/ | Runtime request/response schemas and generated API types |
| packages/database/src/ | Drizzle schema/repositories, tenant transaction runner, auth connection |
| packages/database/migrations/ | Reviewed ordered SQL and RLS/constraint changes |
| packages/adapters/src/ | Blob/email/AI/job implementations behind interfaces |
| packages/content-format/src/ | Markdown/ZIP read/write adapters and source mappings |
| packages/ui/src/ | Optional shared UI primitives after actual reuse emerges |
| packages/report-renderer/src/ | Trusted HTML/print template/PDF composition |
| tests/integration/ | Real PostgreSQL/runtime role/service/storage tests |
| tests/e2e/ | Browser journeys and download validation |
| tests/fixtures/ | Malicious input/time/race fixtures; reusable examples copied where needed |
| infra/ | Dockerfiles, compose, migration/backup/deployment instructions |
| scripts/ | Development/admin commands with explicit privileges and safe modes |
| docs/, adr/, schemas/, examples/ | Existing design and portable contracts |

Use a pnpm workspace; do not add an orchestration framework merely to manage two apps. Domain/application packages have no React/Next imports. Web/worker share tested services rather than copying calculations. database package depends on contracts/domain types as needed; domain never imports ORM.

Test files sit near pure logic where useful; integration/E2E folders hold external dependency scenarios. No “utils.ts” dumping ground or giant application service. Names refer to domain functions, not the temporary product branding.

## Foundation-created root files

package.json with actual scripts, pnpm-workspace.yaml, pinned lockfile, tsconfig base, lint config, .env.example, .gitignore, development compose, web/worker Dockerfiles and CI workflow. None is shipped now as pretend executable setup. README development commands become runnable only after Foundation creates and verifies them.

## Required script contract

`dev`, `dev:worker`, `build`, `lint`, `typecheck`, `test:unit`, `test:integration`, `test:e2e`, `db:migrate`, `db:seed`, `content:validate`, `content:export`, `docs:check`. Exact script implementation belongs to the relevant phase; phase completion requires it to exist and pass. Do not leave missing commands documented as working.

## Dependency direction

Transport/UI → application services → domain + repository/adapter interfaces → concrete adapters at composition root. Infrastructure imports domain types, not the reverse. Architecture tests can forbid repository imports in UI and auth secrets in browser bundles. Split packages further only when ownership/build/test isolation warrants it.
