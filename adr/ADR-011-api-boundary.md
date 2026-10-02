# ADR-011 — REST and Shared Application Services

Status: proposed · 2026-10-02

Context: web UI and future mobile/integrations need reusable business behavior. Framework actions and hidden buttons cannot be authorization authorities.

Decision: versioned REST contracts and strict runtime validation over shared authorized application services. Thin Server Actions may reuse services; mutating commands use idempotency/preconditions and explicit transitions. No public integration tokens are added in MVP.

Alternatives: UI-only Server Actions tightly couple future clients; duplicating REST/UI domain logic drifts; generic CRUD permits illegal sealed-version/review mutations. Typed RPC is viable but REST offers straightforward external contracts.

Consequences: explicit DTO/error map and some transport plumbing, while domain remains portable. Current cookie auth supports web; future native token flow requires a separate security contract.

Verification: transport/service parity, strict schemas, cross-tenant API tests, CAS/idempotency/error contracts and no credential leakage. [API](../docs/17-API-CONTRACTS.md).
