# Phase 2 — Content engine

Status: implementation complete; PostgreSQL, browser and container validation in progress on `develop`. Phase 3 progress/reviews/reports and AI have not started.

## Use it

Run `start-windows.bat` or the manual Foundation commands. The launcher applies the new migration to existing installations. After verified sign-in, open a personal or organization workspace and choose **Learning paths**. Owners/managers create, import, edit, publish, archive and export. Learners/mentors cannot browse drafts or the staff library.

Build manually: name a path; add stages/modules/lessons/tasks/exercises/projects/resources; edit title, parent, Markdown, estimate, difficulty, tags and completion; reorder siblings with the move buttons. Tasks/exercises belong inside a lesson, which then aggregates activities instead of adding a second completion unit. Delete removes the selected draft subtree; old publications remain intact.

Import: choose ordinary Markdown/text or structured mode, then paste text or upload one `.md`, `.markdown`, `.txt` or `.zip`. Preview shows source text/hashes/line mappings, proposed tree and extracted/inferred fields. Edit and acknowledge warnings before confirming. Checked source boxes never grant progress. Confirmation creates one private draft and does not publish. Invalid source stays blocked and never becomes canonical application state.

Structured mode accepts `roadmap.yml` repositories or canonical single-file front matter. ZIP supports root or one enclosing folder. Only manifest-listed files become nodes. Unknown metadata, duplicate YAML keys, aliases/anchors/explicit tags and multiple documents fail. Export downloads one selected immutable version as ZIP with manifest, overview, readable Markdown files and bound assets; supported fields and logical IDs round-trip.

Publish requires a required activity. Personal publication/start requires explicit conversion of approval projects to self confirmation. The UI lists affected projects, changes rules only on the user's click and requires saving before publication. **Publish and start personally** atomically publishes and creates unique participation pinned to that version. The published reader is usable; activity completion/progress is Phase 3.

## Integrity, access and localization

- Normative JSON Schema/Ajv plus domain checks validate IDs, hierarchy, sibling order, completion, URLs, assets and publication rules. Whole candidates are checked before draft replacement.
- Save/transition requires `expectedRevision`: missing=428, stale=409. Scoped idempotency receipts cover creation/confirmation/publish/start/archive; capability is checked before replay.
- Browser session storage retains unsaved edits across fa/en, keyed by user/workspace/path. Stale local drafts retain edits and show conflict; storage failure blocks language switching until saving. Content language is independent.
- Publication derives new node/unit UUIDs, seals before changing the pointer and commits audit/outbox atomically. SQL grants/triggers reject snapshot mutation, child inserts after sealing and unsealed commits. Edited drafts produce future versions; enrollment pinning is unchanged.
- New tables enforce tenant RLS, active editor/version scope and composite tenant/version FKs. No-context connections cannot read content; no generic published CRUD exists.
- Parsed React Markdown never executes raw HTML/MDX. External images are links rather than network requests. Private image/PDF downloads use snapshot binding and current authorization, no-store and nosniff.

## Local storage and limits

[ADR-013](../adr/ADR-013-phase2-bounded-local-content.md) explicitly refines the planned storage/job architecture. Imports/exports are bounded synchronous operations, not placeholder queued jobs. Opaque originals/assets use private mounted storage. Windows preserves the content volume alongside PostgreSQL; manual development should set an **absolute `CONTENT_STORAGE_DIR`** so all processes share it. Never commit/expose that directory.

Limits: text 2 MiB/file; ZIP 20 MiB compressed, 50 MiB expanded, 500 entries, 200:1 maximum per-file expansion; canonical document 5 MiB/1,000 nodes; image 5 MiB, PDF 10 MiB. Actual decompressed bytes are counted. Traversal, duplicate normalized/case-colliding paths, archive links, encryption and nested archives are rejected. Source filenames are display-only. Links are not claimed remotely verified.

Original source access expires after 30 days. Physical cleanup, unbound-object reconciliation, quotas, S3/distributed storage, background consumers and coherent restore are pilot gates. Published bound assets remain retained. No public deployment.

## API and validation

[Generated OpenAPI](api/foundation.openapi.json) includes content endpoints. Draft save is PUT; publish/start/archive and import confirm/cancel are POST with preconditions. Imports accept JSON text or multipart upload. Read-only version `/export` returns ZIP synchronously; `/assets?name=...` proxies a private snapshot file. Error DTOs carry localized messages, stable codes and field/source pointers. Existing session/origin boundaries apply.

Local `pnpm check` (lint, TypeScript, 11 unit tests, OpenAPI/fa/en parity) and `pnpm build` pass. Root-only restrictions block local native PostgreSQL/Chromium; this is not counted as a pass. GitHub Actions runs real database/browser/container checks. Final evidence will be recorded after completion.
