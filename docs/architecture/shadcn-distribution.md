# shadcn-compatible distribution layer

## What this is

A shadcn/ui-compatible transport layer that lets `npx shadcn@latest add
@skrewww/button` install Skrewww's Button (and its Foundation dependency)
into any Next.js project, generated from the canonical registry rather than
hand-maintained. Proven end-to-end in a real POC: a fresh, Tailwind-free
`create-next-app` project, a real shadcn CLI install against a locally
served registry, correct file placement, correct Shape/Surface mode
behavior (including Squircle clip-path and Glass backdrop-filter), working
`.sr-only`, zero unexpected npm packages, and passing lint/typecheck/build
— all with zero manual repair after install.

The shadcn distribution layer is implemented independently from the
previously documented `@skrewww/core` + `npx skrewww` roadmap (see
`skrewww-claude-project-instructions.md`'s "Distribution Model" section).
That roadmap is still an unimplemented, decided-but-not-built direction.
The shadcn layer described here is, as of this writing, the **first**
Skrewww distribution mechanism actually proven working end-to-end. The
long-term relationship between the two — whether they coexist
permanently, one supersedes the other, or they converge — has not been
decided. Do not treat this document as deprecating the `npx skrewww`
roadmap, and do not treat that roadmap as a blocker for using or extending
this layer.

## Scope of this pass

Foundation + Button only. The mechanism (generator, lookup table,
extraction) is structurally able to support more components — adding one
means adding its files to `lib/component-registry.ts` (already the
convention) and an entry per new file to `FILE_DESTINATIONS` in
`lib/shadcn-registry-generator.ts` — but no additional component,
native CLI, community registry infrastructure, or Vite/Remix
generalization is in scope here.

## How it works

- **Canonical source of truth stays `lib/component-registry.ts`** — no
  shadcn-specific field exists there. `CANONICAL_REGISTRY_SCHEMA_VERSION`
  is unaffected by this feature.
- **`lib/shadcn-registry-generator.ts`** holds all generation logic as
  pure, importable functions: reading real source files, mapping a
  canonical `ComponentRegistryEntry` to a shadcn `registry-item.json`
  shape, and mechanically extracting the Foundation CSS tier from
  `styles/tokens.css` + `styles/foundation.css` using the existing
  boundary-comment markers (not hardcoded line numbers). Importing this
  module never writes a file.
- **`scripts/generate-shadcn-registry.ts`** is the only place that writes
  to disk — a thin CLI wrapper around the two `build*Manifest()`
  functions, writing `public/r/foundation.json` and `public/r/button.json`.
- **Transport-layer flattening happens only in the generator.** The
  canonical type keeps a component's own `files` and its private
  `internalDependencies` as separate arrays; `buildButtonManifest()` is
  the one place that concatenates them into a single shadcn `files[]`
  array, per the doc comment already on `ComponentRegistryEntry`.
- **Per-file `type` and `target` are explicit and exhaustive, never
  inferred from a file extension and never defaulted.** `FILE_DESTINATIONS`
  in `lib/shadcn-registry-generator.ts` is a literal lookup table from
  real repo-relative path to `{ type, target }`. `classifyFile()` throws
  if a path isn't listed — a canonical entry gaining a new file/internal
  dependency without a matching table entry fails the build, not a
  consumer's install. `target` is always an explicit `~/`-rooted path
  (e.g. `~/lib/cn.ts`), never left as `""` — this was a deliberate
  strengthening over the original POC (which left `target: ""` and
  relied on the install-time consumer's own `components.json` aliases
  matching Button's literal imports, which only worked because the POC's
  test project's default aliases happened to line up).
- **Host requirements never leak as an installable dependency.**
  `hostRequirements` (`react`, `react-dom`, `next`) is rendered only into
  the shadcn item's free-text `docs` field, never into `dependencies` —
  preserving the same canonical-only discipline already established for
  `/registry.json` (`lib/seo.test.ts` guards that route; this layer
  doesn't touch that route at all).

## Generated vs. committed

`public/r/*.json` is generated at build time (`npm run generate:registry`,
invoked by `npm run build` before `next build`) and is **gitignored, not
committed**. Reasoning: `/registry.json` already works this way — computed,
not hand-maintained — and `docs/architecture/source-of-truth.md` already
treats generated/derived artifacts as non-source. Committing the shadcn
manifests would create a second place the same data could live and drift
out of sync with `lib/component-registry.ts` between generator runs.
Determinism and correctness are instead guarded by tests
(`lib/shadcn-registry-generator.test.ts`), not by diffing a committed
snapshot — the test suite explicitly does not introduce a committed JSON
snapshot as a second source of truth.

## Build/test pipeline placement

The existing gate order is `verify:node → verify:package → lint →
typecheck → test → test:browser → build`. This feature does **not**
change that order. Instead:

- `npm test` (Vitest) runs `lib/shadcn-registry-generator.test.ts`, which
  exercises only the pure functions — no filesystem writes, no
  `public/r/` output. This is what catches a canonical/generator mismatch
  on every `npm test` run.
- `npm run build` runs `generate:registry` (the real, file-writing step)
  immediately before `next build`.
- `npm run test:all` needs no new wiring: it already ends in `npm run
  build`, so the real generation step runs exactly once per `test:all`
  invocation, via `build`, not duplicated by also being called from
  `test:all` directly.

**Known implication, not yet acted on:** `test:browser` (Playwright) runs
*before* `build` in this pipeline, so no currently-passing browser test
can rely on `/r/*.json` existing on disk — those static files are only
guaranteed present after `build` has run. If a future Playwright test
needs to fetch `/r/foundation.json` or `/r/button.json`, either the
pipeline order must change (moving `generate:registry` ahead of
`test:browser`) or that specific test must explicitly run
`npm run generate:registry` itself before starting its dev/preview
server. No current browser test consumes these paths, so no pipeline
change is made in this pass.

## URL shape

Served as static files under `public/r/`, at `/r/{name}.json`:
production shape `https://skrewww.dev/r/{name}.json` (per
`source-of-truth.md`'s domain table), currently `/r/foundation.json` and
`/r/button.json`. This coexists with `/registry.json` at the root — a
different path, a different purpose (shadcn CLI consumption vs. the
existing public registry feed) — with zero changes to
`app/registry.json/route.ts`, `lib/registry-public.ts`, or
`PublicRegistryMetadata.schemaVersion` (still `1.4.0`). Existing
`/registry.json` consumers are unaffected.

## Known follow-ups (not resolved in this pass)

- **`icons.tsx` transport coupling**: Button transports the whole
  85-line `components/ui/icons.tsx` file (4 exported icons) though it
  only uses `LoadingSpinner`. Measured in the POC: `icons.tsx` is 13.3%
  of Button's manifest payload, of which roughly 9.6 percentage points
  are unrelated icons (`PlusIcon`, `ChevronRightIcon`, `SearchIcon`).
  Not severe enough to justify splitting from one component's data —
  revisit once a second component also needs `icons.tsx`, so the
  coupling can be evaluated in both directions.
- **Consumer ESLint divergence**: a fresh `create-next-app` consumer
  shows 17 lint warnings (0 errors) on Button.tsx's underscore-prefixed
  destructuring pattern, because the canonical Skrewww repo's
  `eslint.config.js` extends only `eslint-config-next/core-web-vitals`,
  while `create-next-app`'s default scaffold also extends
  `eslint-config-next/typescript` (which enables
  `@typescript-eslint/no-unused-vars` without an `argsIgnorePattern: "^_"`
  override this repo doesn't need). Cosmetic, non-blocking, no lint
  configuration change made here.
- **First repository-wide CI**: this repo currently has no
  `.github/workflows/`. `npm run test:all` is the only current
  enforcement mechanism for the drift protection this feature relies on
  (via `test` + `build`), run locally/manually. Adding a first CI
  workflow is a separate, repository-wide decision, not made as a side
  effect of this feature.

## Verified External Consumer Test — 2026-08-09

Distinct from the original POC section above (which used a locally
served registry): this pass installed `@skrewww/button` from the **live
production registry** (`https://skrewww.com/r/{name}.json`) into a
brand-new, genuinely Tailwind-free `create-next-app` project, with real
browser interaction testing (not just static screenshots).

**Outcome: PASS WITH DOCUMENTED TOOLING LIMITATION.** The limitation
found is upstream `shadcn` CLI behavior (`init` requiring a Tailwind
config), not a defect in the `@skrewww` registry or transport layer —
the registry itself, Foundation dependency resolution, file placement,
and runtime behavior all validated cleanly.

### Tailwind-free limitation

`shadcn` CLI **4.16.2**'s `init` command hard-requires an existing
Tailwind CSS configuration and refuses to proceed without one —
confirmed failing identically across all three `--base` options (`base`,
`radix`, `aria`):

```
- Validating Tailwind CSS.
✖ Validating Tailwind CSS.
No Tailwind CSS configuration found... Install Tailwind CSS then try again.
```

Zero side effects from the failed attempts (`package.json` and file tree
byte-identical before/after). **Tailwind-free consumers must skip `init`
entirely** and hand-author `components.json` instead. Minimal config
that worked, exactly as used in this test:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@skrewww": "https://skrewww.com/r/{name}.json"
  }
}
```

### Foundation auto-resolution

`npx shadcn@latest add @skrewww/button` automatically resolved and
installed `@skrewww/foundation` via its `registryDependencies` entry —
no separate `add @skrewww/foundation` command was needed.

### Installed file targets (verified exact paths)

- `components/ui/Button.tsx`
- `components/ui/button.module.css`
- `lib/cn.ts`
- `components/ui/icons.tsx`
- `styles/skrewww-foundation.css` (Foundation CSS target)

### No unexpected npm packages

`package.json` was diffed before `shadcn add` and after — identical.
Zero new npm packages were installed as a side effect of the `add`
command.

### Build and runtime

Verified passing under **Next.js 16.3.0 / React 19.2.8** in the fresh
consumer app: `next build` compiled, typechecked, and generated static
output successfully.

### Runtime verification coverage

All confirmed rendering correctly in the fresh consumer, via real
browser interaction (not just static screenshots) — computed
`getComputedStyle` values and genuine DOM events, not visual
approximation:

- **Rounded** and **Squircle** shape modes — `border-radius`/`clip-path`
  checked directly (Rounded: `6px` / `none`; Squircle: `8px` / a
  resolved 34-point `polygon(...)`, confirming the superellipse geometry
  genuinely resolves in a real consumer browser, not just the source
  repo).
- **Flat** and **Glass** surface modes.
- **Hover** state — confirmed via `:hover` match + computed
  `background-color` change.
- **Focus-visible** state — confirmed via real `Tab` keypresses +
  `:focus-visible` match + computed outline.
- **Disabled** state — confirmed a real click attempt does not fire the
  handler, `pointer-events: none` applied.
- **`.sr-only`** utility — present, visually hidden, accessible.
- **Local `box-sizing: border-box`** — confirmed load-bearing on its own
  with the consumer's ambient reset removed.
