# Package Status

Updated: 2026-10-03 · Design baseline v0.1

Multilingual refinement: complete Persian/English UI, authentication messages, emails, notifications and report labels are now P0. The previous English-first/translation-later assumption is removed. Locale persistence, RTL/LTR, independent content language and frozen report locale are defined across UX, database/API, reporting and test/phase gates.

## Complete in this deliverable

- Original Master/Addendum copied unchanged under stable package names.
- MVP scope carried forward with explicit 24 P0 capabilities and 17 acceptance scenarios.
- All 20 Master §120 pre-code outputs mapped in docs/INDEX.
- 24 detailed design documents, 13 ADRs, portable JSON Schema and structured/loose/nontechnical examples.
- Repository structure, development gates, security/operations plan and implementation handoff.
- Static document/link/schema/example validation results are included in VALIDATION.md after checking.

## Foundation implementation

Phase 1 is implemented on `develop`: verified auth/recovery, personal/organization workspaces, fixed memberships, secure invitations, explicit manager relationships, migrations/RLS, encrypted SMTP worker and complete fa/en Foundation surfaces. Four unit, seven PostgreSQL integration and two Chromium tests passed in CI; see [implementation and evidence](docs/FOUNDATION.md).

## Content implementation

Phase 2 Content is implemented and validated: bilingual visual drafts, strict canonical validator, reviewed structured/ordinary imports, source provenance, CAS/idempotency, immutable publication, private attachments, ZIP export and atomic personal start. All 11 unit, 15 PostgreSQL integration and 4 Chromium tests pass; actual container persistence passes. See [Content evidence and boundaries](docs/CONTENT.md) and [ADR-013](adr/ADR-013-phase2-bounded-local-content.md).

## Visual system checkpoint

The shared fa/en visual system is implemented between Phases 2 and 3: self-hosted Inter/Vazirmatn, SVG identity, responsive workspace navigation, consistent forms/cards, truthful empty/loading states and safe keyboard-accessible confirmation dialogs. Validation now covers 11 unit, 15 PostgreSQL integration and 5 Chromium tests, including automated accessibility scans and desktop/mobile screenshots. See [visual system and evidence](docs/DESIGN.md).

## Windows startup optimization

The Windows launcher now opens an unchanged healthy stack immediately, starts stopped images without build/pull, and builds on source changes or missing images. A precompiled local server replaces development compilation; dependency layers and the pnpm store are cached separately. PowerShell startup decisions and actual container cold/repeated/stopped/update flows passed, along with all 32 application tests. See [Windows setup and evidence](docs/WINDOWS.md).

## Deliberately not claimed

Progress, evidence/review workflows, reports, AI, runtime load/restore testing and production deployment are not implemented. The minimal enrollment record supports personal start/version pinning only. Planning examples are fixtures, not a mocked live product. Full Windows desktop installation still requires an actual PC check.

## Design clarifications relative to the first MVP document

The source MVP is preserved as the preceding baseline. Detailed docs specify: one Enrollment entity instead of competing assignment/progress models; typed canonical node matrix; task-bearing lesson aggregation; actual version/tenant composite constraints; exact historical-as-of reporting; runtime session cache disabled; auth proxy downloads for next-request revocation; token delivery storage separated from general outbox.

Where a detailed rule narrows an ambiguous first-scope statement, use the linked detailed contract. The required/optional example and any cross-document contradictions found during checks are corrected in the package's MVP copy with a note; the earlier standalone user file is not overwritten.

## Next step

Foundation and Content gates passed. Phase 3 Learning can start when requested. Contingent infrastructure/provider choices are enumerated with an owner/gate in docs/24 and ADR-013.
