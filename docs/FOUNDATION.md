# Phase 1 — Foundation

Status: Phase 1 implemented on `develop`; Foundation gate passed in GitHub Actions. No public deployment.

## Run locally

**Windows:** use [start-windows.bat](../start-windows.bat) for prerequisite setup and the full local container stack; see [Windows guide](WINDOWS.md). The commands below remain available for manual development.

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

Validation on 2026-10-02:

| Check | Result | Environment |
| --- | --- | --- |
| Frozen installation / dependency compatibility | Pass | Node 24.19.0 / pnpm 11.25.0; clean GitHub runner |
| Lint / strict TypeScript / catalog and generated OpenAPI parity | Pass | Local + CI |
| Unit tests | 4 passed | Local + CI |
| PostgreSQL integration | 7 passed | Actual PostgreSQL 18.4, separate runtime/auth/worker roles, Ubuntu 24.04 |
| Chromium E2E | 2 passed | Real verified onboarding + SMTP, Persian RTL/mobile, organization/settings, English preference and keyboard journey |
| Optimized web / bundled worker build | Pass | Local + CI |
| Production dependency audit | No reported vulnerabilities | `pnpm audit --prod` at validation time |

Evidence: [validated code commit d16f38a](https://github.com/k1nosraty/learning-platform/commit/d16f38a6ac628debb3e8091faf9242763859191f) and [green run 37029905359](https://github.com/k1nosraty/learning-platform/actions/runs/37029905359). The final locale-aware error/title refinement is checked by the same workflow, including a Persian 404 assertion. [Latest Foundation runs](https://github.com/k1nosraty/learning-platform/actions?query=workflow%3AFoundation) are the authoritative status for later commits.

A07/A08/A16 Foundation coverage includes tenant ID substitution, no-context RLS/pool reuse, database composite-FK rejection, fixed grant escalation, manager relationship scope, last-owner protection under concurrent changes, immediate membership revocation through the API with an existing session, mismatched/revoked/expired/stale invitations, duplicate acceptance, idempotency conflicts/revocation replay, CAS, real verification/recovery/invitation SMTP links, reset session revocation, trusted Origin and strict inputs. Content, evidence, file and report aspects of those scenarios belong to later phases.

The managed local execution environment cannot create/switch Linux users, so PostgreSQL integration and browser journeys were executed on ordinary-user GitHub runners instead. Local blocking does not count as a passing test. Docker image builds are not claimed: Docker is unavailable here. Production SMTP/provider configuration, backup/restore/load and deployment rehearsal remain pilot gates.


## Operational limits

Production must provision the migration/function owner with controlled RLS-bypass privilege and separate secrets; never use it as the application connection. The auth connection can access only identity tables and enqueue non-tenant email. The worker can read the encrypted queue and scoped invitation/issuer state, but cannot access identity credentials. Root-level bootstrap/locator functions are allowlisted, use fixed search paths and revoke PUBLIC execution.

Migrations run transactionally under an advisory lock and store checksums. Do not edit applied migration files. Preserve the email encryption key while pending deliveries exist; key rotation requires draining or re-encrypting the queue. Use authenticated TLS/STARTTLS SMTP in production. This phase supplies local compose and CI; hosting is not configured or published.

## Build artifacts

`pnpm build` creates the Next standalone output and `dist/worker.mjs`. Container targets are available in `infra/Dockerfile` (`--target web` and `--target worker`), run as non-root, and receive secrets at runtime. Docker image builds were not executed in the managed environment because Docker is unavailable; the compiled artifacts themselves are validated. These files prepare packaging, not a published deployment.
