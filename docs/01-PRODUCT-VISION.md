# Product Vision and Requirements Analysis

Status: proposed baseline · 2026-10-02

## Problem

Training plans already exist in documents, README repositories and informal checklists. Individuals lose track of what comes next. Companies repeatedly rebuild those plans in forms, collect evidence through disconnected channels and assemble progress reports manually. The product makes existing content actionable while retaining a portable representation.

## Audience and value

| Audience | Need | Product outcome |
| --- | --- | --- |
| Individual | Begin a roadmap quickly and resume consistently | Personal workspace, import/preview, next activity, evidence and report |
| Employer/manager | Assign training and identify work requiring attention | Published version assignment, deadlines, progress and review queue |
| Mentor | Review evidence and give actionable feedback | Scoped submissions, revision history and explicit decisions |
| Technical content author | Manage reusable content without vendor lock-in | Structured Markdown import/export with stable logical IDs |

The defining promise is: **Give it what you already have, and it turns it into a trackable learning system.** This does not mean arbitrary documents are interpreted perfectly; uncertainty is visible and edits remain easy.

## Requirements analysis

The Master specification describes a commercial platform, not merely a personal tracker. The Addendum makes personal use and low-friction import architectural requirements. Combining them changes the tenant root from “company only” to **Workspace**, with personal and organization types. Collaboration is an organization capability layered over shared content, enrollment, progress and reporting services.

A README is an input/output interface, not the entire product. The UI and importers produce the same canonical draft. Learning paths must not contain domain-specific application logic: IT infrastructure and nontechnical employee procedures are test fixtures, not built-in assumptions.

The immediate value chain is creation → validated publishing → participation → activity/evidence → review → progress → factual report. Billing, skills matrices, certificates, marketplaces and advanced AI remain future scope. Their absence cannot justify a broken core workflow.

## Outcomes and metrics

- First useful path: target 2–5 minutes for a representative existing README, excluding registration; report median and range alongside correction effort.
- Creation quality: measure unsupported/unmapped sections and required edits. A low time achieved by dropping source content is a failure.
- Learning usefulness: user can identify the next actionable item without interpreting a dashboard of unrelated metrics.
- Review usefulness: manager can find pending submissions and return changes with preserved attempt history.
- Reporting correctness: web/PDF totals agree with stored events and pinned content version, including time boundaries.
- Operational trust: isolation tests, recovery rehearsal and account/session lifecycle pass before pilot.

Do not optimize learner engagement by collecting unnecessary attention telemetry. Manual study duration is self-reported, and course completion is not a claim of professional ability.

## Product principles

Simple actions use defaults and one clear next step. Advanced metadata remains available in technical import/export. Creation is possible without AI. Publishing official content requires human intent. No draft is exposed to learners before publication. Navigation reveals collaboration only in organization contexts. Names and branding are configuration, not embedded domain constants.

## Scope authority

[MVP scope](03-MVP-SCOPE.md) determines the first release. [User stories](02-USER-STORIES.md) express required outcomes. No application is implemented by this package; the design is ready to guide an incremental build.
