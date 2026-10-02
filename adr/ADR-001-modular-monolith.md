# ADR-001 — Modular Monolith with Worker

Status: proposed · 2026-10-02

Context: content publication, review and progress updates require strong transactions. Team/traffic scale is not yet proven, while PDF, email and imports are slow tasks.

Decision: one domain/application codebase, Next.js web process and separate Node worker, sharing PostgreSQL. Keep bounded-context modules and dependency direction; workers use shared services.

Alternatives: microservices add distributed transactions/deployment overhead before a measured need; a single request-only process risks blocking and unreliable long jobs. A desktop application complicates employer live access and tenant collaboration.

Consequences: simple transaction boundaries and smaller operating surface; database/process resource contention requires measurement. PDF has a separately constrained worker image. Future service extraction remains possible via clear contracts, not prebuilt distributed machinery.

Verification: architectural import restrictions, web/worker independent health, restart/queue tests and beta workload report. [Architecture](../docs/05-ARCHITECTURE.md) is normative.
