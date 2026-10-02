# Portable Schema Contracts

[learning-path-draft.schema.json](learning-path-draft.schema.json) defines canonical shape version 1.0 using JSON Schema draft 2020-12. It is a specification artifact, not an implemented API or parser.

Read [Content Model](../docs/08-CONTENT-MODEL.md) for hierarchy/completion/resource/publication rules that require cross-node domain validation. Read [Markdown Spec](../docs/09-MARKDOWN-SPEC.md) for conversion between manifest files and this shape.

All node fields are explicit. Null means unknown or absent as documented. Reject unknown properties. Serialized canonical payload limit is 5 MiB in addition to per-field/node/source limits. Validators must enforce UTF-8 byte budget outside JSON Schema; schema string maxLength counts characters.

Canonical transport validation and schema-based import must use the same contract/fixtures. If TypeScript/Zod equivalents are introduced, test bidirectional acceptance parity rather than maintain divergent definitions. Schema evolution requires versioned dispatch and migrations; unknown versions fail visibly.

The expected canonical JSON examples are schema-valid and domain-checked by the package validation. They contain no actual learner data/progress.
