# Learning Path Versioning and History

## Three identities

LearningPath UUID is stable across its life. PathVersion UUID identifies one immutable publication. ContentNode UUID identifies a node in one version; portable logical node ID identifies continuity within that path. A filename, title or sibling position is never identity.

Draft is one canonical JSON document plus positive integer revision. `If-Match`/expectedRevision controls every write. A stale revision returns conflict with current revision, not a silent last-write-wins merge. AI proposals and import previews are separate until explicitly confirmed.

## Publish algorithm

Authenticate/authorize, enter tenant transaction, lock path and draft, compare expected revision, validate canonical shape and domain, require at least one required completion unit, derive immutable nodes/units, assign next version number and content hash, insert version and children, seal publication, set current pointer, append audit/outbox, commit. Any error leaves the previous pointer and draft intact.

Publishing the identical content hash may return the existing current version when idempotent intent matches. Changing publication metadata alone cannot create accidental copies. IDs in a new version retain logical continuity, but version snapshot row IDs are new.

## Editing and assignment

Editing after publication works on draft cloned from current publication. The existing version remains readable. Manager selects a published version when assigning; default is current publication but response states exact version. Self-start follows the same rule. Archived paths cannot receive new enrollments but existing learners retain access to their pinned version subject to membership.

MVP never migrates an enrollment to another version. To use v2, create separate participation in v2; it starts with fresh progress and clear labeling. No progress is inferred from equal titles or IDs across independent paths. Repeated participation in the exact same version/learner is excluded by uniqueness until retake semantics are designed.

## History types

| Change | Current effect | Historical effect |
| --- | --- | --- |
| Rename/move draft node | Next publication only | None on existing version |
| Remove draft activity | New version loses that unit | Old version/unit/evidence remains |
| Change completion rule | Applies only to new publication | Existing unit rule stays fixed |
| Change enrollment deadline | Updates current view, appends enrollment_change | Report at old cutoff uses old deadline |
| Reopen self-confirmed unit | Current fraction decreases | Completion/reopen events remain |
| Correct study time | Appends session revision | Earlier cutoff reconstructs earlier revision |
| Remove membership | Access revoked | Approved evidence/completion facts retained |
| Generate report | Freezes facts/model hash | Later changes cannot rewrite that snapshot |

## Immutable versus operational fields

Published content, decision facts and report model JSON are immutable. Archival and report delivery status are operational metadata. SQL grants/triggers enforce separation; generic PATCH endpoints cannot modify snapshot bodies. Permanent erasure is a controlled retention workflow and may make historical report regeneration unavailable; generated reports must not falsely claim reproducibility after redaction.

## Deferred synchronization

Future re-import would compare stable IDs, show additions/removals/ambiguous matches and produce a new draft. It never blindly overwrites progress. Source hash/provenance are retained now; fuzzy matching, merge UI and transfer policy are not shipped. See ADR-004.
