# Development, Deployment and Recovery Specification

Commands below are the future development contract, not runnable application commands in this planning package. Phase 1 creates and verifies them. This document describes provider-neutral Docker deployment; no live site is deployed or hosting account selected.

## Local setup target

Prerequisites: compatible pinned Node 24/pnpm, Docker-compatible engine. `.env.example` documents database/auth origin/secret, private storage endpoint/bucket, dev SMTP, worker configuration and optional AI flags without real secrets.

Target sequence: install dependencies from lockfile → `docker compose up -d` infrastructure → `pnpm db:migrate` → `pnpm db:seed` dev fixtures → web/worker dev scripts. PostgreSQL, compatible blob storage and development mail inbox are provided by compose; worker/Chromium prerequisites documented. Provide Windows/WSL guidance when shell assumptions matter. Production seed/demo accounts must never be enabled automatically.

## Configuration inventory

| Group | Required configuration |
| --- | --- |
| Identity | Auth secret, trusted base URL/origin, SMTP sender/credentials, verification/reset policy |
| Database | Separate migration, app runtime, auth adapter and worker credentials; TLS and pool bounds |
| Files | Private endpoint/region/bucket, encryption/access settings, limits, retention defaults |
| Jobs | pg-boss schema/role, worker concurrency/timeouts, polling/health configuration |
| PDF | Chromium image/version, fonts, sandbox/resource/network policy |
| AI optional | Enabled flag, workspace allowance, provider/model/secret, token/cost budgets |
| Observability | Request/log destination/redaction/retention, error reporting, alerts |

Missing required config fails startup clearly. Missing AI config disables AI only. Storage/email dependencies are not replaced by production mocks.

## Runtime health

Public liveness reveals only that process responds; protected operator readiness verifies database/queue/storage configuration without leaking secrets. Web readiness requires auth/database; worker health reports active lease, queue lag and failed jobs. Degraded email/AI should show recoverable job states, not crash unrelated learning. Alert on repeated failures, queue age, restore/backup failures and missing referenced files.

## Deployment sequence

Build/pin web and worker images from same source/lockfile, run tests, inspect dependency/image issues, back up current state, apply migrations using separate role, deploy compatible web/worker, run readiness and key authenticated smoke flow, then admit pilot users. Database/blob are private, TLS required, cookie origin fixed and renderer network restricted. Production read models must not be globally cached.

Use expand/contract migrations when versions overlap. Keep previous image for application rollback; migrations are not automatically reversible. Rollback plan states whether old app can read new schema. Destructive migrations require isolated validated backup/restore planning rather than blind “down migration”.

## Backup/restore pilot target

Initial engineering targets: daily encrypted database backup, object versioning or coherent backup snapshot, 30-day retention, RPO <=24 hours and RTO <=4 hours. These are targets to demonstrate on the chosen deployment, not promised SLAs. Transactional jobs/outbox must be recovered with dedupe semantics.

Restore into an isolated environment: recover DB and object versions, use separate secrets/origins, disable outbound email/AI, verify migrations/schema, check accepted object bindings/hashes, replay/reconcile safe jobs, run tenant/report smoke tests and record elapsed time/data cutoff. Never send restored invitations/emails accidentally. Only restore proof supports a pilot readiness claim.

## Operator actions

Document failed-job inspection/retry, invitation reissue, session revocation, membership correction, storage reconciliation, export/privacy requests, retention purge and report regeneration from stored model. No generic platform-admin content browser or impersonation feature in MVP. Sensitive operator access is separately granted/audited and not available to organization admins.

## Environment separation

Development/test/staging/production use separate databases, buckets and secrets. Test fixtures have synthetic personal data. Do not copy production note/source/evidence bodies into logs or test environments. Email/AI providers and jurisdiction/retention obligations are resolved before public commercial launch; security tests remain required for controlled pilot.
