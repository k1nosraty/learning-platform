# ADR-008 — Identity Provider and Separate Business Membership

Status: proposed · 2026-10-02

Context: insecure custom credential/session code is avoidable. Organization plugin entities could conflict with the personal/organization workspace domain.

Decision: Better Auth with Drizzle adapter for identity/email verification/recovery/database sessions. Application owns Workspace/Membership/relationships. Disable cookie session caching and configure reset revocation explicitly; per-request active membership checks remain mandatory.

Alternatives: custom auth adds unnecessary attack surface; organization plugin would need deliberate adaptation to avoid dual membership authority; hosted identity provider is viable later if commercial requirements justify it.

Consequences: lower custom security burden but real adapter/email/session compatibility must be verified. Auth tables are global with separate permissions; they do not grant tenant access. Exact dependency/provider deployment is contingent until Foundation.

Verification: real verification/recovery, session revocation, invite matching/expiry, role escalation denials and personal workspace idempotency. [Permissions](../docs/07-PERMISSIONS.md) and [technology](../docs/20-TECHNOLOGY-DECISIONS.md).
