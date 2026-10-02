# ADR-003 — Workspace Isolation

Status: proposed · 2026-10-02

Context: users can learn personally and join multiple organizations. Tenant data must never cross scope, and membership alone does not authorize all learner records.

Decision: Workspace is tenant root for both types. Shared schema carries workspace IDs; composite FKs prevent cross-tenant/version references; FORCE RLS on tenant tables checks transaction-local context. Services enforce active membership/capability/object relationship; private notes add owner policy.

Alternatives: organization-only tenancy makes personal use awkward; separate apps duplicate engines; database/schema per tenant increases migration/operations cost before enterprise requirements. Application filters alone lack an independent database barrier.

Consequences: one engine and manageable operations; pooling/context/privileged-role mistakes are critical risks. RLS is explicitly tenant defense, not automatic complete mentor authorization.

Verification: non-owner runtime SELECT/write tests, missing/wrong context, pool reuse, job/report/file scope and relationship denials. [Multi-tenancy](../docs/15-MULTI-TENANCY.md).
