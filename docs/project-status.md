# Project status

Last verified: **2026-07-15** (derived from repository registry, tests, and build configuration — not manually maintained counts)

See also: [`docs/architecture/source-of-truth.md`](architecture/source-of-truth.md)

## React implementation status

**Verified from code**

| Metric | Value | Source |
|--------|------:|--------|
| Implemented Beta components | 47 | `getImplementedComponentCount()` / `lib/component-registry.ts` |
| Registry entries with React | 47 | `hasImplementation: true` |
| Figma-documented components | 63 | `content/` inventory (`lib/data.ts`) |
| Documentation-only (no React) | 16 | Figma docs not in implemented registry set |
| Indexable documentation slugs | 62 | `getIndexableComponentSlugs()` |
| Redirect aliases | 2 | `form-field-wrapper`, `accordion-item` |

### Distribution Model CLI-resolution fields (2026-07-25)

`registry.json`'s schema version bumped to **1.2.0** (additive, backward-compatible) to add five optional CLI-resolution fields to `ComponentRegistryEntry` / `PublicRegistryEntry`, in support of the decided-but-not-yet-built "npx skrewww" distribution model (see [`skrewww-claude-project-instructions.md`](../skrewww-claude-project-instructions.md#distribution-model--decided-target-architecture-2026-07-25)): `dependencies`, `coreDependencies`, `files`, `cssTokens`, `coreVersion`.

**Only Button and Card carry real data**, derived directly from their actual source files (imports, own `.tsx`/`.module.css` files, and every CSS custom property their stylesheet references) — not guessed. `coreVersion` is left unpopulated even on these two, since `@skrewww/core` doesn't exist yet and has no real version to record. At the time this schema shipped (2026-07-25), no Layer 4 (Industry Systems) component existed yet, so no Layer-4 proof-of-concept entry was added then — the Banking pilot (see Layer 4 pilot section below) shipped the same day but after this schema decision, and its three components also do not carry these CLI-resolution fields; they are proof-of-concept-scoped to Button and Card only, not automatically extended to every new component.

**All other 60 registry entries (including the three Banking pilot components) have these five fields absent/undefined.** Populating the full registry against this schema is a separate, not-yet-scheduled pass — do not backfill it with inferred or plausible-sounding values; derive each entry's real `dependencies`/`files`/`cssTokens` from its actual source the same way Button and Card were done.

### `dependencies` semantic correction — schema 1.3.0 → 1.4.0 (2026-08-08)

**`registry.json`'s schema version bumped to 1.4.0.** Unlike the 1.2.0 → 1.3.0 bump (a purely additive new field), this one is a **semantic contract change to an existing field's meaning**, not a JSON-shape change — `PublicRegistryEntry.dependencies` is still `string[] | undefined`, but what it represents has changed:

- **Old meaning (1.2.0–1.3.0):** npm packages directly imported by the component's source, **including host/framework packages** such as React and Next.js. Under this definition, Button's `dependencies: ["react", "next"]` was accurate — its source does import from both.
- **New meaning (1.4.0):** third-party npm packages the distribution/install layer should actually add, **excluding host/framework baseline packages**, which are represented separately in the canonical registry's `hostRequirements` field (see below). Button's `dependencies` is now `[]`, since it has no third-party package need of its own; `react`, `react-dom`, and `next` moved to `hostRequirements` instead.

This was treated as a version-bump-worthy contract change rather than a silent data correction because a consumer relying on the original documented meaning (e.g., "install everything in `dependencies`, including the framework") would now see materially different data under the same field name — the JSON shape never moved, but the externally observable meaning did.

**`hostRequirements` stays canonical-only for now — not exposed in `/registry.json`.** It exists on `ComponentRegistryEntry` (`lib/component-registry.ts`) and is populated for Button (`["react", "react-dom", "next"]`), but is deliberately not added to `PublicRegistryEntry` in this pass, following the same discipline already established for the 1.2.0 fields: wait for at least one more real component to populate it, or an actual distribution consumer to need it, before committing to a public shape. `lib/seo.test.ts` asserts the serialized public registry never contains the string `"hostRequirements"`, guarding against an accidental leak.

**Three version concepts stay independent — do not conflate them:**
- A component's own `version` field (e.g. Button's `"0.1.0-beta"`) — changes when that component's implementation changes.
- `CANONICAL_REGISTRY_SCHEMA_VERSION` (`lib/component-registry.ts`, currently `"1.0.0"`) — versions the shape of the canonical `ComponentRegistryEntry` type itself.
- `PublicRegistryMetadata.schemaVersion` (`lib/registry-public.ts`, now `"1.4.0"`) — versions the derived, public `/registry.json` output shape and its documented field semantics. This is the one this section is about; the other two are unaffected by it.

### shadcn-compatible distribution layer — Foundation + Button (2026-08-08)

A shadcn/ui-compatible transport layer shipped for Foundation + Button
only, generated from the canonical registry rather than hand-maintained.
Proven end-to-end beforehand via a POC: a real `npx shadcn@latest add
@skrewww/button` install into a fresh, Tailwind-free `create-next-app`
project succeeded with zero manual repair — correct file placement,
Foundation auto-resolved once via `registryDependencies`, correct
Shape/Surface mode behavior, working `.sr-only`, no unexpected npm
packages, passing lint/typecheck/build. Full detail, mapping rules, and
follow-ups in
[`docs/architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

**This is implemented independently from the previously documented
`@skrewww/core` + `npx skrewww` roadmap** (see
`skrewww-claude-project-instructions.md`'s "Distribution Model" section,
still unimplemented). The shadcn layer is, as of this date, the first
Skrewww distribution mechanism actually proven working end-to-end; the
long-term relationship between the two roadmaps has not been decided.

Key facts:
- New: `lib/shadcn-registry-generator.ts` (pure, tested generation logic),
  `scripts/generate-shadcn-registry.ts` (file-writing CLI entry point,
  wired into `npm run build` via a new `generate:registry` script).
- Output (`public/r/foundation.json`, `public/r/button.json`, served at
  `/r/{name}.json`) is generated at build time and gitignored, not
  committed — same treatment as `/registry.json`, which this feature does
  not modify.
- No canonical schema change: `lib/component-registry.ts`,
  `CANONICAL_REGISTRY_SCHEMA_VERSION`, `lib/registry-public.ts`, and
  `PublicRegistryMetadata.schemaVersion` (`"1.4.0"`) are all untouched.
- Two known follow-ups recorded but deliberately unresolved: `icons.tsx`
  transport coupling (Button ships the whole file for one export) and a
  consumer-side ESLint warning divergence — see the architecture doc for
  the measured numbers. Neither `icons.tsx` nor any ESLint config changed
  in this pass.
- No CI added. This repo has no `.github/workflows/` yet; drift
  protection for this feature relies on the existing local
  `npm run test:all` gate (`test` validates the generator's pure
  functions, `build` runs real generation).

### Automated external-consumer smoke test — 2026-08-09

`npm run smoke:consumer` is now implemented as the automated Tier B
distribution regression test. It scaffolds a fresh Tailwind-free
Next.js consumer in OS temp storage, serves locally generated Skrewww
registry manifests, verifies `@skrewww/button` resolution through
shadcn, recursively confirms `@skrewww/foundation` installation,
validates expected file placement and npm dependency delta, wires
Foundation CSS, renders Button in a real consumer page, and requires
`next build` to pass. The first verified run passed end-to-end in ~45
seconds with no unexpected filesystem or package changes.

The smoke test is intentionally not part of `npm run test:all` because
it is a slower external-consumer integration check involving fresh
project scaffolding and npm/shadcn tooling. Full architecture and
manual external-consumer verification details remain in
[`docs/architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

### Card added to shadcn distribution — 2026-08-09

Card became the second component (after Button) distributed through the
shadcn-compatible layer, reusing the same generator mechanism with no
architectural change. `https://skrewww.com/r/card.json` passed all 13
production verification checks (byte-identical to a local build of the
exact deployed commit, correct manifest fields, zero `hostRequirements`
occurrences in the public payload, `/r/foundation.json`/`/r/button.json`
unaffected). Tier B (`npm run smoke:consumer`) now takes an optional
component argument (`-- button` / `-- card`, defaulting to `button`), and
both pass end-to-end. No public registry schema-version bump was needed.
Full mechanics and verification detail in
[`docs/architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

### Text Input, Form Field, and Validation Message added to shadcn distribution — 2026-08-09

Three form-layer components — Text Input, Form Field, and Validation Message —
became the third milestone for the shadcn distribution layer, proving the
multi-hop registry dependency chain and npm-package resolution in a real scenario.
All three endpoints (`https://skrewww.com/r/text-input.json`, `/r/form-field.json`,
`/r/validation-message.json`) passed production verification — HTTP 200, valid JSON,
correct manifest fields, byte-identical to the deployed commit (`5e3a2f0`),
and all prior endpoints (`/r/foundation.json`, `/r/button.json`, `/r/card.json`)
remained unaffected. Tier B smoke test (`npm run smoke:consumer -- text-input`)
passed end-to-end: Text Input's dependency chain auto-resolved Form Field and
Validation Message; `@phosphor-icons/react` installed as the only net-new npm
package (Validation Message's real dependency); shared `lib/cn.ts` across all
three components resolved to a single final file; consumer build succeeded.
Verified facts:

- **Dependency chain**: Text Input → Form Field → Validation Message → @phosphor-icons/react + Foundation
- **First real npm package in the layer**: Validation Message's `dependencies: ["@phosphor-icons/react"]` (no prior manifest had non-empty `dependencies`)
- **Shared file resolution**: `lib/cn.ts` transported by all three manifests, installed once
- **No regression**: All 6 endpoints now live; no prior regression
- **No schema bump needed**: Three-component dependency chain fits existing registry-item shape

Full detail in
[`docs/architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

### Implemented inventory by category

| Category | Components |
|----------|------------|
| Actions | Button, Link |
| Containers & Overlays | Accordion, Card, Dialog, Drawer, Popover |
| Content & Data | Avatar, Banking Account Card, Banking Balance Summary, Banking Transaction Row, Bar Chart, Calendar Day, Calendar Grid, Data Table, Divider, Empty State, Line Chart, List Item, Table, Tag, Timeline, Tree View |
| Forms | Checkbox, Combobox, Date Picker, File Upload, Form Field, Radio, Radio Group, Search Field, Select, Switch, Text Input, Textarea, Validation Message |
| Feedback | Alert, Badge, Progress Bar, Skeleton, Spinner, Toast, Tooltip |
| Navigation | Breadcrumb, Menu, Pagination, Tabs |

## Figma status

**Partially resolved** — Combobox confirmed 2026-07-13, updated 2026-07-15 (Multi-select removed from Figma, option-list anatomy now confirmed present); File Upload confirmed 2026-07-15 (single-file and multi-file anatomy both Figma-confirmed); Data Table MCP verification still required

- Starting node from brief: `2002:2365`
- Combobox component-set node ID: **`2024:2480`** ("Forms/Combobox", section `2024:2501`) — confirmed via Figma MCP on 2026-07-13, after resolving a competing Desktop Bridge instance on port 9224 that had caused the prior timeout. **Updated 2026-07-15**: the `Multi-select` boolean property and its Chips frame were removed from Figma entirely (no corresponding code capability ever existed); a new demo frame ("Combobox (example — open)", node `2113:2`) now confirms option-list/listbox anatomy directly — plain label text only, no icon, no description, matching `ComboboxOption`'s real type. A token gap was found (not fixed): `semantic/surface/subtle`, used by the selected-option background, has no Figma variable (see [`combobox-parity.md`](architecture/combobox-parity.md))
- File Upload component-set node ID: **`2024:2649`** ("Forms/File Upload") — confirmed via direct Figma property inspection on 2026-07-15: 5 state variants (Empty/Dragging/Error/Disabled/Filled) + File Name text property. **Both single-file and multi-file anatomy are Figma-confirmed.** The Filled variant (node `2024:2648`) is a vertical list container holding one or more File Row frames (first: node `2107:10`, File Icon + File Name + Remove Icon); the base variant shows one row (single-file as a list of one), and a multi-file example frame (node `2108:21`) shows three. React's existing `multiple`/`maxFiles`/independently-removable file list already matches this structure — nothing to change (see [`file-upload-discovery.md`](architecture/file-upload-discovery.md), `FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS = "confirmed-present"` in `lib/file-upload-figma-metadata.ts`)
- Data Table component-set node ID: unresolved — Figma verification still pending, but **not blocking**: the sorting-only MVP (external Pagination composition) approved 2026-07-13 was implemented 2026-07-15 as a React-first product, same precedent as Table (see [`table-foundation.md`](architecture/table-foundation.md), [`data-table-discovery.md`](architecture/data-table-discovery.md))
- Tree View component-set node ID: **confirmed 2026-07-18** — "Content/Tree Item" component set is node `2058:1988` (State variants: Default `2058:1985`, Hover `2058:1986`, Selected `2058:1987`); the "Tree View (example)" composed demo is node `2058:1998`; parent section "Content/Tree View" is node `2058:2071`. This closes the one open item from the 2026-07-18 implementation — the component structure, properties, tokens, and 20px-per-depth indentation convention were already accurately described and implemented against; only the node IDs themselves were missing from the record (see `lib/tree-view-figma-metadata.ts`, `TREE_VIEW_FIGMA_AUDIT_STATUS = "verified-2026-07-18"`)
- Bar Chart / Line Chart component-set node IDs: **confirmed 2026-07-18** — parent section "Content/Charts" is node `2058:2568`; "Bar Chart (example)" frame is node `2058:2532`; "Line Chart (example)" frame is node `2058:2559`. Both examples are illustrative/minimal (establishing color, stroke weight, and marker style), not full chart specs — axes beyond Bar Chart's month labels, legends, and multi-series were never shown in Figma and are documented as deliberate v1 deferrals, not gaps (see `lib/charts-figma-metadata.ts`, `CHARTS_FIGMA_AUDIT_STATUS = "verified-2026-07-18"`)
- Timeline component-set node ID: **confirmed 2026-07-24** — "Content/Timeline Item" component set is node `2058:2092` (Title/Timestamp/Description text properties + State: Default/Highlighted variant); the "Timeline (example)" composed demo is node `2058:2102`; parent section "Content/Timeline" is node `2058:2130`. This closes the one open item from the 2026-07-19 implementation — the component structure, properties, tokens, and positional (not state-coupled) connector suppression were already accurately described and implemented against; only the node IDs themselves were missing from the record. Confirmed anatomy: Default is a 10x10 stroke-only dot (1.5px, semantic/action/primary) + a 2x48px Connector Line (semantic/border/default); Highlighted is a 12x12 solid-fill dot (semantic/action/primary), no stroke; Title is always semantic/text/primary, Timestamp/Description always semantic/text/secondary in both states. The last item's connector is structurally absent (no Connector Line child at all), not merely hidden — there is no formal "Show connector" boolean property (see `lib/timeline-figma-metadata.ts`, `TIMELINE_FIGMA_AUDIT_STATUS = "verified-2026-07-24"`)
- Variable collection counts, page inventory, and current component-set totals: **not verified in this pass**

Historical Figma snapshots must not be treated as current state. See [`skrewww-figma-practices-instructions.md`](../skrewww-figma-practices-instructions.md).

## Quality-gate status

**Last verified: 2026-07-25** (Layer 4 Industries IA restructuring; see note below)

| Gate | Result |
|------|--------|
| `npm run verify:node` | Pass (Node 24.14.0, requires >=20.19.0) |
| `npm run verify:package` | Pass (`skrewww-docs@0.2.0-beta` lockfile aligned) |
| ESLint | Pass — 26 problems (0 errors, 26 warnings), `--max-warnings 26` |
| TypeScript | Pass |
| Vitest | **590 tests** across **75 files** — unchanged from the Banking pilot pass; the Industries IA change is registry/nav/routing data, not new test surface |
| Playwright | **160 tests** (isolated `.next-playwright` on port 3100) — unchanged from the Banking pilot pass |
| Production build | Pass — Turbopack (default bundler), **80/80 pages** (+2 new `/components/industries` and `/components/industries/banking` pages), no webpack fallback needed |
| `npm audit` | **2 high-severity vulnerabilities remain, deliberately unresolved** — `next` (multiple CVEs) and its transitive `sharp` dependency; both require `next@16.3.0` via `npm audit fix --force`, outside the currently pinned exact `"next": "16.2.10"`. 4 other advisories (`brace-expansion`, `js-yaml`, `postcss`, `undici`) resolved 2026-08-07 via plain `npm audit fix` — no `package.json` change, no version outside stated ranges. See note below. |

**Next.js major upgrade — resolved 2026-07-13**: Upgraded 14.2.35 → **16.2.10**
(React 18 → **19.2.7**, ESLint 8 → **9.39.5** with flat config). Closes the
"requires jumping to Next 16.x" note in
[`components/README.md`](../components/README.md). Async params/searchParams
migration applied to both dynamic routes (`app/components/[slug]`,
`app/components/category/[categorySlug]`); 5 React 19 `element.ref`
deprecation call sites fixed (Popover ×2, Dialog, Drawer, Tooltip); one
genuine Turbopack CSS build failure fixed (`@import` reordered before
`@tailwind` directives in `app/globals.css`, see `app/globals.css`). A
regression here has a dedicated tripwire covering all 5 call sites:
`Popover.test.tsx` has one "does not access the deprecated element.ref API"
test for `PopoverTrigger` and one for `PopoverAnchor` (the one Combobox
composes), and `Dialog.test.tsx`/`Drawer.test.tsx`/`Tooltip.test.tsx` each
have one — every test spies on `console.error` with an explicit caller ref
attached (2026-07-14).

**Build page count 71 → 70 — root cause confirmed (2026-07-14)**: `npm run
build`'s summary line dropped from `71/71` (Next 14.2.35) to `70/70` (Next
16.2.10). **No route or content page was lost** — confirmed by instrumenting
both versions' bundled `next/dist/export/index.js` to dump the exact raw path
array each version iterates to produce its "Generating static pages (X/X)"
count (not the printed `Route (app)` table, the actual internal list):

- **Next 14** counts **71** paths, and that raw list explicitly includes
  `/404` and `/500` as two individually-enumerated, separately-counted export
  paths, alongside `/_not-found` (68 shared content/static routes + `/_not-found`
  + `/404` + `/500` = 71).
- **Next 16** counts **70** paths. Its raw list has no `/404` or `/500` entries
  at all — instead it has `/_global-error` (a new App Router global-error-boundary
  route) alongside `/_not-found` (68 + `/_not-found` + `/_global-error` = 70).
  Next 16's `build/index.js` (`moveExportedPage("/_error", "/404", "/404", ...)`
  and the equivalent for `/500`) still writes `pages/404.html` and
  `pages/500.html` to disk — confirmed present in both versions' output — but
  does so as a cheap post-build **copy** from the already-rendered `/_error`
  output rather than running them through the enumerated, individually-counted
  static-generation worker loop that Next 14 used.

Net effect: Next 14 individually counted 3 framework-level fallback routes
(`/_not-found`, `/404`, `/500`); Next 16 counts 2 (`/_not-found`,
`/_global-error`), folding the legacy pages-router-style `/404`/`/500`
generation into an uncounted copy step. That's exactly the -1 delta (71→70),
fully independent of the redirect aliases (`form-field-wrapper`,
`accordion-item`; those are handled entirely by `next.config.js`'s
`redirects()` and were never counted as generated pages in either version).
**70/70 is the correct, current number** and requires no further action.

**Data Table MVP implemented (2026-07-15)**: The narrow scope approved
2026-07-13 in [`data-table-discovery.md`](architecture/data-table-discovery.md)
(sorting only, external Pagination composition) is now built — no columns/rows
prop API; the consumer still writes real `Table`/`TableHead`/`TableBody`
markup and drops in `DataTableSortHeader` for sortable columns.
`useDataTableSort` is a dual controlled/uncontrolled sort-state hook using
`lib/use-controllable.ts` (same pattern as Accordion/Dialog/Drawer/CalendarGrid
range mode) — chosen over a component-prop-only API because it keeps
`DataTableSortHeader` a purely presentational, stateless component (resolved
direction + click handler in, nothing else), pushing all controlled/
uncontrolled complexity into one hook rather than every header cell. Sort
cycle per column: none → ascending → descending → none; activating a
different column always resets it to ascending. `figmaAvailability:
"unavailable"` — no Figma component set exists yet for Data Table. Registry
count moved 39 → 40, Figma-documented count 55 → 56 (new `content/content-data.ts`
entry, required for `/components/data-table` to resolve rather than 404),
indexable slugs 54 → 55.

**npm audit — 2 moderate findings resolved via override (2026-07-15)**: The
PostCSS XSS advisory ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93))
previously reported twice by `npm audit` (once as a direct finding, once via
`next`'s dependency on it) was vendored inside Next 16.2.10's own nested
`node_modules/next/node_modules/postcss@8.4.31` copy — an upstream Next.js
packaging issue, not a problem with this repo's own dependency choices.
Added a root `"overrides": { "postcss": "^8.5.10" }` in `package.json` and
bumped the direct `postcss` devDependency to the same range (npm's
`assertRootOverrides` check rejects an override whose range doesn't match a
package that's also a direct dependency — this is the standard, documented
resolution, not a workaround). `npm install` then fully deduplicated the
tree: `node_modules/next/node_modules/postcss` no longer exists at all: a
single shared `postcss@8.5.19` resolves everywhere, confirmed by direct
inspection of `node_modules/`, not just trusting the audit output.
**`npm audit` now reports 0 vulnerabilities.** All gates (lint, typecheck,
515 Vitest tests, 131 Playwright tests, 71/71-page Turbopack build)
re-verified clean afterward — the version bump didn't disturb Tailwind's
PostCSS pipeline.

**npm audit — 4 of 6 findings resolved via plain `npm audit fix`, 2 deliberately deferred (2026-08-07)**:
The 0-vulnerabilities state above did not hold indefinitely — the advisory
database is not static, and new CVEs get published against already-installed
dependency versions with no code change on this repo's side. A later audit
found the count had risen to 6 (1 moderate, 5 high): `brace-expansion`,
`js-yaml`, `postcss` (a different, newer advisory than the one fixed above),
`sharp`, `undici`, and `next` itself (several CVEs, including SSRF via
attacker-controlled rewrite destinations and a Server Actions DoS). Running
plain `npm audit fix` (no `--force`) resolved `brace-expansion`, `js-yaml`,
`postcss`, and `undici` — all via transitive dependency bumps within their
existing semver ranges (confirmed via `git diff package.json`: zero changes;
`package-lock.json` only). **2 high-severity vulnerabilities remain,
deliberately unresolved**: `next` and its transitive `sharp` dependency both
require `npm audit fix --force`, which would install `next@16.3.0` —
outside the currently pinned exact `"next": "16.2.10"`. Per the same
decision category as the earlier Next 14.2.35→16.x upgrade (evaluated and
deferred separately, not forced through an audit-fix command), this bump is
left as an explicit, separate decision for the project owner rather than
applied silently. Until that decision is made, **`npm audit` reports 2 high
severity vulnerabilities, not 0** — this file will be updated again when
that decision lands.

## Recently shipped

**Verified from code / documented architecture** — see [`calendar-foundation.md`](architecture/calendar-foundation.md)

- **Calendar Grid month/year drill-up subviews** (2026-07-12) — three internal drill levels (day/month/year) with dedicated `CalendarMonthCell`/`CalendarYearCell` components, focus restoration on drill transitions, and range enforcement via `isMonthFullyDisabled`/`isYearFullyDisabled`
- **Calendar Grid date-range selection** (2026-07-12) — opt-in `mode="range"` with `rangeValue`/`defaultRangeValue`/`onRangeValueChange`, live keyboard+hover provisional preview, chronological auto-swap on a backwards second click, and disabled-dates-in-the-middle handling
- **Data Table MVP** (2026-07-15) — the narrow scope approved 2026-07-13 (sorting only + external Pagination) is now implemented at `/components/data-table`: `DataTableSortHeader` composes `TableHead` with a real button, `aria-sort`, and a direction indicator; `useDataTableSort` is a dual controlled/uncontrolled sort-state hook (`lib/use-controllable.ts` pattern) with a none → ascending → descending → none cycle per column. No `columns`/`rows` prop API — the consumer still writes real `Table`/`TableHead`/`TableBody` markup. Row selection, sticky headers, density, and virtualization remain deferred; see [`data-table-discovery.md`](architecture/data-table-discovery.md)
- **Layer 3 (Shape) radius-token rebinding — 5 of 8 flagged components fixed in Figma (2026-07-17)**: a prior radius-token sweep flagged 8 components whose Figma-side radius binding pointed at the wrong token layer. Confirmed via direct Figma inspection (61 variants checked, zero inconsistencies), Figma-side only — no React code, test, or component-registry changes required, since these components' `tokensUsed` entries already named the correct semantic token:
  - **Actions/Link** (all 42 variants) — rebound from `radius/xs` (Primitive, 2px) to `component/radius/control` (Shape-aware). Real visual change: now renders 4px in Rounded mode, matching Button's control-scale.
  - **Forms/File Upload** (all 5 variants) — rebound from `radius/lg` to `component/radius/container`. No visual change (12px both ways); now properly Shape-aware.
  - **Feedback/Alert** (all 4 variants) and **Feedback/Toast** (all 4 variants) — same fix, same reasoning, no visual change.
  - **Feedback/Skeleton** — handled per sub-shape: Text rebound to `component/radius/control` (no visual change); Rectangle rebound to `component/radius/container` (4px → 12px, deliberate — matches container scale for a large placeholder block); Circle deliberately left at `radius/full` (fixed-circular exception, matching Badge/Avatar/Calendar Day — rebinding would visibly break it into a non-circular shape outside Pill mode).
  - **Not gaps, confirmed intentional exceptions**: Badge, Avatar, and Calendar Day remain fixed-circular at `radius/full` — the remaining 3 of the original 8 flagged components. No further action needed on those.
- **Tree View** (2026-07-18) — the first of the Layer 2 code-side gaps (Tree View, Charts, Timeline) is implemented, built directly against a real, well-documented Figma reference (Content/Tree Item component set + the "Tree View (example)" composed demo — see `docs/project-status.md`'s registry entry for the full token/anatomy citation). `TreeView` renders a flat, depth-first list of rows (`role="tree"`/`role="treeitem"`, not nested DOM groups) with `aria-level`/`aria-setsize`/`aria-posinset` set explicitly per row, since DOM nesting doesn't convey depth here. Indentation is computed as `depth * 20px` padding-left per row (`components/ui/internal/TreeItem.tsx`) — matching the 20px-per-depth unit Figma's own composed example verifies, and explicitly not a fixed set of per-depth variants, which Figma's own component description calls out as the #1 common mistake. `expanded` (string ids) and `selected` (single string | null) are each independently controlled/uncontrolled via `lib/use-controllable.ts` (same pattern as Accordion/Dialog/Drawer/CalendarGrid/Data Table). Keyboard model: roving tabindex (one row in the Tab sequence), ArrowUp/Down move between visible rows, ArrowRight expands + moves onto a newly-revealed first child (deferred via an effect since that child isn't in the DOM until the expand commits) or moves directly if already expanded, ArrowLeft collapses in place or moves to parent, Enter/Space selects. Single-select only — multi-select, drag-and-drop reordering, virtualization, and async/lazy-loaded children are all explicitly deferred, none shown in the Figma reference. Icon is a plain per-node `ReactNode` slot, matching Figma's deliberate lack of a formal icon-swap property. The pre-existing `tree-item` Figma-facing doc entry (`content/content-data.ts`) was not rewritten — it now carries a `knownLimitation` note pointing to Tree View as the real, implemented, canonical pattern.
- **Bar Chart and Line Chart** (2026-07-18, corrected 2026-07-19) — the second of the Layer 2 code-side gaps, built on **recharts 3.9.2** (added as a new dependency; 0 npm audit vulnerabilities) against Figma's "Content/Charts" section (Bar Chart (example) node `2058:2532`, Line Chart (example) node `2058:2559`). Two separate components, matching Figma's own separation into two distinct examples — not one polymorphic `Chart` component. Both take identical single-series data (`{ label: string; value: number }[]`) plus a required `label` prop (the chart's accessible name). Color reuses the existing `semantic/action/primary` token (aliased as `--bar-chart-fill`/`--line-chart-stroke` in `styles/tokens.css`) — no new semantic token invented. Bar Chart renders bars + X-axis month labels only (axisLine/tickLine both disabled, no Y-axis/gridlines/legend/tooltip); Line Chart renders a single stroked path + hollow-ring point markers with no axes at all — both match their respective Figma examples exactly. **Accessibility mechanism**: each chart's SVG is `aria-hidden`, wrapped in a `role="img"` container with `aria-label` (the `label` prop) and `aria-describedby` pointing at a visually-hidden (`sr-only`) `<table>` containing the same label/value pairs — bar heights and line paths convey nothing to assistive tech on their own, so this is a real WCAG mechanism, not optional polish. Deliberately deferred for v1 (documented in each registry entry's `openQuestions`, not silently absent): multi-series support, interactivity (hover tooltips, legend interactivity), and a Y-axis/gridlines beyond Bar Chart's existing month labels — none of these are shown in the Figma reference.
  - **Corrected 2026-07-19, two items**: (1) Both components now use recharts's **`ResponsiveContainer`** (fluid width, fixed height — default 240) instead of the original fixed pixel width/height. The original fixed-size decision was justified partly by a jsdom/ResizeObserver test limitation, which isn't a legitimate reason to constrain the shipped component's real-world sizing — a real consumer needs the chart to fill a variable-width dashboard/card. Fixed the actual test-environment problem instead: added a `ResizeObserver` polyfill to `vitest.setup.ts` (there was no prior global one) that synchronously supplies a fixed, nonzero `contentRect` on `observe()`, which is what `ResponsiveContainer` actually reads (not a second `getBoundingClientRect()` call). This also exposed and fixed a pre-existing dormant bug in `useFloatingPosition.test.ts`, whose own local `ResizeObserver` mock was an arrow function (not a valid constructor) — it had never run for real because that test always early-returned when `ResizeObserver` was undefined. (2) Line Chart's curve type is now **`"linear"`**, not `"monotone"`. The original `"monotone"` choice was an unverified default; checked directly against the real Figma vector path (node `2058:2560`) via the Figma Plugin API — the raw path data is `M 0 140 L 43.3 93.3 L 86.7 110.8 L 130 43.75 ...`, every segment a straight `L` (lineto) command with no curve commands at all. A regression-guard test now asserts the rendered path contains no `C`/`Q`/`S`/`T` curve commands.
- **Timeline** (2026-07-19) — the third and last of the Layer 2 code-side gaps (Tree View, Charts, Timeline), closing out all of Layer 2 entirely. Built against Figma-facing prose already recorded in `content/content-data.ts` (State: Default outlined ring / Highlighted larger solid dot; Title/Timestamp/Description fields) plus specific behavioral facts confirmed directly: connector-line suppression is purely positional (only the last item omits it, entirely independent of `state`), and the Description wraps at 220px in the Figma reference rather than truncating. At implementation time, no numeric Figma node ID had been given or verified for Timeline, unlike Tree View/Charts; this was confirmed 2026-07-24 (see Figma status above; `lib/timeline-figma-metadata.ts`, `TIMELINE_FIGMA_AUDIT_STATUS = "verified-2026-07-24"`). `Timeline` composes an internal `TimelineItemRow` (not publicly exported, matching Tree View/Tree Item's split) into a real `<ol>`. The connector's length is computed via CSS (`flex: 1` inside a grid row stretched to the taller of its two columns), not a fixed pixel value, so it reaches the next item's marker regardless of how long that item's description makes the row — verified with a deliberately long, multi-paragraph description in both the test suite and a live visual check (the connector visibly stretched to match). Seven edge cases were verified against existing repo precedent rather than invented: (1) an empty `data` array renders nothing — no other collection component in this codebase (Table, Tree View, Bar Chart, Line Chart) has an established empty-state convention, confirmed by checking each one and finding no internal `EmptyState` composition anywhere; (2) a single item never has a connector, which falls out automatically from computing `isLast` as `index === data.length - 1` rather than needing a special case; (3–4) with multiple items, only the positionally-last one omits its connector — including a dedicated test where the *last* item is explicitly `state: "default"`, to catch an implementation that incorrectly couples connector visibility to `state === "highlighted"` instead of actual position; (5) a `Highlighted` item in the middle keeps its connector and renders its larger marker correctly with no special-casing needed, since `state` and `isLast` are independent props; (6) no truncation is applied to Title or Timestamp — checked `List Item` (which does truncate to a single line) against `Alert` and `Card` (which don't truncate their titles at all); since Figma's own reference shows the Description wrapping rather than truncating, and List Item's dense single-line-row context isn't comparable to Timeline's larger content blocks, natural wrapping was used everywhere instead of truncation.

## Layer 4 pilot — Banking (first Industry Systems pilot)

**Implemented 2026-07-25** — the first Layer 4 (Industry Systems) pilot, not a Layer 2 gap and not folded into "Major parity gaps" below. Three components, genuinely greenfield: confirmed via a full Figma file search (every page checked) that no Industry Systems page and no Banking-related frame or component exists anywhere in the design file. Figma status for all three is **React-first, Figma parity pending** — no reference exists, none was invented (see `lib/banking-figma-metadata.ts`, `BANKING_FIGMA_AUDIT_STATUS = "confirmed-no-reference-2026-07-25"`, a confirmed *absence*, not Table/Data Table's "unresolved-mcp" pending-check status). `category` on all three registry/content entries is **Content & Data**, unchanged — that field still describes the underlying component kind. **Navigation/IA note (superseded same day, see the section directly below)**: at initial implementation, no distinct nav grouping existed yet and these three were reachable only via their `category`, indistinguishable from Layer 2 Content & Data components except by name prefix — corrected the same day by the "Industries" navigation structure below, once Healthcare's future addition made the gap in reachability structurally clear.

- **Banking Transaction Row** (`/components/banking-transaction-row`) — **Composes:** List Item (row shell) + Avatar (merchant logo/initials) + Badge (status) + Popover (detail-view trigger, anchored via `PopoverAnchor` since List Item doesn't forward a ref). Chose **Popover over Drawer**: Popover's own documented purpose ("non-modal floating panel for supplementary or lightly interactive content anchored to a trigger") precisely matches viewing a handful of read-only detail fields for one row without leaving the list; Drawer's placement is currently left-edge-only (`DrawerPlacement = "left"`), an unconventional position for a per-row detail panel, and its own description ("supplementary settings, filters, or secondary forms") targets a heavier use case. Status (`success`/`warning`/`error`) drives both the Badge variant and the amount's color via the existing `semantic/feedback/success`, `semantic/feedback/warning`, and `semantic/action/danger` tokens — no new colors.
- **Banking Account Card** (`/components/banking-account-card`) — **Composes:** Card (surface shell, title + footer slots) + Tag (account type) + Button (action trigger, in Card's footer) + Line Chart in sparkline mode (balance history). Glass Surface + Pill Shape inheritance was verified live via computed-style inspection (not assumed): the same Account Card instance resolves `border-radius: 12px` / `background-color: rgb(255,255,255)` under the default Rounded+Flat mode, `border-radius: 16px` under Pill Shape, and `background-color: rgba(255,255,255,0.72)` under Glass Surface — purely from Card's own `--shape-radius-container`/`--surface-fill-default` custom properties, zero Account-Card-specific surface code.
- **Banking Balance Summary** (`/components/banking-balance-summary`) — **Composes:** Card (layout wrapper, title slot) + Tabs (time-range filter, one `TabsPanel` per range) + Bar Chart (one instance per range, inside its own panel — real per-range data, not one dataset re-scaled) + Skeleton / `SkeletonLoading` (loading state). Tabular numbers use the existing, already-established `font-variant-numeric: tabular-nums` convention (found in `table.module.css`, `progress-bar.module.css`, `pagination.module.css`, `badge.module.css`) applied directly to the balance/total figure classes — no new CSS convention introduced.

**Real Layer 2 extensions surfaced and fixed, not worked around** (the "compose, never duplicate" principle's first real test case):
- **List Item** gained optional `aria-expanded`/`aria-haspopup`/`aria-controls` passthrough on its action-mode button (`components/ui/ListItem.tsx`) — Banking Transaction Row's row needed to announce the anchored Popover's open/closed state, and List Item had no way to accept disclosure ARIA attributes at all. Extension is additive and no-ops on navigational/static rows.
- **Line Chart** gained an optional `sparkline` prop (`components/ui/LineChart.tsx`) — the base chart already has no axes/gridlines/legend by design, so a small `height` alone gets most of the way to a sparkline, but its hollow-ring point-marker dots are unconditional in the base design and dominate the visual at sparkline scale. `sparkline` suppresses the dots and uses a thinner 1.5px stroke (vs 2px); data and accessibility (role="img" + hidden data table) are unchanged.

No new industry-specific tokens were introduced — every token used aliases to existing Foundation/Semantic tokens (`semantic/feedback/success`, `semantic/feedback/warning`, `semantic/action/danger`, `semantic/text/primary`, `semantic/text/secondary`), consistent with the existing Industry-token rule.

## Layer 4 navigation/IA — "Industries" as a distinct nav structure (2026-07-25)

**Real information-architecture fix, same day as the pilot above but a separate decision.** Before this, the three Banking components were reachable only via `category: "Content & Data"` — visually indistinguishable from real Layer 2 Content & Data components (Avatar, Tag, Table, ...) except for the "Banking" name prefix. This is corrected structurally, not cosmetically, because Healthcare and other industries are on the roadmap and need to nest cleanly as siblings, not as a rework.

**Schema decision**: a new, optional `industry` field, orthogonal to `category` (which is unchanged on all three entries — it still describes the underlying component kind, e.g. "Content & Data"). `industry` is the authoritative signal for a two-level Industries > {industry} nav grouping, additive on top of the existing category system rather than a redesign of it:

- `lib/industry-content.ts` (new file, mirrors `lib/category-content.ts`): `industries` array (currently `["Banking"]`, extensible), `IndustryName` type, `industrySlugMap`, `industryPageContent` (summary/description/accessibility/status per industry), `getIndustryPageHref`, `getIndustryNameFromSlug`, and `INDUSTRIES_INDEX_HREF`.
- `ComponentRegistryEntry.industry?: IndustryName` (`lib/component-registry.ts`) and `ComponentDoc.industry?: string` (`lib/types.ts`) — both optional, undefined for every Layer 2 component. Set to `"Banking"` on all three pilot entries in both `lib/component-registry-content-data.ts` and `content/content-data.ts`.
- `PublicRegistryEntry.industry?: string` (`lib/registry-public.ts`) — exposed in `/registry.json`. Schema version bumped **1.2.0 → 1.3.0** (additive).
- `getIndustryIndexing()` added to `lib/indexing-policy.ts`, mirroring `getCategoryIndexing()`.

**New routes**:
- `/components/industries` — a new top-level index, the direct peer of `/components` (lists each industry with a link, mirroring how `/components` lists each Layer 2 category).
- `/components/industries/[industrySlug]` — one page per industry (`/components/industries/banking` today), structured identically to `/components/category/[categorySlug]` — breadcrumb, summary/description/status/accessibility content, and the implemented-components list filtered by `entry.industry === industry`.

**Sidebar** (`components/SidebarNav.tsx`): industry-classified components are excluded from their `category` group (`!component.industry` filter) and instead rendered in a new "Industries" section below the six Layer 2 category groups, visually separated (a top border + brand-colored "Industries" label), with "Banking" as its own indented sub-label above the 3 components — two levels of grouping, matching the two-level nav requirement. `/components/page.tsx` gets the same exclusion plus a pointer to the new Industries index.

**Breadcrumbs and JSON-LD corrected** — industry-classified component pages now show **Home → Industries → Banking → [Component]** instead of **Home → Components → Content & Data → [Component]**:
- `ComponentBreadcrumbs` (`components/docs/ComponentPageMeta.tsx`) looks up the registry entry's `industry` field (via the `slug` prop it already receives) and branches the crumb trail — no new prop threading required of callers.
- `componentPageJsonLd` (`lib/structured-data.ts`) branches its `BreadcrumbList` the same way; `articleSection`/`keywords` use `industry` when present instead of `category`. A new `industryPageJsonLd` mirrors `categoryPageJsonLd` for the new industry pages. `categoryPageJsonLd`'s implemented-component count now excludes industry-classified entries (`!entry.industry`), matching the sidebar/index-page exclusion.

**Sitemap and llms.txt**: `lib/sitemap-data.ts` adds the Industries index and each industry page (same priority tier as category pages). `lib/llms-content.ts` adds an "Industries (Layer 4 — distinct from Component categories above)" section listing the Industries index and each industry page, directly below "Component categories".

**Homepage** (`app/page.tsx`): the Layer 4 "Industry Systems" status line, previously hardcoded "Not started" (stale since the pilot shipped), now reads "Banking pilot (3 components)".

**Not done, deliberately**: no changes to the three Banking components' own code (`BankingTransactionRow.tsx` etc.) — this was registry/navigation/routing structure only. `category` was left as `"Content & Data"` on all three rather than invented a new Layer-2-style category value, since `industry` is the correct, additive signal for this and changing `category` would have been a needless second source of truth for the same fact.

## Major parity gaps

**Verified from code / documented architecture**

- Figma MCP verification for File Upload's temporary tokens (component-set node, variants, and File Name property confirmed 2026-07-15 — see below)
- Figma MCP verification for Data Table — no component set exists yet; not blocking (React-first, same precedent as Table)
- File Upload progress UI, preview thumbnails, controlled files, and retry semantics
- Calendar Grid composed range-picker input (two independently-typable start/end text fields + shared calendar, analogous to Date Picker) — judged non-trivial in scope (comparable to rebuilding Date Picker), not built; see [`calendar-foundation.md`](architecture/calendar-foundation.md#composed-range-picker-input--explicitly-out-of-scope)
- ~~Timeline~~ — Tree View, Charts, and Timeline (all three Layer 2 code-side gaps) are now implemented (see Recently shipped). Tree View and Charts' Figma node IDs were confirmed 2026-07-18; Timeline's node ID was confirmed 2026-07-24 (see Figma status above) — no open Figma-verification item remains across all three
- Advanced overlay patterns beyond current Dialog/Drawer/Popover/Menu stack
- Full Style System (Shape/Surface) parity across all components — **Shape/radius partially resolved 2026-07-17**: Link, File Upload, Alert, Toast, and Skeleton confirmed rebound to the correct Shape-aware `component/radius/*` tokens (see Recently shipped); Badge, Avatar, and Calendar Day confirmed as intentional fixed-circular exceptions, not gaps. **Surface substantially resolved 2026-07-17**: Button, Card, and Text Input master components genuinely remediated and fresh-instance-verified across Flat/Gradient/Glass (see the Layer 3 Surface baseline section below), and the Surface/content-cascade audit across the remaining registry (3 batches, 23 components) is now complete, with 2 flagged items still open rather than closed — Menu's Surface fix has no reusable master "Panel" component to live on, and Badge/Alert/Toast carry duplicate tint tokens pending a future consolidation pass (see the Layer 3 Surface audit section below). Gradient mode still has no distinct visual treatment of its own anywhere yet (aliased to Flat)

## Layer 3 Surface baseline

Surface-aware token architecture was prototyped successfully earlier, but a
later master-component audit (2026-07-17) found that the bindings were never
persisted to the actual component masters — `component/surface/content` had
zero real bindings anywhere in the file. Button, Card, and Text Input have
since been genuinely remediated at the master-component level and verified
via fresh-instance testing across Flat/Gradient/Glass. No corresponding claim
of full Surface validation was found in this file or in
[`skrewww-claude-project-instructions.md`](../skrewww-claude-project-instructions.md)
to correct in place — both already treated Surface rollout as open (see
"Broader Style System rollout" there) — so this section is new documentation
of the 2026-07-17 remediation, not a correction of prior text.

**Button — Surface-dependent filled control pattern**

- New tokens: `component/button/primary/background` (+hover, +pressed),
  `component/button/danger/background` (+hover, +pressed),
  `component/button/secondary/background` (+background-elevated, +border)
- Primary/Danger content (Label + icon glyph strokes) bound directly to the
  existing `component/surface/content` token — semantically valid reuse (dark
  background needs light text in Flat/Gradient; light-tinted glass needs dark
  text)
- Secondary's content deliberately unchanged (`semantic/text/primary`,
  `semantic/icon/default`) — its background never darkens enough to need
  switching
- Key finding: Primary/Danger have 3 real background tiers (base, hover,
  pressed) with progressively darker Flat/Gradient values and correspondingly
  tiered Glass opacity — a single shared token per style would have destroyed
  hover/press feedback
- All 45 master variants bound; fresh-instance inheritance verified;
  Flat/Gradient/Glass all verified with no regression

**Card — Surface container pattern**

- New tokens: `component/card/surface`, `component/card/border`
  (deliberately unchanged across Flat/Gradient, same reasoning as Secondary
  Button)
- No content token needed — Title/Body correctly stay `semantic/text/primary`
  and `/secondary` across all 3 modes; verified via fresh-instance testing
  (not assumed) that dark text remains readable against the light-tinted
  Glass background
- Both Elevation variants (Flat, Raised) bound; Raised has no stroke at all
  (construction difference, handled correctly)

**Text Input — Surface form-control pattern**

- New tokens: `component/text-input/surface` (uniform across all 5 states),
  `component/text-input/border` (Default/Disabled tier),
  `component/text-input/border-hover` (Hover tier, more prominent in all
  modes including Glass)
- Focused (focus-ring) and Error (danger) strokes deliberately left
  untouched — real semantic feedback colors, confirmed to stay fully opaque
  in Glass mode rather than fading to translucent
- Value text unchanged (`semantic/text/primary` / `semantic/text/disabled`)
  throughout — verified readable in all 3 modes
- All 15 variants (5 states × 3 sizes) bound; fresh-instance verification
  passed for all 5 states in Flat and Glass

**All three**: raw-paint-matches-binding verified, no local instance
overrides used, fresh instances inherit correctly with zero manual setup.

**Open item**: Gradient mode currently has no distinct visual treatment of
its own for any of these 3 components — it is aliased to the same values as
Flat, because no real gradient-effect mechanism has been established in this
project yet. This needs a design decision before any future component's
Gradient mode is expected to look meaningfully different from Flat.

**Follow-up finding — blur effect (2026-07-17, after the color-token fix
above landed)**: a user visual check in Figma caught that Glass mode still
showed a hard, unblurred seam where a translucent button crossed a
background boundary — proving the color-only fix was incomplete. Root cause:
`component/surface/blur` (an existing token, resolving to 0 in Flat/Gradient
and 16 in Glass) had only ever been applied as an instance-level override on
the old "Layer 3 Validation (Pill + Glass)" demo instances — never bound on
the actual master components. Fixed by adding a BACKGROUND_BLUR effect
(bound to `component/surface/blur`) to all 62 master variants (45 Button, 2
Card, 15 Text Input). Verified on a fresh instance: blur resolves to 0 in
Flat/Gradient, 16 in Glass, purely from mode-switching.

## Layer 3 Surface audit — Batches 1-3 complete

Extends the Button/Card/Text Input baseline above to the rest of the
registry: 3 batches, 23 components checked directly in Figma this session
for the same Surface/content-cascade pattern (color + blur binding at the
master level). Regression check on Button/Card/Text Input ran and passed
clean after every single batch (4 total checks across this session) — no
regressions at any point.

**Batch 1 (11 components — highest contrast risk)**

Fixed:
- Icon Button — reused Button's exact tokens (identical architecture)
- Tag — new `component/tag/surface`
- Badge — 6 new per-style tint-preserving tokens:
  `component/badge/{neutral,primary,success,warning,danger,info}/surface`;
  each style keeps its own color identity at reduced opacity in Glass rather
  than collapsing to generic white
- Alert — new shared `component/feedback/{info,success,warning,danger}/surface`
  family; caught a naming mismatch mid-fix — the "Error" variant maps to the
  "danger" token family, not a literal "error" key
- Toast — reused Card's tokens (a different visual style from Alert despite
  being in the same category)
- Menu — Panel + Item hover fixed, but flagged: no reusable master "Panel"
  component exists, so the fix lives only on the example frame — the same
  structural gap as Combobox's listbox
- Popover, Dialog, Drawer — all reused Card's tokens

Marked not-applicable:
- Link — zero fill across all 45 variants, nothing to cascade
- Tooltip — user decision: stays fixed-dark always, doesn't participate in
  Surface mode

Flagged, not fixed:
- Badge's and Alert/Toast's tint tokens hold identical values under
  different names (`component/badge/danger/surface` vs
  `component/feedback/danger/surface`) — a consolidation opportunity for a
  future cleanup pass, deliberately not touched now to avoid re-risk
  mid-batch

**Batch 2 (12 components — form and interactive controls)**

Fixed:
- Select, Combobox (+ its listbox demo panel built earlier this session),
  Search Field
- Date Picker — trigger + separate Calendar Grid popup panel (two distinct
  surfaces)
- Textarea — all reused Text Input's tokens
- File Upload — reused Card's tokens for Empty/Disabled/Filled; new
  `component/file-upload/dragging-surface` for the Dragging state, whose
  accent border was deliberately left untouched (same treatment as Error's
  danger border)
- Pagination/Page Item — 32px "Current" state reused Button's primary
  background + `component/surface/content` (distinguished from the
  small-control exceptions below since it's Button-scale, not
  Checkbox-scale); Hover reused Menu's item-hover token

Marked not-applicable:
- Checkbox, Radio, Switch — user decision: ~16-24px indicators, blur would
  be nonsensical at that scale
- Radio Group — no Figma component exists, correctly so: it's a pure
  fieldset/legend semantic wrapper with no visual surface of its own
- Tabs — zero fill anywhere in the structure, same as Link

**Batch 3 (12 components — containers and content)**

Fixed:
- Accordion Item and Empty State — both had a raw hardcoded white fill, not
  even bound to a semantic token; found and fixed, reused Card's tokens
- List Item — reused Menu's item-hover token
- Avatar — 24-48px, reused Button's primary background +
  `component/surface/content` for initials text
- Table — demo frame only, matches its known React-first/Figma-parity-pending
  status; reused Card's tokens
- Calendar Day — 32px "Selected" state, same solid-brand pattern as Page
  Item, same token reuse

Marked not-applicable:
- Divider — 1px thick, blur nonsensical
- Skeleton — user decision: loading placeholder, not themed content, stays
  neutral gray regardless of theme
- Progress Bar and Spinner — same functional-indicator rationale as
  Skeleton, small/thin scale
- Breadcrumb — zero fill anywhere, same as Link/Tabs

Calendar Grid: no separate component exists — already covered by the same
panel fixed for Date Picker in Batch 2.

**Open items carried forward** (not closed by this audit):
1. Menu has no reusable master "Panel" component — the Surface fix lives
   only on the example frame (Batch 1)
2. Badge and Alert/Toast maintain duplicate tint tokens with identical
   values under different names — a future consolidation opportunity, not a
   correctness bug (Batch 1)

## Active roadmap

1. **File Upload token verification** — diff the Filled/Empty/Dragging/Error/Disabled variants' token bindings against `file-upload.module.css`'s Temporary aliases now that the component set (`2024:2649`) and both single-file and multi-file anatomy are confirmed
2. **Data Table Figma parity** — MCP audit for a component-set node once available; not blocking (see [`data-table-discovery.md`](architecture/data-table-discovery.md))
3. **Combobox selected-option token gap** (low priority) — `semantic/surface/subtle` (used by `--combobox-option-selected-surface`) has no Figma variable; either add the missing variable or rename the CSS token to an existing one — a separate, deliberate decision, not urgent (see [`combobox-parity.md`](architecture/combobox-parity.md#selected-surface-token-gap))
4. Infrastructure and source-of-truth maintenance — ongoing

## Source-of-truth rules

| Topic | Authority |
|-------|-----------|
| React implementation status | Canonical registry + public exports + tests/build |
| Figma design status | Figma MCP when successful; otherwise marked unresolved |
| Token values in React | `styles/tokens.css` |
| Token values in Figma | Figma variables when MCP-verified |
| Volatile counts | This file + registry-derived tests |
| Durable principles | Standing instruction files + architecture docs |
| Canonical URLs | `NEXT_PUBLIC_SITE_URL` at deploy time |

**Deferred:** treating README prose counts as authoritative without registry derivation.

**Unresolved:** current Figma variable/collection totals until MCP succeeds.
