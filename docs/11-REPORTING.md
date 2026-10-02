# Reporting Architecture

## Contract

Input: authorized requester, workspace/enrollment ID, local date interval, IANA timezone. Output: one `LearnerEnrollmentReport` immutable model, rendered on web/print/PDF. Report schemaVersion `1.0` and progress ruleVersion `1.0` are stored with the snapshot. Reporting functions never use AI.

Report locale fa/en is an explicit input defaulting to requester's saved preference. Snapshot freezes report_locale alongside factual model/hash and render metadata. Both locales translate headings/status/date/duration labels; learner-authored content remains in its original language/direction. Web/print/PDF for a stored report use its frozen locale even if the viewer later changes interface language. Locale is separate from report timezone and never changes totals.

Model includes report ID, generated_at/cutoff, period instants/timezone, workspace name/logo, learner display name, path identity/title/version, required/optional unit counts, exact progress fraction, unit status breakdown, project attempts and review decisions/feedback, completion cycles/deadline status, recorded study time and selected activity. Exclude private notes, credential data and unrelated learner content.

## Time semantics

Period is start-inclusive/end-exclusive. An inclusive UI end date resolves to next local midnight, handling DST through the timezone library. Cutoff is min(period_end,generation_time). Activity is inside the period and no later than cutoff. Progress is cumulative at cutoff. Session contribution is interval overlap with `[period_start,cutoff)`, using latest session revision recorded by cutoff.

Historical-as-of means facts must have been recorded by cutoff. A late-recorded backdated session or review cannot appear in an earlier as-of report. Explain this explicitly; future “retrospective corrected period” report semantics would be a different report type. Deadline/manager/reviewer state comes from latest enrollment_change at cutoff. Optional work remains distinct from required completion; pending review is never completion.

## Snapshot generation

Authenticate and scope enrollment. Lock enrollment and take a consistent transaction snapshot; read pinned version, ordered events, applicable administrative/session revisions and visible evidence. Build and validate model; insert model JSON, schema/rule versions and deterministic hash, plus PDF JobRun/outbox atomically. Report request uses idempotency key tied to exact input. Newly recorded facts after snapshot cannot enter that report.

Study-session mutations lock learner membership and enrollment; reporting locks enrollment first and uses snapshot isolation. Enforce one consistent lock order across implementations (membership if needed, then enrollment, then unit/attempt). A technical Foundation test must verify snapshot/locking behavior before reporting implementation. Do not use client timestamps for authoritative events.

## Renderers

Web renders model with reusable report components, distinct from dashboards. Dedicated print stylesheet hides navigation, respects page breaks, repeats table headers and avoids split rows where feasible. PDF worker renders trusted snapshot HTML using pinned Playwright/Chromium and bundled fonts, waits for fonts/images, then generates a real selectable PDF.

The renderer has no arbitrary external browsing. Logo/assets are loaded from authorized stored bytes into controlled local/data references; remote images in training/evidence are not fetched. The renderer receives model facts rather than a public report URL or long-lived auth session. It must not expose an unprotected internal render endpoint.

Playwright documents that `page.pdf()` uses print CSS: [official PDF API](https://playwright.dev/docs/api/class-page#page-pdf). This supports shared web/print templates but does not guarantee layout correctness; visual QA is mandatory.

## Delivery and privacy

State pending→ready/failed is operational metadata; model is never overwritten. Retry produces the same file association for the same snapshot or replaces only the failed incomplete blob, not the facts. PDF download validates current access and serves through authorized proxy by default. Public share links/password/revocation are deferred; no public report URLs exist.

Learner can request own enrollment report. Manager/mentor scope follows [permissions](07-PERMISSIONS.md). Removing membership stops future downloads even if the snapshot was produced earlier. Already downloaded PDFs cannot be revoked; download UI identifies that it contains personal data without adding an unnecessary approval step.

## QA fixtures

Short report, long tables across pages, no activity in period, required+optional counts, awaiting review, revised approval, reopened enrollment, deadline change, late session correction, mixed Persian/English/code, DST boundary and inaccessible file. Check model hash, exact counts, PDF selectable text, font support and visually inspect rendered pages. Report UI shows real factual totals; no dummy charts or fabricated “skill improvement”.
