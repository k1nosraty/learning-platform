# Implementation Handoff

Use this file when the user explicitly asks to begin coding. Preparation of this package alone does not start application implementation or public deployment.

## Instruction for the coding agent

Read README, docs/INDEX, MVP scope, Domain/Content/Markdown contracts, Permissions/Multi-tenancy/Security, Database/Versioning/Progress/Reporting and ADRs. Follow the gated development roadmap. Treat original MASTER_SPEC and AI_IMPORT_SPEC as long-term vision; do not implement all 151 sections simultaneously.

Start **Phase 1 — Foundation** only. First choose/pin a compatible supported runtime/dependency set using current primary documentation. Resolve contingent Foundation choices from docs/24. Create the real workspace/code/infrastructure described in docs/19, implement identity/workspaces/membership/relationships/invitations and centralized permissions, then prove tenant/session boundaries with actual PostgreSQL runtime roles.

Do not rewrite the entire architecture merely because a preferred library differs. If a decision materially changes, record an ADR and update affected contracts/tests. Do not ask the user to decide routine adapter/implementation details when requirements already constrain a sound choice.

Implement small vertical slices; after each phase run relevant tests, lint, typecheck, build, clean database migrations and real-flow checks. Repair a broken foundation before continuing. Record actual evidence and update docs to match software. Domain logic belongs in shared services, not React components.

Never treat demo fixtures, placeholder dashboards, disabled buttons or mocked auth/email/PDF/AI as production functionality. Do not claim intelligent import without a real provider acceptance run. Do not silently publish AI content or migrate historical enrollments. Keep personal learning independent of organization/mentor setup.

## Required first review artifact

Report exact dependency versions, actual setup commands, implemented Phase 1 behavior, relevant test/build results, any unresolved limitation and what Phase 2 will deliver. A user should be able to register/verify, enter a personal workspace, create an organization and perform scoped membership/invitation operations with persisted data.

## Before any public launch

Finish requested implementation scope and concrete checks first. Then use the user's actual hosting/publishing instruction. This package does not select a cloud account, create credentials or grant publishing authorization. No permission prompt is needed for routine local docs/code work already authorized by an implementation request.


## Current implementation

Phase 1 Foundation is implemented on `develop`. Read [Foundation setup and evidence](docs/FOUNDATION.md) before proceeding. This original handoff remains the initial scope/invariants; the next slice is Phase 2 Content engine.
