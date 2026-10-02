# ADR-005 — Canonical Typed Draft and Markdown Bridge

Status: proposed · 2026-10-02

Context: UI, structured import and intelligent interpretation must converge without requiring users to learn database IDs/YAML.

Decision: portable flat typed-node JSON Schema 1.0, explicit parent/order/complete-rule fields and shared domain validator. Draft JSON is revision-controlled; publication normalizes snapshot nodes/units. YAML manifest+Markdown body files provide readable round-trip. Provenance sidecar stays separate.

Alternatives: Markdown AST alone does not fully identify tracked activities; arbitrary rich editor JSON can lock content into one UI; one giant untyped data table hides domain constraints; rigid stage/module counts make simple paths cumbersome.

Consequences: bounded supported hierarchy and predictable export; advanced assessments/prerequisites are explicit future formats, not silently accepted. Canonical schema validates shape while service validator handles relationships/completion semantics.

Verification: structured fixtures, schema/domain errors, export/import parity, ordinary README preview with source coverage and unrelated nontechnical content. [Content](../docs/08-CONTENT-MODEL.md) and [Markdown](../docs/09-MARKDOWN-SPEC.md).
