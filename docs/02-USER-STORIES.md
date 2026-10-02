# User Stories and Acceptance Criteria

Every story below is P0 unless noted. Acceptance is observed through real persisted behavior. Test IDs refer to [MVP release scenarios](03-MVP-SCOPE.md).

| Story | User goal | Acceptance criteria | Tests |
| --- | --- | --- | --- |
| US-01 | As a new individual, start without pretending to be a company | Verified account gets exactly one personal workspace; retrying onboarding cannot duplicate it; company fields are absent | A01, A16 |
| US-02 | As a personal user, import my README | Upload/paste leads to an editable structure, source mapping, warnings and explicit Start learning; no rewriting into YAML is demanded | A01, A05, A06 |
| US-03 | As a manager, build training without programming | Create modules/lessons/tasks/projects, reorder them and preview through UI; all changes persist without editing code | A02, A13 |
| US-04 | As a technical author, import structured files | Single/multiple Markdown files and repository ZIP validate IDs, references and shape; failure creates no partial path | A04, A14 |
| US-05 | As an author, control publication | Validated draft becomes an immutable version only after explicit action; new edits stay private; conflicts produce a visible reload/merge choice | A09, A15 |
| US-06 | As an owner, invite the right member | Recipient must sign in with verified matching email; acceptance is single-use and transactional; expired/revoked invite cannot grant access | A02, A16 |
| US-07 | As a manager, assign training | Select managed learner, published version, reviewer and optional due date; repeated requests cannot create duplicate enrollment | A02, A15 |
| US-08 | As a learner, know what to do next | See pinned path structure, actionable unfinished unit, pending review and deadline; completed work resumes correctly after logout | A01, A02 |
| US-09 | As a learner, complete ordinary activities | Self-confirmation records one transition; optional items do not block path completion; reopen preserves history | A10 |
| US-10 | As a learner, submit project evidence | Save draft, upload private evidence, submit immutable attempt; awaiting review cannot count as complete | A03, A08 |
| US-11 | As a reviewer, ask for improvements | Feedback on latest eligible attempt persists; learner creates a new attempt; old evidence and review remain readable | A03, A15 |
| US-12 | As a reviewer, approve eligible evidence | Scope and self-review checks pass; approval completes exactly one unit; stale/conflicting decision fails | A03, A08, A10 |
| US-13 | As a learner, keep notes private | Own notes survive refresh; staff cannot read them through detail, list, report, export, logs or AI | A08 |
| US-14 | As a learner, record time honestly | Positive nonoverlapping session interval stored in UTC; corrections are versioned; reporting labels duration self-reported | A11 |
| US-15 | As a manager, see what needs attention | Managed learners only, correct progress fractions, pending reviews and overdue assignments; no simulated analytics | A02, A07 |
| US-16 | As a learner/manager, produce a credible report | Authorized enrollment/date range returns factual model, fixed snapshot and actual PDF; Persian/English text and pagination work | A11 |
| US-17 | As an author, take content elsewhere | Markdown ZIP is readable without SaaS; re-import preserves supported IDs/rules; notes/progress are excluded | A12 |
| US-18 | As a learner, export my progress | Authorized JSON contains own events/participation, not other members or private staff content | A07, A08, A12 |
| US-19 | As an owner, remove access safely | Removed membership takes effect on next protected request; history remains but pending privileged jobs cannot bypass revocation | A07, A08, A17 |
| US-20 | As an operator, recover from failure | Job state observable; retries do not duplicate effects; restored data and referenced files are consistent | A15, A17 |

## Failure paths are product behavior

Creation must explain unsupported sections, invalid links and limits before confirmation. AI timeout retains source and offers deterministic/manual editing. Upload failure permits retry without discarding submission text. A stale draft presents the newer revision; never silently overwrites it. Report generation failure leaves learning available and a retry action. Empty dashboards offer Create path/Import content, not fabricated statistics.

## Pilot scripts

Run personal README → tasks → personal project evidence → PDF; organization visual builder → invitation → assignment → revision/approval → PDF; structured ZIP export/re-import; and cross-tenant denial. Repeat the training workflow with nontechnical onboarding content. The fixture data is only a starting point: decisive workflow steps must be performed by actual test actors.

Future stories for goal generation, teams, templates, public share links and certificates belong in a separate backlog, not this release's completion claim.
