# Package Status

Date: 2026-10-02 · Design baseline v0.1

Multilingual refinement: complete Persian/English UI, authentication messages, emails, notifications and report labels are now P0. The previous English-first/translation-later assumption is removed. Locale persistence, RTL/LTR, independent content language and frozen report locale are defined across UX, database/API, reporting and test/phase gates.

## Complete in this deliverable

- Original Master/Addendum copied unchanged under stable package names.
- MVP scope carried forward with explicit 24 P0 capabilities and 17 acceptance scenarios.
- All 20 Master §120 pre-code outputs mapped in docs/INDEX.
- 24 detailed design documents, 12 ADRs, portable JSON Schema and structured/loose/nontechnical examples.
- Repository structure, development gates, security/operations plan and implementation handoff.
- Static document/link/schema/example validation results are included in VALIDATION.md after checking.

## Deliberately not claimed

Phase 1 source and executable migrations now exist on `develop`; see docs/FOUNDATION.md for validation status. Content/progress/reviews/reports/AI, runtime load/restore testing and production deployment are not implemented. Planning examples are fixtures, not a mocked live product. Proposed runtime/dependency versions and providers must pass the specified phase gates.

## Design clarifications relative to the first MVP document

The source MVP is preserved as the preceding baseline. Detailed docs specify: one Enrollment entity instead of competing assignment/progress models; typed canonical node matrix; task-bearing lesson aggregation; actual version/tenant composite constraints; exact historical-as-of reporting; runtime session cache disabled; auth proxy downloads for next-request revocation; token delivery storage separated from general outbox.

Where a detailed rule narrows an ambiguous first-scope statement, use the linked detailed contract. The required/optional example and any cross-document contradictions found during checks are corrected in the package's MVP copy with a note; the earlier standalone user file is not overwritten.

## Next step

Complete the Foundation validation gate before beginning Phase 2. Contingent infrastructure/provider choices are enumerated with an owner/gate in docs/24.
