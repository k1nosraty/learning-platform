# Markdown Import/Export Specification 1.0

Structured and loose imports are different adapters producing the same [canonical model](08-CONTENT-MODEL.md). UTF-8 text and normalized LF newlines are baseline; reject undecodable bytes with a file-specific error. Never execute code fences, MDX, embedded scripts, YAML tags or source instructions.

## Structured repository

Repository root contains `roadmap.yml`. Root keys are exactly `schemaVersion`, `title`, `description`, `language`, `nodes`. Each node record contains the canonical node metadata except `body`, plus `file`. Content body is read from that relative Markdown file. Unknown keys, duplicate YAML keys, aliases/anchors, custom tags and multiple YAML documents are rejected in v1.

Example record:

```yaml
schemaVersion: "1.0"
title: "Sample learning path"
description: "A portable path"
language: "en"
nodes:
  - id: networking
    kind: module
    parentId: null
    order: 0
    title: "Networking"
    file: modules/networking.md
    estimatedMinutes: null
    difficulty: beginner
    tags: [networking]
    completion: null
    resourceUrl: null
```

Any safe directory layout is allowed. IDs and parent metadata determine structure. README.md is the human overview and does not create duplicate nodes unless explicitly listed. Files listed once per node; shared body files are rejected in v1 to keep editing/export unambiguous.

Archive import supports one root manifest or one enclosing top-level folder containing it. Multiple root candidates fail with selection guidance. Unlisted Markdown files produce warnings and are retained in source preview; they are not silently added to canonical structure.

## Single structured Markdown

YAML front matter contains `schemaVersion`, root `title`, `description`, `language`, and `nodes`; every node includes canonical `body` as a quoted/block string instead of `file`. Remaining Markdown is a readable overview. This is the simplest schema-backed single-file exchange for an external AI producing structured content. The header must parse to the canonical schema exactly.

Multiple uploaded files use a manifest plus node bodies; without a manifest they use loose mode. File-level front matter from other ecosystems, including the illustrative older Master example, is treated as loose metadata with a warning unless converted to the specified v1 format. No unsupported legacy metadata is silently claimed to be deterministic structured input.

## Loose Markdown and ordinary text

No schema is required. Deterministic extraction uses headings for proposed containers/lessons, task checkboxes for trackable tasks and recognized exercise/project labels for suggestions. Recognize common English and Persian labels in documented fixtures. A list of topics is descriptive by default, not automatically a set of completed tasks. Imported checked boxes do not grant learner completion: they are source annotations with a warning.

Unrecognized prose is retained in lesson bodies or an unassigned source panel. Ordinary headings can mean many things; source mappings and preview let users correct interpretation. Optional AI can infer a fuller structure. No algorithm promises all arbitrary text becomes a correct curriculum without review.

## Limits and safety

Text file limit 2 MiB each; ZIP 20 MiB compressed/50 MiB expanded/500 entries; candidate 1,000 nodes. Nested archives, absolute paths, `..`, symlinks/hardlinks, NUL/control characters in names, duplicate normalized paths and encryption are rejected. Normalize separators and Unicode before containment checks. Bound decompression bytes and ratio; do not trust declared ZIP sizes. Source files/assets must remain under the chosen package root.

Allow internal assets PNG/JPEG/WebP up to 5 MiB each and PDF reference attachments up to 10 MiB if detected content type matches. SVG/HTML/executable files are unsupported. Content source may retain an unsupported file only as an explicit warning/reference, never rendered or uploaded as safe executable content. Package asset budget is included in expanded ZIP limit.

Markdown links resolve relative to body file. A link to a listed Markdown node becomes a logical reference; export rewrites it to that node's new path. An unlisted local Markdown target is an error in structured mode and a visible unresolved warning in loose mode. External links use HTTPS; unsafe schemes are rejected. Asset references become private storage bindings for web display and safe files on export. Never fetch remote images during import/PDF.

## Preview/confirmation

Show method, path tree/counts, field provenance, source spans, unresolved links, dropped/unsupported constructs and estimates marked unknown/suggested. Errors block confirm; warnings require acknowledgment when meaning changes. Confirm has idempotency key and locks the ImportRun. It creates or explicitly updates a private draft, not published content. User can cancel, edit or change extraction method without losing the source.

## Export layout and parity

Export ZIP includes README.md, roadmap.yml, module/lesson/project/resource Markdown files and referenced local assets. File paths are generated from sanitized readable slugs plus ID suffix; path naming cannot mutate IDs. Text bodies remain human-readable, headings and checklists intact. No generated node content front matter is necessary because the manifest is authoritative.

Export contains no auth tokens, evidence, private notes, enrollments or report state. A separate authorized progress JSON export carries personal participation data. [Examples](../examples/README.md) supply structured, loose and nontechnical fixtures and expected behavior.

Future schema versions require explicit version dispatch and migration; unknown versions fail rather than guess. Export format is not tied to an application code repository or Git provider.
