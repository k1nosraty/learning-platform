# Test Strategy and Acceptance Evidence

This document specifies future tests. The package currently verifies documentation/schema/examples, not application behavior. A01–A17 in [MVP Scope](03-MVP-SCOPE.md) are the release obligations.

## Layers

| Layer | Critical assertions |
| --- | --- |
| Pure domain | Canonical parent/completion matrix; unit derivation; percentages/cycles; state transitions; interval/cutoff arithmetic |
| Contract | Strict request/response shapes; schema dialect; transport/canonical parity; stable errors |
| PostgreSQL | Composite tenant/version FKs, sealed versions, runtime grants/RLS, private ownership, uniqueness and CAS |
| Services | Actor scope, atomic publish/review/report, idempotency, outbox intent, requester revocation |
| Storage/jobs | MIME/purpose/size/binding, proxy auth, retry/dedupe, orphan safety, renderer network block |
| E2E | Real onboarding/invite/assignment/read/submit/revise/approve/PDF/export flows |
| Visual/accessibility | Mixed RTL/LTR, long PDF tables/fonts, keyboard builder/review and mobile learning |
| Localization | fa/en catalog-key/placeholder parity; locale resolution/persistence; auth/emails/errors/notifications/report labels; RTL/LTR layout; locale change preserves unsaved work |

Use real PostgreSQL in integration tests; SQLite cannot prove PostgreSQL RLS/constraints. Tests run with the non-owner runtime role except explicit migration setup. Email routes to a development inbox; inspect actual links and consume them as actors. File adapter uses an actual compatible service for contract tests and synthetic deterministic failures where appropriate.

## Fixture inventory

Use structured sample path and nontechnical onboarding, ordinary English/Persian README, duplicate IDs/orders, illegal hierarchy, zero requirements, unknown metadata, unsafe URLs/HTML, bad encoding, ZIP traversal/symlink/duplicate paths/decompression abuse, stale revisions, cross-version units, approval races, overlapping sessions and DST periods. The supplied examples cover healthy content; malicious fixtures are added with the corresponding implementation tests.

## Critical race tests

Concurrent publish with same revision yields one result/conflict; repeated import confirmation yields one path; duplicate enrollment yields existing/conflict without second progress record; two reviewers cannot both write a terminal decision; stale attempt cannot receive approval; duplicate completion creates one event; report snapshot excludes later changes; pooled connection cannot retain preceding tenant context.

Use barriers/transaction control, not unreliable sleep-based races. Fault injection rolls back mid-publish/review, fails outbox dispatcher after enqueue, kills worker before file association and simulates ambiguous email acceptance. Domain records remain correct regardless of queue retry.

## Reporting tests

Check exact fractions and period semantics before formatting. Golden model fixtures cover pending approval, optional work, reopened cycles, deadline change, late backdated session and correction/delete revisions. Render actual PDFs; extract text for key counts and visually inspect page PNGs for clipping, table headers, logo/fonts and direction. No broad pixel snapshots as a substitute for factual assertions.

## AI tests

Controlled adapter fixtures cover valid/malformed/unsupported output, injection attempts, timeout/budget/rate limit and source omissions. Schema validators reject invalid proposals before save. A separate recorded real-provider acceptance run proves M2 capability with synthetic/nonconfidential content; CI does not require exact stochastic text or secrets. Assert no provider calls on ordinary learning/report requests.

## Gates and reporting

Run the personal and organization core journeys in both Persian and English, including login/recovery/invitation emails and PDF labels. Assert locale switching never changes domain IDs/progress/content, timezone or historical report locale. Unsupported locales fall back safely; missing required translation keys fail build/CI. Test pre-login selector, saved preference precedence, account-only preference authorization, localized page routes and unprefixed auth/API routes.

Each phase records test/lint/typecheck/build/migration commands with actual pass/fail. Release matrix maps US stories and MVP IDs to automated test names and manual QA evidence; missing evidence remains incomplete. Do not claim security from UI visibility or judge quality solely by line coverage. Pilot load test publishes workload/hardware/concurrency/p95 and error rates. Restore rehearsal verifies DB and object referential consistency.

Document tests and application tests are separate evidence categories. Package schema checks passing today do not imply the future parser or runtime is implemented.
