# `@skrewww/react` package boundary (MK-1 candidate)

**Status: unpublished candidate.** No npm release exists and no Figma Make Kit
exists. This note records the package boundary and how it relates to the other
distribution paths. Current status of the work: `docs/project-status.md`.

## One canonical source, two distributions

```
canonical components  (components/ui, registry in lib/component-registry*.ts)
        |
        +--> shadcn /r transport      copy-owned source into a consumer repo
        |                             (lib/shadcn-registry-generator.ts → public/r, generated)
        |
        +--> @skrewww/react package   installed npm library for Vite / Figma Make / any React app
                                      (scripts/build-react-package.ts → packages/react/dist, generated)
```

Both derive from the same files. There are no duplicate component
implementations, no Make-specific forks, and neither output is committed. The
package is a distribution boundary, not a second component library, and it is
not a source of truth for component status: the build reads each pilot
component's status and existence from the registry.

## What the package contains

- **Entry:** generated at build time from the registry (which slugs) and the
  public barrel `components/ui/index.ts` (which exports). Only the MK-1 pilot
  surface is exposed — Button, Link, Card, Text Input, Form Field, Validation
  Message, Spinner, Dialog, and `SkrewwwRouterProvider`. `internal/*` helpers are
  bundled but never exported, and the `exports` map blocks deep imports.
- **Stylesheet:** `@skrewww/react/styles.css` = the Foundation extraction (the
  same tokens + `.sr-only` the shadcn transport ships as
  `skrewww-foundation.css`) followed by the compiled component CSS Modules.
- **Declarations:** emitted by `tsc`, then repository `@/…` aliases are
  rewritten to relative paths, so consumers need no path mapping.
- **Dependencies:** peers `react`/`react-dom` `^19.2`; runtime dependency
  `@phosphor-icons/react`. Never `next`, `recharts`, `@vercel/*` or docs-app code.
- **Version:** `0.1.0-candidate.0`, independent of the platform, registry-schema
  and component versions (`docs/architecture/versioning.md`).

## Framework-agnostic links (router contract)

Canonical components must know nothing about any framework. Button, Link,
Pagination and List Item render a native `<a href>`
(`components/ui/router-navigation.tsx`). Without a provider a click is ordinary
browser navigation. A host may mount one optional `SkrewwwRouterProvider` with a
`navigate(href)` callback; only plain, primary, same-window clicks on
root-relative internal paths are handed to it (modified clicks, non-primary
buttons, `target` other than `_self`, `download`, prevented events, hash links,
relative paths and external URLs stay native).

The docs app's Next adapter lives **outside** the component layer:
`components/providers/NextRouterIntegration.tsx` calls `router.push` through
`next/navigation`, mounted in `AppProviders`. Skrewww's own docs therefore keep
client-side navigation. It does not prefetch (Next's `Link` did) — none was
required or tested.

## Relationship to the shadcn transport

The shadcn manifests for Button, Link, Pagination and List Item no longer
declare `next` as a host requirement (only `react`, `react-dom`), and gain
`components/ui/router-navigation.tsx` as an internal file. shadcn consumers get
native anchors by default and may mount the provider the same way.

## Verification

`npm run smoke:react-package` builds the package, packs a real tarball, installs
only that tarball (plus React and build tooling — no `next`, no `recharts`) into
a fresh Vite app in `os.tmpdir()`, typechecks, production-builds, and drives the
built app in Chromium: rendering and tokens, Shape (sharp/rounded/pill/squircle),
Surface (flat/gradient/glass), Dialog portal/focus/Escape/close, label and error
relationships, and the router provider.

## Not yet decided or built

Publication to npm or Figma's private registry; a Make Kit and its guidelines;
charts or other components in the package; React 18 support; `sideEffects`-aware
tree shaking measurements; hashed CSS Module class names.
