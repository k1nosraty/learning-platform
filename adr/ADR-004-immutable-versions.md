# ADR-004 — Immutable Versions and Enrollment Pinning

Status: proposed · 2026-10-02

Context: editing a path must not change what a learner completed or an employer report represents. Re-import/migration rules are not yet mature.

Decision: mutable revision-controlled draft, sealed immutable publications, stable logical content IDs within a path and enrollment pinning to one version. New participation in another version starts fresh; no automatic migration in MVP.

Alternatives: mutable published rows corrupt historical denominators; deep template inheritance introduces cascading ambiguity; automatic ID/title matching can miscredit changed requirements.

Consequences: reliable history and straightforward reports, at cost of stored snapshots and no automatic carryover. Archived versions remain readable under access rules. Future migration must show explicit mapping/diff and audit transfer rules.

Verification: v1 progress/report unchanged by v2 additions/removals/rule changes; sealed row/child insert guards; concurrent publication/CAS. [Versioning](../docs/16-VERSIONING.md).
