# API Architecture and Command Contracts

REST JSON `/api/v1` is the transport boundary for application services. Auth routes belong to Better Auth and are not reimplemented. Web Server Actions may call the same services; domain logic cannot depend on Next request objects. Native token auth/mobile integration is later, but services and DTOs are reusable.

## Common contract

Workspace-scoped route prefix: `/api/v1/workspaces/{workspaceId}`. IDs are UUID locators, never proof of access. Cookie-authenticated mutations check trusted origin/CSRF policy. Request body uses strict runtime schemas. Server determines actor, role, workspace scope and occurrence time; client-supplied actor/role fields are rejected.

Success is `{data, requestId}`; failure is `{error:{code,message,details?},requestId}`. Do not include stack traces, SQL or provider secrets. List queries return `{items,nextCursor}` with max 100, default 25. Detail DTOs contain only authorized fields. ISO-8601 offset-bearing timestamps are required; invalid timezone/local date inputs fail.

Creation/transition commands use `Idempotency-Key` (UUID/random opaque <=128 chars). Store key+actor+workspace+operation+request hash for 24 hours. Same input replays the committed result; changed input with reused key returns `IDEMPOTENCY_CONFLICT`. Resource uniqueness remains permanent beyond key expiry. Draft/state edits require `If-Match` revision or explicit `expectedRevision`; missing precondition yields 428, stale one 409.

## Endpoint map

Phase 2 uses bounded synchronous import preview and read-only `GET /paths/{id}/versions/{versionId}/export` ZIP downloads instead of the proposed queued transport for local content operations. See [Content implementation](CONTENT.md) and [ADR-013](../adr/ADR-013-phase2-bounded-local-content.md). Report/evidence/AI jobs remain future endpoints.

Paths below are relative to the workspace prefix except global workspace routes.

| Method/path | Input | Result and checks |
| --- | --- | --- |
| GET /api/v1/workspaces | None | Current user's active memberships only |
| PATCH /api/v1/me/preferences | preferredLocale=fa/en | Authenticated user's own allowlisted UI preference; cannot set another user, membership or role |
| POST /api/v1/workspaces | type=organization, name, timezone | Organization + owner; personal created by onboarding |
| PATCH /settings | name, timezone, defaultLocale=fa/en, logoFileId?, expectedRevision | Owner/self settings; safe logo binding |
| GET /members | cursor/status | Allowed membership DTOs |
| POST /invitations | email, role, managerMembershipId? | Pending invite + queued email; grant scope checked |
| POST /invitations/{id}/revoke | expectedRevision | Owner/eligible inviter; cannot affect another tenant |
| POST /api/v1/invitations/accept | token | Verified matching user consumes invite atomically |
| PATCH /members/{id} | role/status, expectedRevision | Owner; last-owner protection |
| POST /manager-learners | managerMembershipId, learnerMembershipId | Owner creates explicit relationship |
| GET/POST /paths | filters/cursor or title/language | Scoped library or empty validated draft |
| GET/PUT /paths/{id}/draft | canonical draft + expectedRevision for PUT | Creator capability; whole candidate validated |
| POST /paths/{id}/publish | expectedRevision | Immutable version; publication rules |
| POST /paths/{id}/start | expectedRevision | Personal reviewed publish+self-enroll in one authorized idempotent service transaction |
| POST /paths/{id}/archive | expectedRevision | Stop new assignment; preserve history |
| GET /paths/{id}/versions/{versionId} | None | Version DTO; learner/mentor need enrollment scope |
| POST /imports | method, sourceFileIds or pastedText | 202 ImportRun/JobRun; limits/disclosure consent |
| GET /imports/{id} | None | Own authorized import preview/state |
| POST /imports/{id}/confirm | editedCanonicalDraft, expectedRevision | New draft/path exactly once; never publish |
| POST /imports/{id}/cancel | None | Cancel queued work; retain source per policy |
| POST /enrollments | versionId, learnerMembershipId?, reviewerMembershipId?, managerMembershipId?, dueAt? | Organization assign or personal self-start; approved projects require reviewer |
| PATCH /enrollments/{id} | dueAt/reviewer/cancelled, expectedRevision | Scope/state check, append enrollment history; reviewer changes forbid active under-review reassignment |
| GET /enrollments/{id} | None | Pinned tree/progress/next activity |
| POST /enrollments/{id}/units/{unitId}/complete | expectedRevision | Own self-rule, immutable event |
| POST /enrollments/{id}/units/{unitId}/reopen | expectedRevision | Own self-rule, cycle recalculation |
| POST /enrollments/{id}/units/{unitId}/attempts | body, attachmentFileIds | Create/editable draft attempt; immutable earlier attempts |
| PUT /attempts/{id} | body, attachments, expectedRevision | Own draft only |
| POST /attempts/{id}/submit | expectedRevision | Freeze accepted files/body; approval or self evidence workflow |
| POST /attempts/{id}/claim | expectedRevision | Optional under-review marker by eligible reviewer |
| POST /attempts/{id}/review | decision, feedback, expectedRevision | Eligible current attempt; no self-review; changes feedback required |
| GET/PUT /enrollments/{id}/notes/{noteId} | body/expectedRevision | Owner-only note, not staff enrollment DTO |
| POST /enrollments/{id}/notes | body, nodeId? | Create own private note with server-generated UUID |
| POST /enrollments/{id}/study-sessions | startsAt, endsAt | Positive nonoverlapping interval |
| PATCH /study-sessions/{id} | startsAt, endsAt/deleted, expectedRevision | Own correction creates revision |
| GET /enrollments/{id}/timeline | cursor | Safe visible activity only |
| GET /enrollments/{id}/report-preview | localStartDate, localThroughDate, timezone, reportLocale=fa/en | Transient factual model, no public link |
| POST /enrollments/{id}/reports | same period/locale inputs | Fixed ReportSnapshot and locale + PDF job, 202 |
| GET /reports/{id} | None | Snapshot/status under current auth |
| GET /reports/{id}/pdf | None | Authorized proxy; pending=409, ready=PDF |
| POST /paths/{id}/exports | versionId, format=markdown-zip | Job with selected immutable version |
| POST /enrollments/{id}/exports | format=progress-json | Own/scoped authorized data, notes excluded |
| POST /files | purpose, parentId?, originalName, declaredType, bytes | Upload intent; strict binding constraints |
| PUT /files/{id}/content | binary upload | Authorized streaming/proxy; no large Server Action body |
| POST /files/{id}/finalize | sha256? | Server detects/hash-validates content; ready/rejected |
| GET /files/{id}/content | None | Authorized parent binding, no-store proxy |
| GET /jobs/{id} | None | Requester capability/status; safe error codes |
| GET /notifications | cursor | Own recipient list/counts only |
| GET/PATCH /notifications/{id} | read flag for PATCH | Own recipient only |

For self evidence projects, Submit freezes an evidence attempt but does not create a review queue; self Complete is still the satisfaction command. For approval projects it sets pending. Report preview and snapshot endpoints call the same model builder, with explicit independently generated cutoffs.

## Errors

400 malformed transport; 401 invalid session; 403 visible forbidden action; 404 invisible/missing object; 409 revision/state/idempotency conflict; 413 size limit; 422 canonical/domain validation; 428 missing revision precondition; 429 rate/budget limit; 503 dependency unavailable. Job failures use stable codes such as AI_UNAVAILABLE, AI_OUTPUT_INVALID, FILE_REJECTED, PDF_RENDER_FAILED, REQUESTER_REVOKED.

Before each phase's endpoints are implemented, encode these exact contracts in runtime validation/OpenAPI and add request/response tests. This planning map is not a claim that a live API exists. Do not expose generic CRUD patches for sealed versions/events/reviews.
