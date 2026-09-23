# Skrewww

**Skrewww** is a React and TypeScript design system: accessible, semantic
components with token-driven Shape and Surface personalities, distributed
through a shadcn-compatible installable registry, paired with a matching
Figma library, and described to AI coding agents through machine-readable
contracts — one connected system, not separate products.

Skrewww **1.0** is the platform and documentation release. Individual React
components retain their own Beta maturity until explicitly promoted to
Stable — see [Implemented React components](#implemented-react-components).

[![CI](https://github.com/usmanfarooqi88/skrewwwDS/actions/workflows/ci.yml/badge.svg)](https://github.com/usmanfarooqi88/skrewwwDS/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/usmanfarooqi88/skrewwwDS)](https://github.com/usmanfarooqi88/skrewwwDS/releases)

![Skrewww — React design system: token-driven, native controls, React implementations](https://skrewww.com/opengraph-image)

## Quick Start

Install a component from the `@skrewww` registry with the real [shadcn](https://ui.shadcn.com) CLI.

`@skrewww` is not yet listed in shadcn's official registry directory
([shadcn-ui/ui#11991](https://github.com/shadcn-ui/ui/pull/11991) is open) —
until it merges, declare the registry once in your project's
`components.json`:

```json
{
  "registries": {
    "@skrewww": "https://skrewww.com/r/{name}.json"
  }
}
```

Then install:

```bash
npx shadcn@latest add @skrewww/button
```

This resolves the token-driven Foundation stylesheet and any
component-to-component dependencies automatically via `registryDependencies`
— no separate install step. Verified end-to-end (fresh project, real CLI,
production build); tested commands and the Tailwind-free `components.json`
shape live in
[`docs/architecture/shadcn-distribution.md`](docs/architecture/shadcn-distribution.md).
Full catalog: [`/r/registry.json`](https://skrewww.com/r/registry.json) ·
Browse components: [skrewww.com/components](https://skrewww.com/components).

Once #11991 merges, `npx shadcn@latest add @skrewww/button` and
`npx shadcn@latest search @skrewww` will resolve the namespace without the
manual `components.json` entry above.

**New to this repository as a contributor?** Start at
[`docs/getting-started.md`](docs/getting-started.md) (local run, repo map,
architecture, Figma ↔ React rules, tokens, registry, tests, Git safety) or
[`CONTRIBUTING.md`](CONTRIBUTING.md) / [`docs/contributing.md`](docs/contributing.md).
Running the docs site itself: see [Running locally](#running-locally) below.

### Documentation map

| Doc | Role |
|-----|------|
| [`docs/getting-started.md`](docs/getting-started.md) | **Primary** developer onboarding |
| [`docs/component-inventory.md`](docs/component-inventory.md) | CE-0 Figma ↔ React inventory & parity classes |
| [`docs/contributing.md`](docs/contributing.md) | Contribution / Git / staging rules |
| [`docs/project-status.md`](docs/project-status.md) | Current status, open gaps, and the canonical phase roadmap |
| [`docs/architecture/`](docs/architecture/) | Deep architecture and component notes |
| [`docs/licensing.md`](docs/licensing.md) | MIT boundary, dependencies, brand, and commercial assets |
| [`docs/open-source-readiness.md`](docs/open-source-readiness.md) | Open-source readiness audit and launch checklist |

## License

Code in this repository is [MIT](LICENSE). Third-party dependencies keep their
own licenses, and the Skrewww name, logo, and brand identity are **not**
granted by the code license — see [`TRADEMARKS.md`](TRADEMARKS.md) and
[`docs/licensing.md`](docs/licensing.md).

**Figma.** The paired Figma library is separate from this repository (not
MIT, not included in it): [Skrewww Free](https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free)
is the free Community file; [Skrewww Pro](https://usmanfarooqi.gumroad.com/l/skrewww-pro)
is the paid Gumroad file/deliverables.

## Contributing, feedback, and security

Contribution rules: [`CONTRIBUTING.md`](CONTRIBUTING.md) /
[`docs/contributing.md`](docs/contributing.md). Bugs, component issues,
Agent Kit issues, documentation issues, and feature requests go through
[GitHub Issues](https://github.com/usmanfarooqi88/skrewwwDS/issues). For a
security vulnerability, do not open a public issue — see
[`SECURITY.md`](SECURITY.md) first. Community expectations:
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Current status

Volatile counts and roadmap live in [`docs/project-status.md`](docs/project-status.md) (derived from the canonical registry).

- **Implemented React components:** count derived from `/registry.json` (`metadata.implementedComponentCount`, `hasImplementation: true`); individual entries remain Beta until promoted
- **Figma-documented components:** count derived from `content/` documentation inventory (includes documentation-only entries)
- **WCAG 2.2 AA (target)** accessibility baseline
- **Design system version:** `1.0.0` (platform/docs release)
- **Node.js:** `>=22.13.0 <23 || >=24 <25` (see `engines`; `.nvmrc` for local Node 24)

## Agent Kit (Beta)

Helps AI coding agents understand and use Skrewww from current
machine-readable contracts instead of relying on model memory. Public
Beta — overview, getting started, and known limitations:
[`/agent-kit`](https://skrewww.com/agent-kit) ·
[`docs/architecture/agent-kit.md`](docs/architecture/agent-kit.md).

## Guard (Beta)

An offline CLI that checks generated code against Skrewww's canonical
component contracts — invented components/props, wrong maturity claims, and
non-installable install commands, for example. It is not a TypeScript
checker, an accessibility checker, a visual-regression tool, or a Figma
checker. [`/guard`](https://skrewww.com/guard) ·
[released](https://github.com/usmanfarooqi88/skrewwwDS/releases/tag/guard-v0.1.0-beta.1)
as `@skrewww/guard@0.1.0-beta.1`.

### Implemented React components

| Category | Components |
|----------|------------|
| Actions | Button, Button Group, Link, Split Button, Toggle Group |
| Containers & Overlays | Accordion, Card, Chart Card, Dialog, Drawer, Popover |
| Content & Data | Area Chart, Avatar, Banking Account Card, Banking Balance Summary, Banking Transaction Row, Bar Chart, Calendar Day, Calendar Grid, Chart Metric, Data Table, Divider, Empty State, Line Chart, List Item, Table, Tag, Timeline, Tree View |
| Forms | Checkbox, Combobox, Credit Card Field, Date Picker, File Upload, Form Field, Number Input, Phone Number Field, Radio, Radio Group, Search Field, Select, Slider, Switch, Text Input, Textarea, Validation Message |
| Feedback | Alert, Badge, Progress Bar, Skeleton, Spinner, Toast, Tooltip |
| Navigation | Breadcrumb, Menu, Pagination, Stepper, Tabs |

Documentation-only pages clearly state **Figma documented · React not implemented · Documentation only** and do not show live previews.

### Control semantics (high level)

- **Checkbox, Radio, Switch, Slider, Textarea, Text Input, Search Field** — native or native-first semantics.
- **Select** — custom non-searchable combobox/listbox with hidden native form fallback.
- **Combobox** — editable searchable combobox/listbox with predefined options.
- **Menu** — command menu built on Popover overlay infrastructure.
- **Date Picker** — composes Calendar Grid and Popover.

## Running locally

Shortest path (details in [`docs/getting-started.md`](docs/getting-started.md)):

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
| `npm run verify:node` | Confirm Node satisfies `engines` |
| `npm run verify:package` | Confirm package / lockfile metadata |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest unit tests |
| `npm run test:browser` | Playwright (isolated `.next-playwright` build on port 3100) |
| `npm run smoke:consumer` | Clean-consumer `/r` install smoke |
| `npm run test:all` | verify:node + verify:package + lint + typecheck + unit + browser + production build |
| `npm run build` | Production build (uses `.next`) |
| `npm run generate:registry` | Regenerate `/r` manifests only |

For full Playwright release-gate runs, prefer `npx playwright test --workers=1`.

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
4. Industry Systems — Banking pilot shipped (3 components); additional industries planned via the CLI preset model — see Distribution Model below

Forms use a composed architecture: **FormField** owns label/validation layout; controls prefer native HTML semantics where sufficient; **ValidationMessage** handles field-level feedback only.

Feedback uses shared internal presentation primitives (not public API). **Alert** is persistent inline feedback; **Toast** is transient; **Progress Bar** is measurable progress; **Spinner** is indeterminate loading.

Source-of-truth hierarchy: [`docs/architecture/source-of-truth.md`](docs/architecture/source-of-truth.md)

Stable-v1 Gradient contract: [`docs/architecture/gradient-foundation.md`](docs/architecture/gradient-foundation.md)

## Distribution Model

**Currently implemented — shadcn-compatible registry distribution.** A
**supported subset** of components can be installed into a consumer project
with `npx shadcn@latest add @skrewww/<component>` **once `@skrewww` is
declared under `registries` in your `components.json`** — see
[Quick Start](#quick-start) above for the exact entry and a tested command.
`@skrewww` is not yet listed in shadcn's official registry directory
([shadcn-ui/ui#11991](https://github.com/shadcn-ui/ui/pull/11991) is open),
so the bare command above fails with "Unknown registry" until either that
merges or the entry is declared manually. Manifests are generated from the
canonical registry (`lib/component-registry.ts`) via `npm run
generate:registry` and served as static files under `/r/{name}.json`; this
is a separate path from the `/registry.json` metadata feed below.

**Supported `/r` install surface.** A growing subset of implemented React
components is installable this way; the current, authoritative list is the
live catalog itself — [`/r/registry.json`](https://skrewww.com/r/registry.json)
— not a count maintained here, since it changes as components are added. Some
implemented components are documented on this site but not yet part of the
shadcn install surface.

`npx shadcn@latest search @skrewww` has the same prerequisite as `add` above.

Scope, mechanism, and verified consumer testing:
[`docs/architecture/shadcn-distribution.md`](docs/architecture/shadcn-distribution.md).

**Future / not yet implemented.** Skrewww has also decided on "The Hybrid
Registry Model" as a broader, separate distribution architecture. None of
this exists yet — there is no `@skrewww/core` npm package, no `skrewww`
CLI, and no publishing pipeline for it:

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

- **`skrewww.com`** — confirmed live production domain; also the code fallback origin when `NEXT_PUBLIC_SITE_URL` is unset
- **`NEXT_PUBLIC_SITE_URL`** — deployment authority for canonical URLs, sitemap, JSON-LD, registry
- **`http://localhost:3000`** — local development default
- **`https://skrewww.test`** — recommended test origin in unit tests

## Known limitations

- **Combobox** — multi-select is deferred; several popup/option tokens are temporary, pending Figma variable confirmation — see [`combobox-parity.md`](docs/architecture/combobox-parity.md)
- **File Upload** — progress UI and preview thumbnails are deferred
- **Table** — Flat-only and Rounded-only for Stable-v1; Caption/Footer visuals still pending
- **Data Table** — narrow MVP scope (sorting via a composed Table + external Pagination); no dedicated Figma component set yet
- **Tree View** — single-select only; multi-select, drag-and-drop reordering, virtualization, and async/lazy-loaded children are deferred
- **Area Chart, Bar Chart, Line Chart** — static Cartesian charts (multi-series; optional axes, grid, legend and tooltip): the legend is a non-interactive key (no series toggling), the tooltip is pointer/touch-only, there is no keyboard chart interaction and no dense-data or long-label policy; Area Chart has no Figma reference
- **Chart Card, Chart Metric** — the dashboard composition layer for charts (header/actions, loading/empty/error state ownership, a labeled value with a direction-only delta); no Figma reference, no interactive legend, no dedicated time-range control (compose with Tabs — see Banking Balance Summary), no industry-specific naming (that belongs to a consuming app)
- **Advanced overlays** beyond Dialog, Drawer, Popover, Menu — largely deferred
- **Full Style System rollout** — Shape/Surface personalities partially wired
- Temporary tokens are marked in `styles/tokens.css` where Figma values are unresolved

For current parity status, verification dates, and Figma references, see
[`docs/project-status.md`](docs/project-status.md).

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
