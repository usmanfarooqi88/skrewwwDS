# Skrewww — component build rules

Durable rules for implementing and verifying components in this repository.

## How Claude should use this file

This file governs building real components — primarily **Figma construction discipline** and **React implementation / verification gates** for this monorepo.

React-first Beta components may exist before corresponding Figma components. In that case, mark them **Figma parity pending** and do not invent Figma variants, node IDs, properties, or token bindings.

Current React status belongs in [`docs/project-status.md`](docs/project-status.md). Do not copy React component totals, Vitest counts, Playwright counts, Table audit results, Data Table roadmap details, or documentation-site route inventories into this file.

---

## Before coding

1. Read the canonical registry entry (or create a draft entry before claiming implementation).
2. Inspect Figma via MCP when available — record node IDs or mark unresolved.
3. Confirm the component is not a duplicate of an existing canonical slug.
4. Read related architecture docs under `docs/architecture/`.

## Public API

- Export through `components/ui/index.ts` only.
- Do not export `components/ui/internal/*` or `*Control` wrappers unless deliberately documented.
- Registry examples must use public exports (`lib/public-examples.test.ts`).

## Quality gates (required)

```bash
npm run verify:node
npm run verify:package
npm run lint
npm run typecheck
npm test
npm run test:browser
npm run build
```

Or: `npm run test:all`

## Build directories

| Command | distDir | Port | Notes |
|---------|---------|------|-------|
| `npm run dev` | `.next` | 3000 | Development |
| `npm run dev:clean` | `.next` (fresh) | 3000 | After cache corruption |
| `npm run build` | `.next` | — | Production verification |
| `npm run build:e2e` | `.next-playwright` | — | Playwright only |
| `npm run test:browser` | `.next-playwright` | 3100 | Does not touch dev `.next` |

**Never** run `next build` and `next dev` against the same `.next` simultaneously.

Playwright `reuseExistingServer` is opt-in via `PLAYWRIGHT_REUSE_SERVER=true` (local only).

## Testing expectations

- Unit tests for semantics, registry, controlled state, and form behavior.
- Playwright tests for keyboard, focus, and browser-only behavior.
- README inventory must stay synchronized with registry (`lib/readme-status.test.ts`).

## Documentation

- Update `content/` prose when Figma-derived docs change.
- Update registry metadata, `llms-content.ts`, and parity docs as needed.
- Volatile counts belong in `docs/project-status.md`, not standing instruction files.

## Do not

- Implement a new component batch during infrastructure synchronization passes.
- Suppress legitimate a11y, React, or browser warnings.
- Hardcode README component counts without registry derivation.
- Guess Figma specifications when MCP is unavailable.

## Style System (Shape/Surface) completion criteria

A conceptual token demo or a fix applied only to a test/validation instance
does not count as a shipped component fix. A Surface (or Shape) implementation
is complete only when the actual master components are bound and a genuinely
fresh instance — not a reused or previously-touched one — inherits the
correct behavior without any local override. Before creating a single shared
token for a component's background, check whether the component actually has
multiple internal state tiers (e.g. a Button's Default vs Hover vs Pressed
often use progressively different raw colors, not one shared value) — binding
all tiers to one token can silently destroy state feedback that existed
before the fix.

A Surface/Glass implementation is not complete once color tokens are
verified — "glass" requires both a translucent fill AND a background-blur
effect bound to the appropriate blur token. Verifying color bindings alone
can pass every property-level check while the actual rendered result is
still visibly broken (a hard, unblurred edge where a translucent element
crosses a background boundary). Blur effects are easy to apply only to a
test/demo instance and forget to bind at the master level — check for this
specifically, the same way color-only test-instance overrides get checked.
Property-level verification is necessary but not sufficient for visual
effects like blur; a final human visual check in the actual file is required
before calling a Surface/Glass fix complete.

Not every component needs Surface-mode reactivity. Three legitimate
exception categories emerged during the Layer 3 rollout: (1) components too
small or thin for a background-blur effect to render meaningfully (roughly
under ~24px or a few px thick — checkboxes, dividers, progress bars); (2)
components whose entire purpose depends on staying visually fixed regardless
of theme (tooltips, loading skeletons) — translucency would undermine their
function; (3) components with no fill at all in their structure (plain text
links, tab items) — there's nothing for Surface mode to affect. Confirm
which category applies via direct structural inspection (fill bindings,
dimensions) before assuming a component needs the fix — don't skip a real
gap by mistaking it for one of these exceptions, and don't force the fix
onto something where it would visually break or serve no purpose.
