# Architecture Decision Records

Status of all records: **proposed design baseline**, dated 2026-10-02. “Proposed” records a concrete implementation direction with alternatives and verification obligations; it does not require a separate permission prompt to start authorized future implementation.

| Record | Decision |
| --- | --- |
| [ADR-001](ADR-001-modular-monolith.md) | Modular monolith with separate worker |
| [ADR-002](ADR-002-postgresql-drizzle.md) | PostgreSQL/Drizzle and explicit SQL integrity |
| [ADR-003](ADR-003-workspace-isolation.md) | Workspace scope, composite FKs and RLS |
| [ADR-004](ADR-004-immutable-versions.md) | Immutable publications and pinned enrollment |
| [ADR-005](ADR-005-canonical-content.md) | One typed canonical draft and portable Markdown |
| [ADR-006](ADR-006-explicit-progress.md) | Explicit equal-weight completion units and event history |
| [ADR-007](ADR-007-report-snapshots.md) | Shared factual model, fixed snapshot and isolated PDF |
| [ADR-008](ADR-008-authentication.md) | Proven identity solution; business workspaces separate |
| [ADR-009](ADR-009-ai-boundary.md) | Optional bounded real AI import, human publish |
| [ADR-010](ADR-010-files-outbox.md) | Private storage, outbox and idempotent workers |
| [ADR-011](ADR-011-api-boundary.md) | REST boundary over shared application services |
| [ADR-012](ADR-012-mvp-progressive-complexity.md) | Personal simplicity and explicit scope cuts |
| [ADR-013](ADR-013-phase2-bounded-local-content.md) | Accepted bounded synchronous content operations and private local storage refinement |

When changing a decision, record context, alternatives, consequences, affected contracts and verification. Supersede the old decision explicitly; do not delete history. Library/product branding is not a reason to rename domain entities.
