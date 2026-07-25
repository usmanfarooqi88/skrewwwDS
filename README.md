# Skrewww Docs

Documentation site for the Skrewww design system — token-driven components, native-first form semantics with accessible custom controls where native HTML cannot represent the confirmed interaction model, server-rendered usage guidance, and Beta React implementations with live previews.

## Current status

Volatile counts and roadmap live in [`docs/project-status.md`](docs/project-status.md) (derived from the canonical registry).

- **Beta React components:** count derived from `/registry.json` (`metadata.implementedComponentCount`, `hasImplementation: true`)
- **Figma-documented components:** count derived from `content/` documentation inventory (includes documentation-only entries)
- **WCAG 2.2 AA (target)** accessibility baseline
- **Design system version:** `0.2.0-beta`
- **Node.js:** `>=20.19.0` (see `.nvmrc`)

### Implemented React components

| Category | Components |
|----------|------------|
| Actions | Button, Link |
| Containers & Overlays | Accordion, Card, Dialog, Drawer, Popover |
| Content & Data | Avatar, Banking Account Card, Banking Balance Summary, Banking Transaction Row, Bar Chart, Calendar Day, Calendar Grid, Data Table, Divider, Empty State, Line Chart, List Item, Table, Tag, Timeline, Tree View |
| Forms | Checkbox, Combobox, Date Picker, File Upload, Form Field, Radio, Radio Group, Search Field, Select, Switch, Text Input, Textarea, Validation Message |
| Feedback | Alert, Badge, Progress Bar, Skeleton, Spinner, Toast, Tooltip |
| Navigation | Breadcrumb, Menu, Pagination, Tabs |

Documentation-only pages clearly state **Figma documented · React not implemented · Documentation only** and do not show live previews.

### Control semantics (high level)

- **Checkbox, Radio, Switch, Textarea, Text Input, Search Field** — native or native-first semantics.
- **Select** — custom non-searchable combobox/listbox with hidden native form fallback.
- **Combobox** — editable searchable combobox/listbox with predefined options.
- **Menu** — command menu built on Popover overlay infrastructure.
- **Date Picker** — composes Calendar Grid and Popover.

## Running locally

Requires **Node.js >=20.19.0**.

```bash
npm install
npm run verify:node
npm run dev
```

### Development commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server (uses `.next`) |
| `npm run dev:clean` | Remove `.next` then start dev — use when vendor chunks look corrupted |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest unit tests |
| `npm run test:browser` | Playwright (isolated `.next-playwright` build on port 3100) |
| `npm run test:all` | verify:node + verify:package + lint + typecheck + unit + browser + production build |
| `npm run build` | Production build (uses `.next`) |

Playwright does **not** modify the active dev `.next` cache. You can keep `npm run dev` running on port 3000 while browser tests use `.next-playwright` on port 3100.

Do not run two builds against the same `distDir`. Avoid `next build` while `next dev` is writing to `.next`.

## Site features

- **Live previews** for implemented components
- **Registry API:** `/registry.json` (JSON metadata for all registered components)
- **Sitemap:** `/sitemap.xml` driven by canonical indexing policy
- **Robots:** `/robots.txt` (public docs allowed; GPTBot disallowed; OAI-SearchBot allowed)
- **Structured data:** Organization, WebSite, SoftwareApplication, plus page-level JSON-LD
- **LLM indexes:** `/llms.txt` and generated `/llms-full.txt`
- **Category pages:** `/components/category/{category}`
- **Open Graph image:** `/opengraph-image` (1200×630)

## Architecture

Four layers (homepage):

1. Foundation — tokens, color, type, spacing, accessibility
2. Component Library — Actions, Forms, Navigation, Feedback, Containers & Overlays, Content & Data
3. Style Systems — Shape and Surface personalities via CSS custom properties
4. Industry Systems — planned; see Distribution Model below for how it will ship

Forms use a composed architecture: **FormField** owns label/validation layout; controls prefer native HTML semantics where sufficient; **ValidationMessage** handles field-level feedback only.

Feedback uses shared internal presentation primitives (not public API). **Alert** is persistent inline feedback; **Toast** is transient; **Progress Bar** is measurable progress; **Spinner** is indeterminate loading.

Source-of-truth hierarchy: [`docs/architecture/source-of-truth.md`](docs/architecture/source-of-truth.md)

## Distribution Model (Target Architecture)

**Status: Target Architecture · Under Active Development**

Skrewww has decided on "The Hybrid Registry Model" as its distribution
architecture. **None of this exists yet** — there is no `@skrewww/core` npm
package, no `skrewww` CLI, and no publishing pipeline. Every component today
lives only inside `components/ui/` in this repository, and this docs site
imports them directly for its own live previews.

The decided (not-yet-built) shape:

- **`@skrewww/core`** (npm, Planned) — a centralized token & governance
  package covering Layer 1 (Foundations) and Layer 3 (Style Systems), for
  single-source token governance and a locked WCAG 2.2 AA baseline. Once
  built: `npm install @skrewww/core`.
- **`npx skrewww`** (CLI, Planned) — a copy-owned component and preset CLI
  covering Layer 2 (Component Library) and Layer 4 (Industry Systems), for
  full source ownership in consumer repos with no abstraction wall for AI
  coding tools working against the code. Once built: `npx skrewww add
  <component>` / `npx skrewww init <industry-preset>`, reading from the
  already-live `/registry.json` as its data source.
- **This docs site's role**: canonical source and builder. It imports
  components directly from `components/ui/`, not via the future CLI, and it
  already generates and serves `/registry.json` at runtime as the intended
  HTTP feed for external CLI consumption once that CLI exists. The docs site
  does not dogfood its own CLI.

Full decision record, dated, with the SemVer policy for `@skrewww/core`:
[`skrewww-claude-project-instructions.md`](skrewww-claude-project-instructions.md#distribution-model--decided-target-architecture-2026-07-25).

## Project structure

```
app/                         Next.js App Router pages and routes
components/ui/               React components (public exports via index.ts)
components/ui/internal/      Internal composition primitives (not public)
components/previews/         Client live previews for implemented components
components/docs/             Documentation UI (JSON-LD, API tables, copy actions)
content/                     Figma-derived documentation data by category
docs/                        Architecture notes and project status
lib/                         Registry, SEO, sitemap, indexing policy, site config
scripts/                     Verification scripts (package metadata, Node runtime)
styles/tokens.css            Design tokens (Primitive → Semantic → Component)
```

## Indexing policy

Component indexing is defined once per registry entry (`index` | `noindex`) and drives:

- Sitemap inclusion
- Page `robots` metadata
- LLM index inclusion for implemented components

Redirect aliases (e.g. `form-field-wrapper`) are always excluded.

## Domain policy

- **`skrewww.com`** — reserved brand domain; not assumed live
- **`skrewww.dev`** — production fallback origin in code when `NEXT_PUBLIC_SITE_URL` is unset
- **`NEXT_PUBLIC_SITE_URL`** — deployment authority for canonical URLs, sitemap, JSON-LD, registry
- **`http://localhost:3000`** — local development default
- **`https://skrewww.test`** — recommended test origin in unit tests

## Known limitations

- **Figma MCP verification pending** for several parity audits (including Combobox component-set node ID)
- **Temporary Combobox tokens** — several popup/option values await Figma variable confirmation
- **Multi-select Combobox** — deferred
- **File Upload** — React Beta implemented; live Figma MCP verification, progress UI, and preview thumbnails remain deferred
- **Table** — React-first native HTML table foundation (usability audit complete); Figma verification pending
- **Data Table** (named "Data Grid" during discovery; canonical name finalized 2026-07-13) — implemented 2026-07-15 at the approved narrow MVP scope (DataTableSortHeader + useDataTableSort sorting, external Pagination, composes Table); Figma verification pending, no component set exists yet
- **Tree View** — implemented 2026-07-18, built against a real, well-documented Figma reference (Content/Tree Item component set + the "Tree View (example)" composed demo); single-select only (multi-select, drag-and-drop reordering, virtualization, and async/lazy-loaded children are deferred)
- **Bar Chart, Line Chart** — implemented 2026-07-18 on recharts; single-series and static only for v1 (no multi-series, no hover tooltips/legend interactivity, no Y-axis/gridlines beyond Bar Chart's existing month labels) — see the registry `openQuestions` for what's deliberately deferred
- **Timeline** — implemented 2026-07-19, built against a real Figma reference confirmed 2026-07-24 (Content/Timeline Item component set + the "Timeline (example)" composed demo) — closes out all of Layer 2's remaining code-side gaps (Tree View, Charts, Timeline)
- **Advanced overlays** beyond Dialog, Drawer, Popover, Menu — largely deferred
- **Full Style System rollout** — Shape/Surface personalities partially wired
- Temporary tokens are marked in `styles/tokens.css` where Figma values are unresolved

## License

Private project — Skrewww design system documentation.

## Repository archive (excludes generated and local files)

```bash
tar -czf skrewwwDS-clean.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.next-playwright' \
  --exclude='out' \
  --exclude='dist' \
  --exclude='coverage' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  --exclude='blob-report' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='__MACOSX' \
  --exclude='*.tsbuildinfo' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.production.local' \
  --exclude='.claude/settings.local.json' \
  .
```

Keep `.env.example` in the archive — it documents required environment variables without secrets.
