# Learning Platform — Pre-Implementation Package

این پوشه بستهٔ طراحی پروژه است. هنوز اپلیکیشن، migration اجرایی یا سرویس مستقرشده‌ای ندارد. اسناد فنی به انگلیسی نوشته شده‌اند تا مستقیماً مبنای توسعه قرار بگیرند.

هدف: محتوایی که کاربر از قبل دارد—README، متن یا برنامهٔ آموزشی—به یک مسیر یادگیری قابل‌پیگیری تبدیل شود. استفادهٔ شخصی ساده بماند و شرکت بتواند همان هسته را برای تخصیص مسیر، بررسی شواهد و گزارش‌گیری به کار بگیرد.

## Start here

1. Read [Product vision](docs/01-PRODUCT-VISION.md), [User stories](docs/02-USER-STORIES.md), and [MVP scope](docs/03-MVP-SCOPE.md).
2. Read [Domain model](docs/04-DOMAIN-MODEL.md), [Content model](docs/08-CONTENT-MODEL.md), and [Markdown specification](docs/09-MARKDOWN-SPEC.md).
3. Read [Architecture](docs/05-ARCHITECTURE.md), [Database](docs/06-DATABASE.md), [Permissions](docs/07-PERMISSIONS.md), and [Security](docs/13-SECURITY.md).
4. Follow [Development roadmap](docs/21-DEVELOPMENT-ROADMAP.md) when implementation is explicitly requested.
5. Use [Implementation handoff](IMPLEMENTATION_HANDOFF.md) as the initial development instruction.

## Package contents

| Location | Purpose |
| --- | --- |
| [MASTER_SPEC.md](MASTER_SPEC.md) | Unchanged commercial vision supplied by the user |
| [AI_IMPORT_SPEC.md](AI_IMPORT_SPEC.md) | Unchanged creation/personal-mode Addendum |
| [docs/INDEX.md](docs/INDEX.md) | Full document map and Master §120 coverage |
| docs/01…24 | Product, domain, architecture, contracts, operations, risks and release gates |
| [adr/README.md](adr/README.md) | Decision records and alternatives |
| [schemas/README.md](schemas/README.md) | Normative portable draft schema and limits |
| [examples/README.md](examples/README.md) | Structured path, ordinary README, nontechnical path and expected outcomes |
| [PACKAGE_STATUS.md](PACKAGE_STATUS.md) | What is complete now and what needs implementation evidence |

## Authority

The original specifications express the long-term vision. MVP scope narrows the first release. Detailed documents refine its behavior; a refinement must not silently add deferred features or weaken isolation/history/privacy. Conflicts are resolved explicitly in an ADR and updated across affected documents.

Design status is **proposed baseline ready for implementation planning**. The user authorized preparation of this package, not a public launch or application deployment. No infrastructure credentials or application source code are required to understand it.

The production repository structure is documented in [Repository structure](docs/19-REPOSITORY-STRUCTURE.md). Application folders and commands are created in Phase 1; empty source scaffolds are deliberately absent from this planning package.

## Non-negotiable invariants

- Every protected operation checks the current session, membership, capability and object scope server-side.
- Published path versions are immutable; enrollments pin one version.
- Required activities determine progress; pending review does not count as complete.
- Private notes never enter manager reports or AI prompts by default.
- Visual editing, Markdown import and AI conversion converge on one validated draft.
- AI is optional at runtime, cannot publish, and cannot invent report facts.
- A personal user needs no fake company, team, employee or second account.
- MVP includes complete selectable Persian/English UI, messages, emails and reports with RTL/LTR; further languages can be added without rewriting the domain. See UI/UX for the full multilingual contract.

## Next action

When ready, ask to begin **Phase 1 — Foundation**. First validate exact package versions and adapter compatibility, then implement identity, personal/organization workspaces, permissions and tenant-boundary tests. Continue according to the gated roadmap, not by generating all features at once.
