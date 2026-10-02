# Technology Decisions and Compatibility Gate

Checked against primary documentation on 2026-10-02. These are proposed implementation choices, not installed/tested dependencies. Exact versions and reproducible lockfile are recorded during Foundation after compatibility checks; do not blindly install “latest” midway through a phase.

| Area | Baseline | Reason / tradeoff |
| --- | --- | --- |
| Runtime | Node.js 24 LTS, pinned compatible patch | Supported LTS rather than current non-LTS; native worker/PDF support |
| Web | Stable supported Next.js + React + TypeScript | UI/API composition and server rendering; services kept framework-independent |
| Package manager | pnpm, pinned version | Two apps/shared packages and reproducible dependency resolution |
| UI | Tailwind CSS + accessible primitives | Consistent styling; primitives do not replace keyboard/accessibility QA |
| Localization | Server/client-compatible translation catalogs, complete fa/en, locale-aware formatters | Stable keys and locale route resolution; pinned framework-compatible i18n adapter selected in Foundation |
| Database | PostgreSQL 18, supported current minor | Transactions, composite integrity, RLS and relational reporting |
| SQL/ORM | Drizzle with node-postgres | SQL-visible schema/migrations; explicit RLS/triggers where ORM cannot express them |
| Identity | Better Auth + Drizzle adapter | Verification/recovery/database sessions; business memberships remain application-owned |
| Validation | JSON Schema 2020-12 canonical contract; runtime validator supporting it; Zod transport schemas | Portable shared draft contract; prevent divergence through parity fixtures |
| Content | unified/remark/rehype + sanitizer, safe YAML parser, bounded ZIP library | AST-based parsing rather than regex-only Markdown rewriting |
| Durable jobs | pg-boss + application transactional outbox | PostgreSQL dependency already present; no Redis requirement; idempotent effects still required |
| Blob | S3-compatible adapter; local compatible service in dev | Vendor-independent interface; private authenticated downloads |
| Email | SMTP adapter/dev inbox; managed transactional SMTP in pilot | Real verification/invitations; vendor selected at deployment |
| PDF | Playwright Chromium worker + bundled licensed fonts | Shared print HTML and multilingual rendering; heavier worker image |
| Tests | TypeScript unit runner (Vitest baseline), PostgreSQL integration, Playwright E2E | Layered evidence for domain and browser workflows |
| Hosting | Docker-compatible web/worker/PostgreSQL/private blob environment | No specific public hosting account/provider selected |

## Identity detail

Better Auth supplies identity/session tables. Do not also enable its organization plugin to create a second competing Membership/Organization model in MVP. Workspace and organization permissions are domain entities maintained by the application. If later adopting a plugin, migrate deliberately with ADR rather than duplicate authority. Disable session cookie caching and configure reset session revocation explicitly; application checks membership independently.

## Compatibility checks before code foundation is accepted

Verify chosen Next/React/Node versions, Better Auth/Drizzle schema generation and PostgreSQL connection behavior, JSON Schema validator dialect, pg-boss Node/PostgreSQL support and queue migration permissions, Playwright browser/system dependencies, PDF fonts and ZIP/YAML safety options. Pin exact versions/containers and capture an actual minimal verification/recovery/session-revocation test. If an adapter fails, choose alternative with updated ADR and affected docs; do not hide the mismatch behind mocks.

Database choice stays PostgreSQL. Use explicit SQL for RLS, composite constraints, immutability and grants. Runtime permissions are verified against migrations; an ORM's relation definitions alone are not database foreign-key enforcement.

## Primary references

- [Node release policy/status](https://nodejs.org/en/about/previous-releases): Node 24 is shown as LTS at this design check; recheck patch/support at implementation.
- [PostgreSQL version policy](https://www.postgresql.org/support/versioning/): choose a supported major/current minor.
- [Next authentication](https://nextjs.org/docs/app/guides/authentication) and [data security](https://nextjs.org/docs/app/guides/data-security): authorize each entry point.
- [Next internationalization guidance](https://nextjs.org/docs/app/guides/internationalization): reference for locale routing and dictionaries; complete fa/en and persistence behavior are application requirements.
- [Better Auth email/password](https://better-auth.com/docs/authentication/email-password), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [session management](https://better-auth.com/docs/concepts/session-management).
- [Drizzle constraints](https://orm.drizzle.team/docs/indexes-constraints) and [transactions](https://orm.drizzle.team/docs/transactions).
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) and [constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).
- [pg-boss official repository](https://github.com/timgit/pg-boss): PostgreSQL-backed job processing; application outbox design is our decision.
- [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize) and [Playwright PDF](https://playwright.dev/docs/api/class-page#page-pdf).

References support library capabilities, not a claim that our planned integration already works. ADRs record design tradeoffs independent of library marketing guarantees.
