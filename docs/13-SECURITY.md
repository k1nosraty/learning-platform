# Security Threat Model and Controls

This is an engineering threat analysis, not a legal compliance certification. Trust boundaries: browser→web, web→database, runtime→private storage, worker→email/AI, renderer→HTML/assets, and human account→workspace membership.

## Assets and adversaries

Protect identity/session credentials, organization training, learner evidence/progress, private notes, imported source, reports and audit history. Consider unauthenticated abuse, a malicious member, another tenant, a compromised browser session, malicious imported files, prompt injection and misconfigured runtime privileges.

| Threat | Control | Required test |
| --- | --- | --- |
| IDOR / cross-tenant substitution | TenantContext, composite FKs, RLS, scoped lookups | A07; raw database and API tests |
| Same-tenant privilege escalation | Central capability + manager/reviewer relationship checks | A08, A16; owner/manager grant boundaries |
| Stale removed user/session | Database-backed sessions, active membership every request, no cookie session cache | Revoked sessions and worker requester |
| CSRF/session theft | Auth solution protections, trusted origins, secure HttpOnly cookies, same-site rules and mutation origin checks | Cross-origin mutation rejected |
| Markdown XSS / malicious links | No MDX/raw HTML execution, sanitization allowlist, safe schemes, CSP | Script/event handlers/data/javascript URLs blocked |
| SQL injection | Parameterized repositories and no arbitrary query interfaces | Hostile fields stay values |
| Unsafe ZIP / decompression | Canonical path containment, no links/nested archives, entry/byte/ratio bounds | Traversal/duplicate-path/ZIP-bomb fixtures |
| File bypass / content spoofing | Detected MIME + extension + purpose + size, private object binding | A14; authorized parent checks |
| PDF renderer SSRF | Snapshot-only HTML, external network blocked, authorized local assets, resource limits | Submitted internal/metadata URL never fetched |
| Prompt injection / unwanted publish | Provider has no tools; schema/domain validation; human confirmation | Malformed/instruction-bearing source cannot mutate live content |
| Race/duplicate effects | Locks, CAS, idempotency keys, uniqueness, transactional outbox | A15; double publish/review/confirm |
| Logging/privacy leak | Field allowlists and redaction; no note/source/token bodies | Inspect structured logs and export/report DTOs |
| Privileged database bypass | Non-owner runtime roles, FORCE RLS, separate migration/auth roles | Runtime grants/catalog check |
| Brute force/resource abuse | Auth rate limits plus per-user/workspace import/upload/job limits | Repeated attempts return safe 429 |

## Authentication baseline

Use Better Auth for email/password, verification, recovery and database sessions. Configure explicit trusted origin; production TLS; secure/HttpOnly cookies; no broad cross-subdomain cookies; revoke other sessions after password reset; disable cookie session caching. Avoid custom password hashing/token issuance. Confirm exact pinned APIs in Foundation. Email delivery must be real in pilot and a local inbox in development.

Apply auth-provider rate limiting and application limits. Initial policy: import confirms 20/minute/requester; uploads 20/minute/requester and 100 MiB/hour/workspace; PDF/export generation 10/hour/requester; AI limits per [AI System](12-AI-SYSTEM.md). These are tunable safety defaults, not billing plans. Responses avoid email/account existence leakage.

## Content/rendering

Markdown pipeline parses Markdown/GFM, converts to HTML AST, sanitizes with explicit allowlist, and renders without executing author code. No raw HTML, script, iframe, inline event/style attributes or SVG uploads in MVP. Syntax highlighting must not introduce unsafe HTML after sanitization without a trusted transformation. Rehype's maintainers warn that incorrect sanitizer use can reopen XSS; see [official sanitizer guidance](https://github.com/rehypejs/rehype-sanitize).

Links are HTTPS or safe internal references. External link target uses safe rel attributes. Remote images are not automatically loaded from confidential reports/import previews; offer reference links or user-approved content rendering policy. CSP disallows inline script beyond framework nonce strategy, forbids unauthorized frame embedding and limits resource origins. Do not rely on CSP alone.

## Retention and privacy baseline

Accepted evidence and published content remain while the workspace exists unless a controlled deletion policy applies. Raw import sources/proposals expire after 30 days by default; user can choose not to retain original bytes after confirmation. Keep source hash/mapping and disclosure of retention limitations. Unconfirmed uploads expire after 24 hours; failed partial outputs are cleaned after 7 days. Operational logs retain 30 days, essential organization audit 365 days; backups retain 30 days. These are proposed configurable pilot defaults, to be checked against actual organizational/legal obligations before a public commercial launch.

Notes stay owner-only. Data minimization applies to report feedback/evidence descriptions. Organization ownership of training does not imply unrestricted access to private notes. Export/erasure requests go through an authorized documented operator process in MVP; do not promise self-service full organization export or immediate deletion from immutable backups.

Storage/DB use encrypted transport and deployment-managed encryption at rest; secret values are injected by environment/secret manager and never committed. Report/evidence proxy responses use no-store and current authorization. Signed direct URLs are not default because they create a revocation window. Malware scanning is an extension point; v1 accepts only bounded non-executable types and never executes evidence.

## Release security gate

Run tenant/role/session tests, malicious Markdown/ZIP/upload fixtures, renderer network denial, provider disclosure/failure handling, dependency vulnerability review and backup restore. Security regressions block release regardless of UI completion. Resolve critical/high exploitable issues before pilot; document residual risks without calling them completed fixes.
