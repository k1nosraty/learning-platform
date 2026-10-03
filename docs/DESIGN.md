# Visual system and usability

Status: implemented between Phases 2 and 3; validation in progress on `develop`. This is the shared foundation for future screens, not a new feature phase.

## Direction

A calm learning workspace: warm white surfaces, a deep teal/navy navigation rail, botanical green primary actions, restrained lime, lavender and amber accents. Whitespace and a clear hierarchy make content easier to scan. Use decoration on onboarding and empty states; keep editing and administration focused on the user's work.

Typography is bundled/self-hosted: Inter Variable 5.3.0 for English, Vazirmatn Variable 5.3.0 for Persian, with browser fallbacks and font-display swap. No external font/CDN request is required at runtime. The notices ship at `/font-licenses.txt`. New SVG marks/icons are repository-owned, decorative icons are hidden from assistive technology, and controls retain text labels.

## Shared contract

`apps/web/app/styles.css` contains the tokens and responsive components; `components/icon.tsx` owns the SVG family; `packages/contracts/src/design-locales.ts` contains paired fa/en copy checked by `docs:check`.

| Token | Value / use |
| --- | --- |
| Ink | `#203738`, titles and body |
| Secondary text | `#617474`, readable supporting text |
| Primary | `#176d59`, primary actions and links |
| Primary hover | `#105744` |
| Navigation | `#172f35`, desktop rail and mobile drawer |
| Canvas / surface | `#f5f7f6` / `#ffffff` |
| Border | `#e0e8e5`; inputs use stronger `#bccdc6` |
| Corners | 20px cards, 10–11px controls; smaller cards on mobile |
| Controls | At least 44px default height; visible keyboard focus |

Use semantic headings, clear labels, one main landmark and a skip link. Read user content with `bdi`/automatic direction; mirror navigation arrows and use CSS logical properties for Persian. Avoid color-only status; badges carry words. Keep disabled prerequisites visibly different from active controls. Button text states the operation, with a supporting SVG, instead of unlabeled icon-only actions.

## Implemented surfaces

- Sign-in, registration and recovery: two-panel desktop layout, concise illustrated introduction, clear forms, password visibility control and submit feedback; stacked mobile presentation.
- Workspaces: welcoming header, distinct personal/team cards, permission/zone information, obvious open action and separate organization creation.
- Navigation: persistent rail on desktop; native modal drawer below 1000px with Escape/focus restoration. Only available capabilities appear. Current workspace context and active page remain visible; settings link targets the actual owner settings section.
- Content library: consistent status cards, truthful loading/empty states, labeled pagination, meaningful manual/import panels and ability to clear a selected file while preserving pasted text.
- Editor/import preview/published reader: consistent cards, structured sidebar, readable forms/Markdown, localized feedback, stable-ID detail disclosure and responsive layouts.
- Confirmation: deleting a draft subtree, archiving and discarding unsaved edits require a native dialog. Initial focus stays on the safe action; Escape cancels. Snapshot/history rules remain server-side.
- Invitations, organization administration and missing pages use the same visual system. Language switching shows request failures instead of silently ignoring them.

Responsive checkpoints: 320px minimum mobile, 390px mobile, 768px tablet, 1000px navigation breakpoint, 1440px desktop. Respect reduced motion; maintain touch-sized primary controls and readable content without horizontal overflow. Long names, hashes and Markdown tables/code use wrapping or bounded scrolling.

## Verification

Local lint, TypeScript, unit tests, catalog/OpenAPI parity and production build pass. The browser suite adds a real verified-account journey for password visibility, skip navigation, modal keyboard behavior, edit cancellation and persisted publication. Axe scans check detectable WCAG 2/2.1 A/AA issues on public auth, workspaces, library, editor, mobile drawer, confirmation dialog and published reader; no rules or page regions are excluded. Desktop/Persian/mobile screenshots are retained in the CI report for visual review.

Automated scans are evidence for the covered states, not a complete accessibility certification. Screen-reader/user research, broader device coverage and pilot load/performance remain the Phase 7 gates. Final run links and observed results will be recorded after validation.
