# Multi-Tenancy Strategy

## Decision and limits

Use one PostgreSQL database/shared schema with explicit workspace scope, composite FKs, PostgreSQL RLS as defense in depth and application relationship checks. Both personal and organization workspaces are tenants. There is no special unscoped “personal data” shortcut.

Global tables are auth identity/session/account/verification only. Application files, drafts, enrollments, imports, reports, notifications, audit and job handles all belong to a workspace. A browser's active-workspace preference is navigation state, never authorization.

The identity user's allowlisted preferred_locale metadata is global, owner-only UI configuration within the identity table, not an unscoped tenant-data table. A localized URL/cookie is presentation input and cannot grant a workspace or role. See UI/UX for supported locale resolution.

## Request context

1. Obtain current database-backed auth session with the auth adapter.
2. Parse requested workspace ID as an untrusted locator.
3. Begin transaction on the application connection.
4. Set transaction-local `app.workspace_id` and `app.user_id` using parameterized configuration calls.
5. Read and verify active membership for the authenticated user in this scope; failure rolls back.
6. Construct a nonserializable TenantContext containing transaction handle, workspace/user/membership and permission helpers.
7. Repositories require this context. Do not expose an unrestricted application pool to UI/routes.
8. Commit/rollback clears transaction-local settings. Never use session-level tenant settings with pooled connections.

RLS does not authenticate the caller: it enforces context selected by trusted server logic. Arbitrary SQL and forged custom settings must not be exposed. All values are parameters and custom settings are established before queries.

## RLS policy specification

Tenant tables enable and force RLS. Workspace policy checks row workspace against the current transaction's workspace UUID for reads and writes; missing context denies access. Workspace table compares its `id`. PrivateNote additionally checks owner_user_id against current actor. Current membership and object relationships are checked in services; tenant-only RLS is not falsely presented as a complete mentor/manager access model.

Migration/table owners, superusers and BYPASSRLS roles must not be used by web/worker runtime. PostgreSQL documents that these roles can bypass RLS and integrity checks have special behavior; see [official row-security guidance](https://www.postgresql.org/docs/current/ddl-rowsecurity.html). Translate constraint errors into safe application codes to avoid cross-tenant information leaks.

Auth adapter schema is outside tenant RLS and has a dedicated limited connection. Background infrastructure queue schema is separate; queue visibility is operational, not a user dashboard. JobRun application records remain tenant-scoped.

## Other isolation surfaces

| Surface | Rule |
| --- | --- |
| Routes and Server Actions | Resolve scope and authorize on every read/mutation |
| Dashboards, list/search filters | Apply tenant and relationship predicates before pagination/counts |
| Private object storage | Bind opaque file IDs to authorized parent; key prefix is organization only, never sufficient auth |
| Jobs | Payload carries workspace and requester; worker reconstructs verified context and target capability |
| PDF/report | Snapshot belongs to authorized enrollment; download rechecks current membership |
| Notifications | Recipient membership and workspace constraints |
| Cache | No cross-tenant shared page/data cache; future keys must include scope/version/capability context |
| Exports | Scoped selection and field allowlist; no global scans |
| Observability | IDs and safe metadata only; no source/notes/session tokens |

A user belonging to two tenants cannot combine a path from one with an enrollment from the other. Composite FK tests must reject these writes even when application logic is intentionally bypassed in the test.

## Verification and evolution

Run integration tests under the actual non-owner runtime role: missing context, wrong context, connection pool reuse, SELECT/INSERT/UPDATE/DELETE, private-note ownership, raw FK mismatch and job requester revocation. Add each new tenant table to a catalog assertion requiring workspace column, RLS and declared policy. Future schema-per-tenant or dedicated enterprise databases would require new routing ADRs; do not build them prematurely.
