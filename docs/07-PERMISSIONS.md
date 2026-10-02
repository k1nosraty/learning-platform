# Permissions and Relationship Scope

This document refines the MVP matrix without adding custom roles. Organization roles: owner, manager, mentor, learner. Personal owner is the sole membership. Every access decision is server-side and deny-by-default.

## Decision predicate

Access requires: valid current auth session AND active membership in the target workspace AND allowed capability AND permitted relationship to the object AND valid object state. For review, additionally require reviewer actor != learner actor. Roles are not global user properties.

| Capability | Owner | Manager | Mentor | Learner | Personal owner |
| --- | --- | --- | --- | --- | --- |
| workspace.settings/member.roles/remove | Workspace | No | No | No | Own settings only |
| members.invite | All initial organization roles | Learner/mentor only | No | No | Not supported |
| relationships.manage | All manager/learner pairs | No | No | No | Not supported |
| paths.create/edit/publish/archive/export | Workspace | Workspace | No | No | Own workspace |
| drafts.read | Workspace | Workspace | No | No | Own workspace |
| paths.published.read | Workspace | Workspace | Assigned enrollment version | Own enrollment version | Own workspace |
| enrollments.create/update/cancel | Workspace | Managed learners | No | No | Self-start/cancel |
| progress.read | Workspace | Managed learners | Assigned reviewer enrollments | Own | Own |
| unit.selfComplete/reopen | Own enrollment, self-rule only | Own, self-rule only | Own, self-rule only | Own, self-rule only | Own, self-rule only |
| evidence.create/edit/submit | Own enrollment | Own enrollment | Own enrollment | Own enrollment | Own enrollment |
| evidence.read/files.download | Workspace enrollments | Managed enrollments | Assigned enrollments | Own | Own |
| reviews.decide | Any organization enrollment, excluding self | Managed enrollment, excluding self | Assigned reviewer enrollment, excluding self | No | Not supported |
| reports.read/generate | Workspace enrollments | Managed enrollments | Assigned enrollments | Own | Own |
| notes.read/write | Own notes | Own notes | Own notes | Own notes | Own notes |
| studySessions.write | Own | Own | Own | Own | Own |
| notifications.read/mark | Own recipient | Own recipient | Own recipient | Own recipient | Own recipient |
| audit.read | Workspace safe administrative metadata | Managed-learner relevant metadata only | Own review history | Own learning timeline | Own timeline |

“Workspace” never includes another workspace of the same organization/user. Mentors may read context necessary to review assigned published content; no entire draft/library browsing. There is no impersonation or support-admin bypass in MVP.

## Ownership and invitations

Organization creator becomes owner. Only owners can grant manager/owner and create manager-learner relationships. Manager invitations can grant only learner/mentor and do not automatically make every new member managed by that manager: invitation acceptance may transactionally create the explicit manager relationship only for a learner invitation issued by that manager, after checking the manager is still active and authorized. Owner-created learner invites can explicitly select a manager.

Invites expire after 7 days by default, are single-purpose, cryptographically random and hash-stored. Accepting requires verified matching normalized email. If inviter authority has been revoked, accepting fails and owner can issue a new invite. Removing membership invalidates pending enroll/review/report permissions immediately on the next request.

For owner changes, lock workspace and active owners. Reject removal/demotion of the last owner and removal of personal owner membership. User account deletion is an operational privacy workflow, not an unchecked role mutation.

## Object visibility and private data

Authorization resolves the object inside the tenant scope before returning any DTO. Invisible IDs return 404 rather than revealing another tenant's existence. Visible but forbidden transitions can return 403. Keep responses, file errors and list totals consistent with this distinction.

Private notes are owner-only even for organization owners. Do not reuse an enrollment-wide staff permission for note reads. Report/evidence DTOs whitelist fields; personal progress JSON includes own private notes only if the user explicitly chooses a separate include-notes export, which is deferred. Default progress export excludes all note bodies.

## Revocation and workers

Check database-backed session and membership on every protected request; disable auth cookie session caching in MVP to avoid stale revocation. Revalidate job requester's active capability before import confirmation, export/PDF publication or external AI transmission. A removed reviewer cannot act using a previously loaded browser form. Historical approval remains valid after reviewer membership removal.

## Critical tests

Cross-tenant ID substitution, same-workspace other learner, unassigned mentor, manager without relationship, role grant escalation, self-approval, archived/new draft access, removed membership, stale invitation, private-note report leak, and private-file binding bypass. Test APIs and services directly; hidden buttons prove nothing.
