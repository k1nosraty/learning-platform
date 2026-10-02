# Canonical Content Model

The normative portable shape is [learning-path-draft.schema.json](../schemas/learning-path-draft.schema.json), JSON Schema draft 2020-12, format version `1.0`. The schema is a design contract, not application code. Visual editor, importers and AI must emit it; domain validation follows schema validation.

## Root and nodes

Root: `schemaVersion`, `title`, `description`, `language`, `nodes`. Nodes are a flat array with stable logical IDs and explicit parent pointers. A flat representation makes reorder/move and reference validation straightforward without allowing arbitrary depth. Rendering builds a tree after validation.

Canonical serialized payload is limited to 5 MiB, including bodies, in addition to schema field limits and the 1,000-node cap. Check UTF-8 bytes outside JSON Schema. Source upload budgets remain separately defined in the Markdown spec.

Each node has `id`, `kind`, `parentId`, `order`, `title`, `body`, `estimatedMinutes`, `difficulty`, `tags`, `completion`, `resourceUrl`. These fields are always present; unknown estimates/difficulty, missing resource URL and no completion requirement use null, not guessed values. Body is portable Markdown, never raw executable MDX. Logical IDs use `[A-Za-z0-9][A-Za-z0-9_-]{0,79}` and are unique inside the document. Production public row IDs remain UUIDs.

| Parent | Allowed child kinds |
| --- | --- |
| Path/root (`parentId=null`) | stage, module, lesson, project, resource |
| stage | module, lesson, project, resource |
| module | lesson, project, resource |
| lesson | task, exercise, resource |
| task, exercise, project, resource | None |

Modules cannot contain modules and projects cannot contain tracked child tasks in v1. A project's Markdown checklist remains descriptive unless the author creates separate trackable activities. Titles can be any language; interface locale is independent of content language and never changes its stored text.

`order` is a nonnegative integer, unique among siblings, not necessarily contiguous. File listing order and array order do not override it. All parent references must exist, no self-parent/cycles/orphans, and maximum nesting follows the allowed matrix. Empty draft containers may exist; publication requires at least one required unit anywhere.

## Completion semantics

`completion=null` means no direct completion unit. Otherwise it is `{ "required": boolean, "rule": "self" | "approval" }`.

| Kind | Allowed completion |
| --- | --- |
| stage, module, resource | Must be null |
| task, exercise | Must specify completion with self rule |
| project | Must specify self or approval rule |
| lesson without task/exercise children | May specify self confirmation, or null for reference content |
| lesson with any task/exercise children | Must be null; aggregates children only |

Task-bearing lessons never receive an additional implicit confirmation unit. If a lesson contains only optional tasks, it is optional for path progress; authors can add an explicit required task if needed. Container percentage uses required descendant units. A subtree without required units displays “optional/reference” rather than 100% or NaN.

Approval projects need a non-self authorized reviewer in organization enrollment. Personal publishing/start rejects approval rules until the user changes them to self; offer a previewed batch conversion, never silent rule replacement. Published organization definitions may use approval even before assignment; reviewer is selected at assignment time.

Resources require a syntactically valid absolute HTTPS URL or safe package-relative asset reference according to the import spec. Nonresources have resourceUrl=null. A remote link is not declared verified. Images in body are safe internal asset references or untrusted links subject to rendering policy.

## Metadata and provenance

Estimated minutes is positive integer or null. Difficulty is beginner/intermediate/advanced or null; tags are unique short strings. These do not affect completion. No prerequisite, scoring, certificate or competency fields exist in schema 1.0; structured input containing unsupported fields fails clearly. Loose imports retain unsupported information as content plus warnings.

Import provenance is an application-owned sidecar, separate from portable canonical content: source document/hash, node/field JSON pointer, source heading/line span, extracted/inferred/generated classification, warnings, adapter/model/version, user edits. Suggested values stay tagged during draft review. Hash is provenance, not an access token.

## Validation stages

1. Transport size/type and archive safety.
2. Canonical JSON Schema: required keys, enums, types, limits, unknown-key rejection.
3. Domain: unique IDs, valid parent/kind matrix, sibling order, resource rules, completion matrix, unique tags, no cycles, safe Markdown links.
4. Publication: at least one required unit; personal approval incompatibility handled explicitly.
5. Enrollment: active learner, published version, required reviewer and permitted relationships.

Errors have stable code, JSON pointer/source location and readable message. Validate whole candidate before replacing a draft. Never save malformed AI output as canonical JSON. Source-preserving import drafts may retain an unstructured original separately while canonical validation fails.

## Round-trip

Canonical content→Markdown repository→canonical content preserves supported IDs, parents, order, text, completion rules and metadata. Canonical hashing sorts nodes by logical ID and metadata keys with normalized newline encoding; it does not reorder sibling semantics. Provenance/database IDs/learner progress are excluded. Independent duplication remaps logical IDs deliberately when identity diverges.
