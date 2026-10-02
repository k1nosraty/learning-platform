# Phase 1 — Foundation

Status: implemented, validation in progress on `develop`. No public deployment.

## Run locally

Use Node 24 and pnpm 11.25.0 as an ordinary (non-root) system user. Versions are pinned in package manifests and pnpm-lock.yaml. PostgreSQL 18.4 is the runtime database; the embedded-postgres beta tag describes the test harness wrapper, not a beta PostgreSQL server.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
```

Replace `BETTER_AUTH_SECRET` with at least 32 random characters and `MAIL_ENCRYPTION_KEY` with 32 random bytes encoded as 64 hexadecimal characters. Generate them with `openssl rand -base64 48` and `openssl rand -hex 32`; keep `.env` outside git. Development database passwords in compose are local examples only.

```sh
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

In a second terminal run `pnpm dev:worker`. Open <http://localhost:3000/fa/register> or <http://localhost:3000/en/register>, then the SMTP inbox at <http://localhost:8025>. Follow the delivered verification link. A verified user gets one personal workspace and may create organizations. The seed command explains verified onboarding; it does not insert accounts with shared credentials. Development mail is real SMTP delivery to Mailpit, not a fake success response.

The web launcher reads root `.env` before starting Next, without embedding environment files into the bundle. Production uses externally injected environment variables. The app, identity adapter, migration runner and worker use distinct database credentials.

## Implemented boundary

- Better Auth email/password, verified email, database-backed sessions, recovery and reset that revokes existing sessions. Credential code remains in Better Auth.
- Idempotent personal onboarding; organization creation; owner settings with revision checks.
- Active organization memberships with owner/manager/mentor/learner roles. Last-owner guard and immediate access revocation.
- Hash-stored 32-byte invitation tokens; matching verified recipient; seven-day expiry; authority checked again at acceptance; single-use transactional acceptance. Owners grant any fixed role; managers grant learner/mentor only. New invitations are limited to 30 per issuing member per hour; idempotent replays do not consume another invitation.
- Explicit manager–learner pairs with same-workspace composite foreign keys. Manager-issued learner invitation creates the pair only after valid acceptance.
- PostgreSQL transaction-local tenant/actor context, forced RLS, non-owner/NOBYPASSRLS runtime role and narrow verified-user bootstrap/list/invitation-locator functions.
- Encrypted short-lived SMTP queue, retry/backoff and token payload deletion after delivery/terminal failure. Worker checks pending invite/issuer authority before dispatch. SMTP is at-least-once: a crash after SMTP acceptance but before commit may deliver a duplicate email; accepting it still consumes the invitation once.
- Locale routing, persisted own-account preference, pre-login language selection, complete fa/en catalogs/errors/email text and RTL/LTR responsive shell. Content, report and notification features arrive in their respective phases.

`packages/application` contains shared services; Next routes/screens are adapters. `packages/domain` owns role predicates, `packages/contracts` owns strict transport schemas/catalogs, `packages/database` owns adapter schema/transactions/migrations, and `packages/adapters` owns email delivery. Business SQL is explicit and parameterized; Drizzle is used by the supported Better Auth adapter. Introducing a generic ORM repository abstraction is unnecessary for this small slice.

## API

Auth remains under `/api/auth/*`. Implemented REST routes are `/api/v1/workspaces`, `/api/v1/me/preferences`, `/api/v1/invitations/accept`, and scoped workspace detail/settings/members/invitations/manager-learners. [OpenAPI](api/foundation.openapi.json) is generated from the strict Zod input contracts with `pnpm docs:api`; `docs:check` detects drift. Creation uses `Idempotency-Key`; state edits use `expectedRevision`. JSON errors are localized and carry request IDs. Cookie mutations require exact trusted Origin. DTOs omit token hashes and encrypted mail. A manager's member list is limited to self and explicitly managed learners; owners see all organization members. Mentors/learners do not have administrative lists.

## Checks and evidence

```sh
pnpm check
pnpm build
pnpm test:integration
pnpm exec playwright install chromium
pnpm test:e2e
```

Integration/E2E each create an isolated real PostgreSQL 18.4 cluster and real SMTP receiver, provision distinct roles, apply migrations twice, and remove the database afterwards. They require an ordinary system user because PostgreSQL rejects root. No SQLite/fake-database alternative is accepted for the tenant gate. GitHub Actions runs checks, database tests and Chromium independently.

Local evidence: four unit tests, lint, TypeScript, generated OpenAPI/catalog checks and optimized web/worker builds pass. The initial Foundation CI run also passed all six database tests and both Chromium tests on Ubuntu 24.04: [run 37028506434](https://github.com/k1nosraty/learning-platform/actions/runs/37028506434). Final refinements add named member selectors, invitation throttling, recipient-locale persistence and owner-race/API-revocation coverage; they are being revalidated in CI. The current managed execution environment cannot create/switch Linux users, so native PostgreSQL tests are blocked locally. Native PostgreSQL execution is validated in CI; local blocking does not count as a passing test. Production SMTP/provider configuration, backup/restore/load and deployment rehearsal remain pilot gates.

## Operational limits

Production must provision the migration/function owner with controlled RLS-bypass privilege and separate secrets; never use it as the application connection. The auth connection can access only identity tables and enqueue non-tenant email. The worker can read the encrypted queue and scoped invitation/issuer state, but cannot access identity credentials. Root-level bootstrap/locator functions are allowlisted, use fixed search paths and revoke PUBLIC execution.

Migrations run transactionally under an advisory lock and store checksums. Do not edit applied migration files. Preserve the email encryption key while pending deliveries exist; key rotation requires draining or re-encrypting the queue. Use authenticated TLS/STARTTLS SMTP in production. This phase supplies local compose and CI; hosting is not configured or published.

## Build artifacts

`pnpm build` creates the Next standalone output and `dist/worker.mjs`. Container targets are available in `infra/Dockerfile` (`--target web` and `--target worker`), run as non-root, and receive secrets at runtime. Docker image builds were not executed in the managed environment because Docker is unavailable; the compiled artifacts themselves are validated. These files prepare packaging, not a published deployment.
