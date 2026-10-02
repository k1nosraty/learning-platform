# ADR-010 — Private Files and Reliable Side Effects

Status: proposed · 2026-10-02

Context: evidence and reports are confidential, and database commit must not depend on an email/PDF/AI request succeeding.

Decision: S3-compatible private adapter and authorization-proxy downloads; transactional outbox with pg-boss workers; unique dedupe/result bindings and idempotent handlers. Tokens needing delivery use isolated encrypted short-lived payload, never general log/outbox plaintext.

Alternatives: public blob URLs leak records; signed URLs alone impose a revocation window; request-inline processing fails on slow jobs; Redis queue adds another dependency; queue delivery guarantees do not establish exactly-once external effects.

Consequences: private access/revocation and recoverable work, at cost of proxy bandwidth and outbox/reconciliation code. Ambiguous email acceptance can duplicate delivery; domain progress remains idempotent.

Verification: file purpose/binding/MIME/size, revoked downloads/jobs, worker crashes/retries, orphan safety and coherent restore. [Storage/jobs](../docs/18-FILE-STORAGE-AND-JOBS.md).
