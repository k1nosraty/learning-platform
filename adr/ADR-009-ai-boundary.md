# ADR-009 — Optional Bounded AI Conversion

Status: proposed · 2026-10-02

Context: plain README interpretation is a defining convenience, but provider availability, cost and privacy cannot become a dependency of learning/progress/reporting.

Decision: one real configurable adapter for existing README/text interpretation, validated canonical output, source provenance, disclosure/budget limits and explicit human confirmation/publish. Deterministic extraction/manual editing are available without AI.

Alternatives: autonomous agents or mandatory AI can mutate official content and raise failure/cost risks; postponing all intelligent import would omit the user's key use case. Multiple providers and conversational editing exceed MVP need.

Consequences: M2 must prove a real-provider run, while M1 is usable offline from AI. Unsupported or unavailable AI is clearly labeled. No notes/evidence/credentials or unrelated workspace content are sent.

Verification: real synthetic README conversion, malformed output, injection/failure/budget/revocation fixtures, provenance/coverage and no automatic publishing. [AI system](../docs/12-AI-SYSTEM.md).
