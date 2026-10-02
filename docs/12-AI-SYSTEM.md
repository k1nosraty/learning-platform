# Optional AI-Assisted Import

## Bounded capability

MVP capability is `interpretExistingContent(source, constraints) -> proposed canonical draft + provenance + warnings`. It is not an autonomous agent, source crawler, conversational editor or publishing API. One real provider adapter is enough. Choose its exact API/model during M2 after compatibility, privacy, cost and structured-output validation; no model availability is assumed by this planning package.

Use an application interface with provider name/model/version recorded per import. Domain services do not call vendor SDKs. Structured Markdown and visual editing work without AI. Unconfigured provider is clearly unavailable, never a mocked production response.

## Flow

User selects AI import and sees source transfer disclosure → source passes type/size/retention policy → durable job checks current capability → provider interprets source as data → parse bounded structured response → JSON Schema validation → domain validation → proposed draft and source-aware preview → user edits/confirms → private canonical draft → explicit publish/start.

Provider output is untrusted. Unknown fields, unsupported kind/rules, duplicate IDs, cycles and invented references fail validation. Retry at most once for format repair, then return actionable failure with source preserved. Do not feed validation errors with private unrelated workspace data back to the provider.

## Security and provenance

Prompt establishes source text as untrusted material and asks only for supported canonical fields. No tool execution, database access, publishing permission, arbitrary URL fetch or secrets are available. Split source into bounded chunks only with visible complete-coverage mapping and merge validation; M2 can reject oversized source instead of shipping unreliable chunk inference.

For each inferred node/field, store source span, extracted/inferred/generated classification and adapter metadata. Generated additions are off by default for conversion; if the user explicitly asks for them later, show them separately before confirmation. Do not fabricate resources or claim URLs verified. Estimated time/difficulty remains unknown or visibly suggested.

Confidence labels are qualitative interpretation aids, not calibrated probabilities. A source omission panel makes coverage inspectable. Preserve source according to retention settings and log only IDs, latency, usage totals and error codes—not raw source, prompts, notes or responses.

## Cost/failure controls

Initial guardrails: one active AI import per requester; five AI attempts per hour per requester/workspace; explicit source limit <=2 MiB with additional provider token bound; 120-second overall call timeout; at most two total provider calls including repair; operator-configured daily workspace token/cost budget. The selected adapter may impose smaller limits, displayed before transmission. Disable capability when budget configuration is absent in a commercial pilot rather than silently accepting unlimited spend.

Provider timeout/rate limit/content rejection/malformed output sets failed state and offers retry or deterministic extraction. Cancelling stops queued work; in-flight provider cancellation is best-effort and may still cost usage. Revoked requester fails before transmission or confirmation. AI output cannot change published versions or enrollments.

## Privacy choices

Organization workspace owner controls whether external AI transmission is allowed; default disabled until configured. Personal user explicitly chooses AI import. Select provider account policies compatible with intended source confidentiality; document retention/data-use settings before enabling. Private notes/evidence and unrelated organization context are not sent. BYO provider credentials, local models and multi-provider routing are later scope.

## Evidence gate

Unit/service tests use success/malformed/injection/failure fixtures. A documented real-provider acceptance run with a public or synthetic ordinary README proves capability; compare semantic structure/provenance rather than exact wording. Keep provider secrets out of artifacts. If there is no working configured adapter, M1 remains usable but M2 is not complete. Reports/progress remain deterministic irrespective of provider behavior.
