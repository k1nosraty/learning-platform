# Document Map and Architecture Coverage

All documents are design requirements, dated 2026-10-02. They do not certify implemented behavior. See [package status](../PACKAGE_STATUS.md).

| File | Main question |
| --- | --- |
| [01-PRODUCT-VISION.md](01-PRODUCT-VISION.md) | Who benefits and what problem does the product solve? |
| [02-USER-STORIES.md](02-USER-STORIES.md) | What must users accomplish and how is success observed? |
| [03-MVP-SCOPE.md](03-MVP-SCOPE.md) | What ships now, what waits, and what gates release? |
| [04-DOMAIN-MODEL.md](04-DOMAIN-MODEL.md) | What entities, relationships and invariants exist? |
| [05-ARCHITECTURE.md](05-ARCHITECTURE.md) | What modules and runtime boundaries implement them? |
| [06-DATABASE.md](06-DATABASE.md) | What relational design and constraints protect integrity? |
| [07-PERMISSIONS.md](07-PERMISSIONS.md) | Who may do what to which object? |
| [08-CONTENT-MODEL.md](08-CONTENT-MODEL.md) | What is the canonical content representation? |
| [09-MARKDOWN-SPEC.md](09-MARKDOWN-SPEC.md) | How does content round-trip without the SaaS? |
| [10-PROGRESS-ENGINE.md](10-PROGRESS-ENGINE.md) | What exactly counts as completion? |
| [11-REPORTING.md](11-REPORTING.md) | How do factual web and PDF reports agree? |
| [12-AI-SYSTEM.md](12-AI-SYSTEM.md) | How does optional AI produce reviewable drafts? |
| [13-SECURITY.md](13-SECURITY.md) | What threats and controls protect users and tenants? |
| [14-UI-UX.md](14-UI-UX.md) | How do users finish the two core journeys simply? |
| [15-MULTI-TENANCY.md](15-MULTI-TENANCY.md) | How is workspace isolation enforced across every surface? |
| [16-VERSIONING.md](16-VERSIONING.md) | How do edits preserve historical learning? |
| [17-API-CONTRACTS.md](17-API-CONTRACTS.md) | What commands, query shapes and errors cross the boundary? |
| [18-FILE-STORAGE-AND-JOBS.md](18-FILE-STORAGE-AND-JOBS.md) | How are uploads and asynchronous effects reliable? |
| [19-REPOSITORY-STRUCTURE.md](19-REPOSITORY-STRUCTURE.md) | Where will code, tests and infrastructure belong? |
| [20-TECHNOLOGY-DECISIONS.md](20-TECHNOLOGY-DECISIONS.md) | Why this stack and what compatibility must be checked? |
| [21-DEVELOPMENT-ROADMAP.md](21-DEVELOPMENT-ROADMAP.md) | In what sequence is usable software built? |
| [22-TEST-STRATEGY.md](22-TEST-STRATEGY.md) | What evidence proves critical workflows and safety? |
| [23-DEVELOPMENT-AND-DEPLOYMENT.md](23-DEVELOPMENT-AND-DEPLOYMENT.md) | How will local setup, deployment and recovery work? |
| [24-RISKS-AND-OPEN-DECISIONS.md](24-RISKS-AND-OPEN-DECISIONS.md) | What remains contingent and how is it resolved? |

## Master §120 coverage

| Required pre-code output | Location |
| --- | --- |
| Product requirements analysis | 01, 02, 03 |
| Domain model | 04 |
| Roles and permission matrix | 07 |
| Multi-tenant strategy | 15 and ADR-003 |
| System architecture | 05 |
| Database ERD | 06 |
| Content model | 08 and schemas |
| Markdown specification | 09 and examples |
| Path versioning strategy | 16 and ADR-004 |
| Progress strategy | 10 and ADR-006 |
| Report architecture | 11 and ADR-007 |
| File storage architecture | 18 and ADR-010 |
| Security threat analysis | 13 |
| API architecture | 17 and ADR-011 |
| Proposed repository structure | 19 |
| Technology decisions | 20 and ADRs |
| MVP scope | 03 |
| Development roadmap | 21 |
| Major risks | 24 |
| Architecture Decision Records | adr/ |

Normative contract precedence within this package: permission rules → domain invariants → canonical schema/content rules → versioning/progress/reporting rules → transport/UI details. The schema validates shape; cross-record/domain validity still requires the documented validator. Original source files are not executable schema definitions.
