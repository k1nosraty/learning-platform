# MVP Scope — Learning Path, Training & Progress Platform

Version: 0.1 · Date: 2026-10-02 · Status: proposed planning baseline

Package refinement note: the detailed Domain/Content/Progress/Reporting documents now refine this earlier scope. Task-bearing lessons have no separate confirmation credit, optional reopening does not reopen a completed path, and historical reports include only facts recorded by cutoff. The original standalone scope file is retained separately.

This document defines the first usable product release. It is a planning deliverable, not a claim that software has been implemented or tested. Scope choices below are proposals derived from the supplied specifications; they are not recorded user approvals.

## 1. Source documents and precedence

Sources:

- **Master Prompt — Commercial Learning Path, Training & Onboarding SaaS.md**: commercial vision, domain integrity, collaboration, reporting, security, and phased delivery.
- **Addendum — Zero-Friction Path Creation & AI-Assisted Import.md**: simple creation, ordinary README import, optional AI, and personal workspaces.

The source documents remain unchanged. This document narrows the first release; a deferred feature remains part of the long-term vision. The Addendum refines the Master Prompt wherever personal use or creation simplicity changes an earlier organization-centric assumption.

For MVP planning, this scope controls release inclusion. Neither it nor later implementation may weaken tenant isolation, historical integrity, human-controlled publishing, or privacy. Architectural details must be resolved in the subsequent domain, content, Markdown, architecture, and security documents before application implementation, as required by Master §120.

## 2. Product promise

A person can turn an existing roadmap into a trackable learning path. A company can create a training program, invite a learner, assign that program, review evidence, and generate a professional progress report through the application UI.

The shared foundation is **Workspace → Learning Path Version → Enrollment → Activity / Evidence → Progress → Report**. “Enrollment” is a provisional domain term for a person's participation in a published version; an organization assignment and personal self-start use the same underlying mechanism. The Domain Model will finalize terminology.

Content is generic. Networking, sales onboarding, and workplace procedures must use the same engine. Completion indicates fulfilled training requirements, not independently proven professional competence.

## 3. Two required journeys

### Personal learning

1. Register and enter a personal workspace automatically.
2. Upload a README, paste existing content, or build a path visually.
3. Review the proposed structure, edit it, and resolve validation errors.
4. Choose **Start learning**, which explicitly publishes the reviewed version and starts personal participation.
5. Read lessons, complete activities, attach project evidence, and record study time.
6. Resume from the dashboard and generate a personal web/PDF report.
7. Export the learning path as readable Markdown.

No company name, team, invitation, second account, or reviewer is required. Personal projects default to self-confirmed completion. Personal users cannot select an approval rule requiring a nonexistent reviewer; that collaboration capability is deferred.

### Organization training

1. Register and create an organization workspace.
2. Create or import a path, inspect the preview, edit it, and publish.
3. Invite a learner and, if needed, a separate mentor.
4. Assign a published path version to that learner, with an optional deadline and designated reviewer.
5. The learner reads content, completes activities, and submits project evidence.
6. The authorized reviewer requests changes or approves the submission.
7. The learner resubmits when necessary; approval updates completion and progress.
8. The learner and authorized manager see the same progress calculation.
9. Either generates the report allowed by their permissions, including a downloadable PDF.

The manager may be the reviewer. Every step must work with real accounts and persisted data without database edits, source-code changes, or seeded workflow outcomes.

## 4. Scope classification

**P0** means required for the complete MVP. **Later** means excluded from its delivery backlog except for documented extension boundaries. M1 and M2 below are delivery milestones, not separate competing scope definitions.

| ID | P0 capability | Deliberate boundary |
| --- | --- | --- |
| MVP-01 | Registration, verification, sign-in/out, recovery, session management | One proven authentication solution; social login and SSO later |
| MVP-02 | Personal and organization workspaces; workspace switching | Shared engines; no teams or cohorts |
| MVP-03 | Memberships and secure invitations | Fixed initial roles; invitations expire and can be revoked |
| MVP-04 | Centralized server-side authorization | Workspace scope plus ownership or assigned relationship on every operation |
| MVP-05 | Visual path builder | Add/edit/reorder/archive content; accessible move controls are sufficient |
| MVP-06 | Canonical draft with Markdown-compatible content | Stage, module, lesson, task/exercise, project, resource; assessments later |
| MVP-07 | Structured Markdown import | Single file, multiple files, and ZIP repository; deterministic parsing |
| MVP-08 | Ordinary README and pasted-content conversion | Reviewable proposed structure; optional real AI adapter; bounded input |
| MVP-09 | Validation and editable preview | Errors block confirmation; source mapping and warnings remain visible |
| MVP-10 | Explicit publishing, archive, immutable versions | Existing participation stays on its assigned version |
| MVP-11 | Whole-path individual assignment and personal self-start | No partial module assignment, bulk/team assignment, or migration between versions |
| MVP-12 | Learning view, next activity, required/optional items | Reading alone never proves completion |
| MVP-13 | Deterministic completion and progress | Self-confirmed or reviewer-approved activities; no scores or weighted rules |
| MVP-14 | Private notes and manually recorded study sessions | No timer, automatic attention tracking, or inferred study duration |
| MVP-15 | Evidence submissions | Text/Markdown, external URLs, private file attachments |
| MVP-16 | Review, changes requested, resubmission, approval | Feedback attached to attempts; no general discussion system |
| MVP-17 | Learner dashboard and scoped manager dashboard | Next work, deadlines, progress, pending reviews; no advanced analytics |
| MVP-18 | Learner activity timeline and essential audit history | Only meaningful events; private note contents excluded |
| MVP-19 | Individual reports on web, print, and PDF | One learner, one enrollment/version, chosen date range |
| MVP-20 | Path export and personal progress export | Markdown repository ZIP and authorized JSON progress export |
| MVP-21 | Essential in-app notifications | Assignment, submission, changes requested, approval; invitation email is also real |
| MVP-22 | Responsive, accessible, fully bilingual UI | Complete Persian (fa, RTL) and English (en, LTR) UI, messages, emails and reports in MVP; additional locales extensible |
| MVP-23 | Private storage, safe import/upload/rendering, reliable jobs | No vendor-specific domain coupling or exposed secrets |
| MVP-24 | Reproducible setup, meaningful automated tests, deployment/runbook | Real runtime dependencies and documented operational limits |

This is intentionally more than a tracker: evidence, review, reporting, and README conversion are the value proposition. Cosmetic features must not displace these workflows.

## 5. Creation experience and AI boundary

### Creation methods shipped

| Input | MVP behavior | Works without AI? |
| --- | --- | --- |
| Visual builder | Direct editing of the canonical draft with readable forms and preview | Yes |
| Structured Markdown / ZIP | Parse the supported format, retain logical IDs, validate references | Yes |
| Ordinary README / pasted Markdown | Deterministic heading/checklist extraction with conservative mappings; optional AI interpretation | Yes, with more manual adjustment |
| Unstructured pasted text | Optional AI interpretation; otherwise retain text in an editable draft and explain that structure needs review | Content preservation yes; semantic conversion requires AI |

Do not label deterministic extraction as AI. A plain text import retained as one editable lesson is a fallback, not proof that intelligent conversion works.

The bounded AI capability is **existing README/text → proposed learning path**. Use one real provider behind a capability interface. Do not implement multiple providers, conversational editing, goal generation, an autonomous agent, lesson generation, or AI reporting in MVP.

The deployed application remains fully usable when AI is unconfigured or unavailable. Display that state clearly and offer extraction/manual editing. A release that has never demonstrated a real AI import must describe that capability as unavailable; mocks establish test behavior only.

### Import acceptance rules

1. Show the selected interpretation method before processing; AI transfer requires an explicit user action and a clear disclosure that source text is sent to the configured provider.
2. Preserve source content, filename/source hash, import time, and mapping to extracted items. Retention of original bytes follows workspace settings; content must not vanish silently during conversion.
3. Distinguish extracted, inferred, and generated fields. Unknown estimates remain unknown or visibly suggested. Resource URLs are not called verified unless an actual verification succeeded.
4. Validate schema, hierarchy, identity uniqueness, references, and completion rules before offering a confirm action.
5. Show the tree, counts, source excerpts, warnings, unassigned source sections, and editable completion requirements. Avoid forcing repetitive item-by-item forms.
6. A failed/cancelled parse or malformed AI response creates no published path and no assignments. Processing may persist a private import job or explicitly labelled draft, never malformed canonical content.
7. Confirm saves the validated draft atomically. Publishing is a separate explicit action; personal **Start learning** may combine publish and self-start after review.
8. Retrying confirmation cannot duplicate a path. Concurrent edits must not overwrite a newer draft silently.
9. Treat imported instructions as data; AI receives no publishing, network browsing, or administrative tools. Output always passes the same validator as visual editing.
10. External URLs remain references; MVP import does not automatically crawl repositories or remote assets.

Proposed initial guardrails, to be finalized in the Markdown/Security specs: 2 MiB per Markdown/text input; ZIP up to 20 MiB compressed, 50 MiB expanded, and 500 entries; canonical draft up to 1,000 content items. Reject unsafe archive paths and links, decompression abuse, binary content disguised as Markdown, and unsupported schemas with actionable errors. Smaller provider-specific AI limits must be visible before sending; never truncate silently.

## 6. Content and history rules

- Optional stages and modules organize content. They do not force academic structures or independent completion credit.
- Lessons contain readable content and may contain tasks/exercises. Projects can sit at path, stage, or module level. Supported nesting combinations must be specified in the Content Model; arbitrary recursive nesting is outside MVP.
- MVP uses explicit activities with required/optional flags: lesson confirmation, task/exercise confirmation, or project evidence with self-confirmation/reviewer approval. A lesson with task/exercise children aggregates those children and has no separate completion unit; a task-free lesson may have self-confirmation. See Content Model for the exact matrix.
- Resources and organization containers do not contribute completion units. A link embedded in Markdown is not automatically a tracked task.
- Stable logical content IDs survive reordering/renaming within subsequent drafts. File paths and titles are not permanent identities.
- Publishing creates an immutable version containing structure, content, and completion requirements. New edits create another draft/version.
- Assignments reference one published version. Publishing version 2 cannot change a learner's denominator, submitted evidence, or report for version 1.
- MVP offers new-version assignment for new participation. Progress transfer, in-place upgrades, automatic re-import matching, and merge UI are deferred.
- Archiving removes a path from new assignment choices while preserving existing participation and historical access subject to permissions.
- A new independent import/duplicate creates a separate path identity, with provenance where available. It never attaches another path's progress merely because imported IDs match.
- Removed members lose workspace access immediately; retained historical records remain available only to authorized roles under the eventual retention policy.

Prerequisites and milestones remain later capabilities. MVP must reject unsupported structured rules with an explanation and preserve descriptions from loose imports; it must never silently promise dependency enforcement it does not perform.

## 7. Completion and progress contract

Each published version defines a set of required completion units. Each unit has one supported rule: **self-confirmation** or **approved evidence**. Optional units have independent status but never block overall completion.

For an enrollment with at least one required unit:

**Progress = satisfied required units / total required units × 100.**

Example: 10 required units, 6 satisfied, 2 awaiting review, and 2 unfinished means 60%, even if 4 optional units were completed. Containers summarize their descendant units; do not average rounded lesson/module percentages.

| Situation | Required behavior |
| --- | --- |
| Submitted evidence awaiting review | Visible as pending; no completion credit |
| Changes requested | Remains incomplete; feedback and earlier attempt preserved |
| Latest eligible attempt approved | Completes its unit exactly once |
| Duplicate completion/approval request | No additional unit or activity credit |
| Required self-confirmed unit reopened | Current progress decreases; historical completion/reopen events remain; optional reopening does not change the fraction |
| Approved project completion edited by learner | Denied; learner cannot bypass review or alter the approved attempt |
| Published version with zero required units | Block new publication until an explicit requirement exists |
| New version changes requirements | Existing enrollments retain their original rules and denominator |

Completion time is when all required units first become satisfied in the current completion cycle. Reopening a required self-confirmed unit starts a new cycle; reopening optional work does not reopen the path. Historical completion remains recorded. Current deadlines compare against the current cycle's completion time. Deadline changes are audited; historical reports retain the deadline effective at their cutoff.

Review decision reversal is outside MVP. A correction process must be designed before adding it; an administrator cannot silently rewrite historical approval.

## 8. Initial access model

Keep four fixed organization roles for MVP. The separate **Admin** and **Content Creator** roles from the vision are deferred, with owner/manager covering necessary creation work. No custom role builder or broad platform administration UI is required.

| Action | Personal owner | Organization owner | Manager | Assigned mentor | Learner |
| --- | --- | --- | --- | --- | --- |
| Create/edit/publish paths | Own workspace | Workspace | Workspace | No | No |
| Invite/remove members and set roles | Not applicable | Yes | Invite learners/mentors only | No | No |
| Assign paths/set reviewers | Self-start | Workspace | Learners assigned to manager | No | No |
| Read path content | Own paths | Workspace | Workspace | Assigned published versions | Own assigned versions |
| View progress and reports | Own | Workspace | Managed learners | Assigned learners | Own |
| Review work | Self-confirm only | Authorized organization enrollments | Managed enrollments | Assigned enrollments | No |
| Write/read private notes | Own | Own notes only | Own notes only | Own notes only | Own notes only |
| Download evidence | Own | Authorized enrollments | Managed enrollments | Assigned enrollments | Own |
| Export path definitions | Own paths | Workspace | Workspace | No | No |
| Export personal progress | Own | Authorized learner reports/exports | Managed learners | Assigned learner reports | Own |

An owner explicitly gives a manager responsibility for learners; membership alone does not create that relationship. Owner can create the initial manager relationships. A reviewer cannot approve their own submission, including when that reviewer is an owner or manager.

Role changes, invitation acceptance, workspace selection, jobs, exports, and private file access are all server-authorized. Managers cannot grant owner/manager privileges. Mentors and learners cannot discover unassigned drafts or other learners' records. Platform operations have no implicit permission to read private notes or training content.

## 9. Submission and review workflow

MVP supports immutable submitted attempts and these states: **Draft → Submitted → Under review → Changes requested / Approved**. “Rejected” as a terminal state is deferred; use changes requested with clear feedback for remediable work.

The learner can edit an unsubmitted draft. Submission freezes that attempt's content and attachments. Changes requested allows a new attempt linked to the previous one, retaining its feedback. Review decisions apply only to the currently eligible attempt and reject stale/conflicting updates. A required project cannot be completed by a learner-controlled checkbox.

Files use private storage and bounded size/type policies. Only the learner and authorized staff can retrieve them. External links are displayed safely and are not fetched server-side merely because they were submitted. Invitation, report, and upload credentials must never be stored in logs.

## 10. Reports and export contract

MVP has one individual enrollment report with: workspace name and optional logo, learner, path title/version, report ID, selected period and timezone, generation time/cutoff, progress fraction, completed required/optional units, project attempts/statuses, review feedback, self-reported study time, and meaningful activity.

Define period semantics precisely:

- Period uses the selected timezone and a start-inclusive/end-exclusive interval; a UI “through date” means the next local midnight is excluded.
- Activity totals and study time cover that interval. A study session crossing a boundary contributes only the overlapping duration.
- Progress is cumulative as of the report cutoff, not simply completions inside the period. Cutoff is the earlier of the requested period end or generation time.
- Missing study sessions mean **no study time recorded**, not evidence that no learning occurred. Manual durations are labelled self-reported.
- Historical-as-of reports use events and session revisions recorded by cutoff; later backdated entries cannot alter an earlier snapshot. Expose this meaning in report help text.
- Completion, pending review, approved evidence, and optional work remain distinct metrics.

A reporting service builds one authorized, structured model. Web, print, and PDF render the same model. Generated reports store an immutable snapshot and rule/version metadata so a later draft edit or deadline change cannot alter an earlier report. A live preview may refresh; a generated report has a fixed cutoff.

PDF must be an actual generated file with selectable readable text, page numbers, consistent headings, tables that paginate correctly, and Persian/RTL text and suitable embedded fonts. Browser print hides navigation and controls. Verify short, long, empty-period, and mixed Persian/English examples.

Path export produces readable README/module/lesson/project/resource files with supported metadata and logical IDs. Exporting and re-importing into a new draft preserves supported structure and completion rules, but never exports another learner's progress or private notes with content. Authorized personal progress JSON is a separate export. Full organization backups/administrative data export and report HTML/Markdown downloads follow later.

Secure public report links are deferred. MVP reports require authenticated authorization; users can intentionally distribute a downloaded PDF themselves.

## 11. Deferred capabilities

| Area | Excluded features | Boundary to preserve now |
| --- | --- | --- |
| Organization scale | Teams, cohorts, bulk assignment, partial-content assignment, custom roles | Workspace-scoped membership and explicit enrollment scope |
| AI expansion | Goal/job-description generation, copilot, conversational editing, narrative reports, multiple providers, BYO keys | Capability interface and validated draft pipeline |
| Source synchronization | Git/GitHub connectors, remote imports, automatic re-import, diff/merge and progress migration | Logical IDs, source provenance, immutable versions |
| Training extensions | Quizzes, scoring, prerequisites, milestones, skills matrix, certificates, template marketplace | Explicit activity types and completion-rule validation |
| Collaboration | General discussions, mentions, threaded comments, personal mentoring, live chat | Submission attempts and scoped review feedback |
| Analytics/reporting | Team/cohort reports, predictive analytics, public links, AI claims, advanced custom report builder | Shared factual reporting model |
| Commercialization | Billing, plans, trials, SSO, custom domains, webhooks, API tokens | Modular authorization and service/API boundaries |
| Experience expansion | Native apps, offline PWA, command palette, calendar integrations, timer, dark mode, additional UI languages beyond Persian/English | Complete Persian/English catalogs, locale preference, RTL/LTR and timezone handling |
| Operations/productization | Full platform admin, feature-flag console, white label suite, advanced audit viewer | Structured logs, job visibility, essential audit records, recovery procedures |

Do not build empty pages or disabled feature menus for these areas. Document extension points without implementing speculative tables/services.

## 12. Delivery sequence and gates

### M0 — Architecture package

Finalize product/user stories, Domain Model, Content Model, Markdown Specification, roles/permissions, tenant strategy, versioning, progress rules, ERD, system/API/storage/report architecture, threat analysis, UX flows, technology ADRs, development roadmap, and major risks. Complete Master §120 coverage before application code. This scope is one input to that package; it does not replace it.

### M1 — Core workflow milestone

Deliver identity/workspaces/roles → visual builder and structured import → immutable publishing/assignment → learning/progress → evidence/review → factual reports/PDF/export. Include ordinary Markdown extraction, privacy, essential notifications, and audit records. At this milestone a real organization and personal user can finish their workflows without AI.

### M2 — Complete MVP

Deliver the bounded AI README/text adapter and source-aware preview, failure handling, mobile/RTL/PDF verification, deployment recovery checks, and all release scenarios. The AI adapter is optional at runtime but part of the complete MVP capability scope. If M2 is unfinished, describe M1 as the core milestone, not the full promised MVP.

After each implementation phase, run relevant automated tests, lint, type checks, clean-database migrations, build, and a real key-flow check. Fix failures before extending the next phase. Deployment technology is decided in architecture; this document does not select a hosting provider or authorize a public launch.

## 13. Release acceptance scenarios

| Test | Concrete pass condition |
| --- | --- |
| A01 Personal start | A fresh user imports a README, reviews it, starts learning, and gets a PDF without company/team setup |
| A02 Organization journey | Owner invites a real learner, publishes a UI-created path, assigns it, and sees persisted learner activity |
| A03 Review revision | Learner submits, mentor requests changes, learner resubmits, mentor approves; attempts/feedback survive and progress changes once |
| A04 Structured import | Single file and ZIP produce validated previews; malformed IDs/references/schema create no partial path |
| A05 Intelligent README import | A configured real provider converts a plain README into editable units with provenance; human confirmation is required |
| A06 AI unavailable | Provider absent, timeout, rate limit, or invalid output never blocks existing learning; source is preserved and fallback offered |
| A07 Tenant isolation | Cross-workspace IDs fail for read/write, search, export, jobs, reports, and evidence downloads |
| A08 Role/privacy | Unassigned mentor, other learner, removed member, and self-reviewer are denied; private notes appear in no manager report |
| A09 Historical integrity | Version 2 changes do not alter version 1 assignments/progress; archived content and generated reports retain history |
| A10 Progress arithmetic | Mixed required/optional/pending/reopened cases match §7; duplicate requests do not double-count |
| A11 Report parity | Web and PDF share one model; cutoff/timezone/cross-boundary session cases match §10; mixed-language long PDF renders correctly |
| A12 Export portability | Export opens as a readable repository; re-import preserves supported identities/structure/rules in a separate draft |
| A13 Content generality | IT training and a nontechnical employee-onboarding path both complete the same flow without source-code changes |
| A14 Input security | Malicious Markdown, unsafe ZIP paths, oversized archives, unauthorized uploads, and unsafe URLs are handled by documented policies |
| A15 Concurrency/retries | Repeated import confirm, assignment creation, completion, resubmission, and PDF jobs do not create duplicate effects; stale reviews fail visibly |
| A16 Account lifecycle | Verification/recovery work; revoked/expired invitation and unauthorized role escalation fail; revoked sessions lose access |
| A17 Durable operations | App restart retains data; failed jobs are observable/retryable; a documented backup restore recovers database and referenced files |

Use meaningful unit/integration/E2E coverage for deterministic behavior and authorization. AI tests combine controlled schema/failure fixtures with a documented real-provider acceptance run; do not make routine CI depend on fluctuating AI wording. Reports and core progress never depend on AI output.

## 14. Usability targets and operational limits

- For a representative existing README, target 2–5 minutes from entering a new workspace to a usable path, including preview. Measure registration separately and count the user's corrections. This is an evaluation target, not a guaranteed SLA.
- After ordinary completion or approval, the initiating view reflects committed progress and other authorized views see it on refresh. Proposed beta target: interactive non-job requests have p95 server latency below 500 ms on a declared seeded workload; validate and revise the target before release.
- Import, AI conversion, and PDF/export jobs expose pending/succeeded/failed states with meaningful recovery; they must not rely on an indefinitely open HTTP request.
- Proposed beta workload: 100 members per organization, 20 active path definitions, up to 1,000 units per version, and 10 concurrent interactive users. These are test limits, not permanent domain restrictions or billing tiers.
- Keyboard users can complete creation/review flows. Mobile learners can read, complete tasks, submit evidence, and obtain reports. Mixed Persian/English content renders correctly in the UI and PDF.
- Persian and English are selectable on authentication screens and throughout the application; preference persists across sessions. Both locales cover all P0 labels, validation/errors, empty states, notifications, authentication/invitation emails, print and PDF labels. Content language remains independent and is never silently translated. Missing translation keys fail CI; locale switching preserves unsaved drafts and progress. See UI/UX for resolution and persistence rules.
- Capture request IDs, job failures, and essential administrative changes without logging tokens, note text, or source content. Document backup/restore, required services, environment configuration, migrations, and operational limits.

## 15. Requirements traceability

| Source sections | MVP treatment |
| --- | --- |
| Master §§3–5, 62–65, 79; Addendum §§141–144 | P0 identity, workspace types, fixed permissions, invitations, isolation and privacy |
| Master §§8–13, 44, 49–50, 89–91; Addendum §§123–129, 136–139, 146 | P0 visual/structured/loose import, bounded AI, preview, provenance and Markdown export |
| Master §§15, 47–51, 81–82; Addendum §140 | P0 version snapshots/history; synchronization and progress migration later |
| Master §§16–22, 94 | P0 whole-path individual assignment, completion, deadlines, evidence and review |
| Master §§24–33, 83–84, 99 | P0 notes, manual study time, dashboards and individual web/print/PDF reports; public sharing later |
| Master §§39–41, 52–55, 68–70, 103–107 | P0 essential notifications/audit, responsive/i18n boundaries, storage/API/jobs, tests and operations |
| Master §§6–7, 14, 34–38, 43, 60, 73–78, 95–98, 113–117; Addendum §§130–133, 145 | Later teams/cohorts/templates, assessments, advanced AI/analytics, enterprise and commercial features |
| Master §§108–112, 118–122; Addendum §§134–135, 147–151 | Architecture-first delivery, generic domain, configurable identity, optional AI, explicit publishing and simplicity |

This table groups source intent; it does not claim every vision feature ships. The inclusion and deferred tables above determine MVP obligations.

## 16. Risks and next decisions

| Risk | Current scope control | Document that resolves details |
| --- | --- | --- |
| Organization assumptions make personal learning cumbersome | Automatic personal workspace and self-start; shared enrollment engine | Domain Model and UX flows |
| Arbitrary README structure loses meaning | Conservative extraction, preserved source, explicit provenance and editable preview | Content Model and Markdown Specification |
| Visual/Markdown/AI paths diverge | One canonical draft and validator | Content Model |
| Content updates falsify learner history | Immutable versions and pinned enrollments; migration deferred | Versioning and Database |
| Completion looks like skill certification | Explicit unit accounting and reviewed-evidence metrics; skills/certificates deferred | Progress Engine and Reporting |
| Membership exposes excessive data | Relationship-based manager/mentor access and private-note exclusions | Permissions, Multi-tenancy and Security |
| AI cost/failure or prompt injection harms core | Bounded adapter, quotas/limits, no autonomous actions, validated drafts, real fallback | AI System and Security |
| PDF and Persian content fail late | Mixed-language and long-report rendering acceptance | Reporting and UI/UX |
| Scope grows into the entire commercial vision | P0/deferred tables and M0/M1/M2 gates | Development Roadmap and ADRs |

Next deliverable: **04-DOMAIN-MODEL.md**, followed by **08-CONTENT-MODEL.md** and **09-MARKDOWN-SPEC.md**. Resolve workspace ownership, enrollment identity, content hierarchy, version identity, and review attempts before choosing database tables or building dashboards.

Technology versions, auth provider, ORM, queue, email provider, storage implementation, retention policy, file-type limits, and production hosting are intentionally not finalized here. They require architecture decisions and current documentation when implementation is planned.

## 17. Definition of Done

The complete MVP is ready for a controlled real-user pilot only when all P0 capabilities and A01–A17 scenarios pass, both journeys work with persisted data, and the architecture/setup/security/runbook documents match the actual implementation.

Mocked production functionality, placeholder dashboards, dead actions, missing email/PDF delivery, and an untested tenant boundary do not meet this definition. A real README import, an actual review cycle, and a reproducible report matter more than the number of pages.

This planning document completes MVP scoping only. It does not claim the architecture package, application, tests, deployment, or pilot is complete.
