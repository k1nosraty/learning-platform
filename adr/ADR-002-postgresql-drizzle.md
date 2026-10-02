# ADR-002 — PostgreSQL and Drizzle

Status: proposed · 2026-10-02

Context: the domain has relational membership/content/enrollment/evidence links with tenant/version integrity and historical reporting. SQL visibility matters for RLS, locking and auditability.

Decision: PostgreSQL 18 baseline with Drizzle/node-postgres, reviewed ordered SQL migrations and explicit database constraints/permissions. Separate migration/runtime/auth adapter connections.

Alternatives: Prisma is a valid ORM but this plan favors visible SQL and direct control of composite/RLS/triggers; changing ORM is possible through an updated compatibility ADR. Document database requires more application-only relationship consistency. SQLite is inadequate for proving production PostgreSQL isolation.

Consequences: strong relational barriers and transactional services; RLS/custom SQL are maintained deliberately rather than assumed to come from ORM relationships. Adapter schema/version compatibility must be tested.

Verification: empty/upgrade migrations, actual runtime-role RLS tests, composite FK violation fixtures, representative query plans. [Database](../docs/06-DATABASE.md) and [technology](../docs/20-TECHNOLOGY-DECISIONS.md).
