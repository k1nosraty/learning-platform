# ADR-013 — Bounded content operations and private local storage

Status: accepted implementation refinement · 2026-10-03

Context: Phase 2 needs genuine Markdown/ZIP import, reviewed confirmation, private assets and portable export on the existing Windows one-click stack. Evidence, PDF, distributed hosting and AI processing are later slices.

Decision: deterministic import previews and version exports execute synchronously under the documented byte/node/archive limits. Confirmation alone creates a schema/domain-valid private draft. Publication and personal start remain one PostgreSQL transaction with audit and durable outbox intent. No background job is falsely reported as complete.

The `ContentStorage` adapter currently uses a private directory/mounted volume with opaque UUID keys and immutable database bindings. `CONTENT_STORAGE_DIR` selects the mount; Windows compose supplies a named volume. Downloads resolve a currently authorized snapshot binding and proxy bytes with no-store. Originals are private; learners never receive raw imports. PNG/JPEG/WebP/PDF are detected and bounded; remote images are displayed as links and never automatically fetched. A failed transaction may leave an unbound opaque object, but no path/version or public URL.

This supersedes only ADR-010's **development import storage and deterministic Phase 2 job execution** choice. Private S3-compatible storage, a durable dispatcher and scheduled retention/orphan reconciliation remain requirements for distributed hosting/evidence/report phases. Shared private storage is required for multiple application processes. Publication outbox records remain undispatched until consumers exist.

Consequences: Windows gains no new system prerequisites. Source API access expires after 30 days; physical cleanup is a deployment gate, not implemented scheduling. Never delete an asset bound to a sealed version when purging an expired original. Back up DB, content volume and configuration coherently. Quotas, cleanup, S3 adapter/restore tests and crash recovery are required before a public pilot.

Alternatives: database bytea adds backup pressure; public URLs weaken revocation; requiring a cloud/S3 account prevents immediate Windows use; processing unbounded archives inline is rejected.

Verification: round-trip fixtures, actual private-file read/export, revoked/invisible downloads, byte/MIME/path/ZIP/YAML rejection, rollback, persisted container assets, sealed versions and PostgreSQL/Chromium journeys. See [Content implementation](../docs/CONTENT.md).
