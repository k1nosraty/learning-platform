# ADR-006 — Explicit Required Units and Event History

Status: proposed · 2026-10-02

Context: lesson averages, implicit read tracking and pending approvals can produce misleading percentages. Optional content must not block completion.

Decision: equal-weight required units, exact numerator/denominator, self or approval rules and task-bearing lesson aggregation without duplicate credit. Current UnitState is projected from immutable transitions; completion cycles capture reopen/re-complete.

Alternatives: time-based progress encourages attention claims; weighted scores require product rules not needed yet; storing only percentage cannot reproduce historical status; full event-sourced application is unnecessary.

Consequences: deterministic understandable completion, no claim of skill certification; authors must choose explicit trackable requirements. Zero-required publication is invalid and optional-only subtrees are labelled reference/optional.

Verification: mixed required/optional/pending cases, reopen cycles, duplicates, concurrent review, fixed-version denominator and historical replay. [Progress](../docs/10-PROGRESS-ENGINE.md).
