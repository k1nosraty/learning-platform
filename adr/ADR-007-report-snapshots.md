# ADR-007 — Shared Factual Report Snapshot

Status: proposed · 2026-10-02

Context: dashboards/PDF queries often diverge; later content/session/deadline edits can falsify a previously generated report.

Decision: one authorized report model with fixed cutoff and schema/rule versions, immutable snapshot/hash and shared web/print/PDF rendering. Historical-as-of semantics include only facts recorded by cutoff. Chromium worker renders trusted HTML with local assets/fonts and blocked network.

Alternatives: live PDF queries per renderer drift; AI narratives can invent claims; server-side drawing libraries reduce browser dependency but require a separate complex multilingual layout system. Live dashboard remains distinct from a fixed report.

Consequences: reproducible facts and clear period meaning; late recorded corrections require a new report with applicable cutoff and cannot rewrite earlier snapshots. PDF worker increases image/resource cost and needs visual QA.

Verification: model parity, cutoff/timezone/session revisions, long mixed-language PDFs and requester/file authorization. [Reporting](../docs/11-REPORTING.md).
