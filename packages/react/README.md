# @skrewww/react

Framework-agnostic Skrewww React components with one stylesheet.

> **Status: public beta.** `0.1.0-beta.1` is published on npm under the `beta` dist-tag. It is a
> beta: the API may still change. There is no Figma Make Kit yet.

## Install

```bash
npm install @skrewww/react@beta
```

or pin the exact version:

```bash
npm install @skrewww/react@0.1.0-beta.1
```

Because this is the package's first version, npm also points the `latest` tag at it, so a bare
`npm install @skrewww/react` currently resolves to the same beta. Prefer `@beta` or an exact version.

This package is a distribution of Skrewww's canonical components, built from
`components/ui` in the [Skrewww repository](https://github.com/usmanfarooqi88/skrewwwDS).
It is not a second component library, and it does not replace the shadcn-style
`/r/*` distribution (which copies source into your project): both come from the
same canonical source.

## Current scope

Only these eight components are included. The package does **not** contain the
rest of the library, and there is no chart support:

Button · Link · Card · Text Input · Form Field · Validation Message · Spinner · Dialog

Plus an optional `SkrewwwRouterProvider` (below). Component maturity is
whatever the Skrewww registry says; this package does not change it.

## Requirements

- **React 19** — `react` and `react-dom` `^19.2.0`. React 18 is untested and not
  claimed.
- **ESM only.** There is no CommonJS build. It is verified with Vite.
- Node `>=22.13.0 <23 || >=24 <25` is the repository's tooling range, declared in `engines`.

## Use

```tsx
import "@skrewww/react/styles.css";
import { Button, Card } from "@skrewww/react";
```

- **One stylesheet.** `@skrewww/react/styles.css` carries the design tokens,
  Foundation utilities (`.sr-only`) and the compiled component styles. Import it
  once, before your own styles. Tailwind is not required. Without it, components
  render unstyled.
- **Shape and Surface modes** are data attributes on an ancestor. Put them on
  `<html>` — Dialog portals to `<body>`, so a wrapper `<div>` would not reach it:

  ```html
  <html data-skrewww-shape="rounded" data-skrewww-surface="flat">
  ```

  Shape: `sharp | rounded | pill | squircle`. Surface: `flat | gradient | glass`.
  Both are optional; defaults render without them.
- **Fonts are not shipped.** Components inherit the host font.

## Links and routing

Link-bearing components render a native `<a href>`. With no setup a click is
ordinary browser navigation. To keep client-side routing in a router-based app,
mount **one** optional provider near the root:

```tsx
import { SkrewwwRouterProvider } from "@skrewww/react";

<SkrewwwRouterProvider navigate={(href) => router.push(href)}>
  {children}
</SkrewwwRouterProvider>
```

Only plain, primary-button, same-window clicks on root-relative paths
(`/docs/...`) are handed to `navigate`. Modified clicks, non-primary buttons,
`target` other than `_self`, `download`, prevented events, hash links, relative
paths and external URLs stay with the browser.

## Known limits

- CSS Module class names are readable and unhashed (for example `button_button`).
  Hashing is a planned improvement, not part of the first beta.
- The stylesheet is one file regardless of which components you import. JavaScript
  tree-shaking works per component; CSS is not split.

## Maintainers

```bash
npm run build:react-package       # build dist from canonical source
npm run prepublish:react-package  # fast integrity checks (what prepublishOnly runs)
npm run smoke:react-package       # pack, install into a clean Vite app, typecheck, build, Chromium proof
npm run release-gate:react-package # the complete pre-publication gate
# publish a prerelease ONLY with the explicit tag (npm 11 ignores publishConfig.tag; prepublishOnly enforces it):
#   cd packages/react && npm publish --tag beta
```

Release mechanics, the gate and the first-release procedure:
`docs/architecture/react-package.md`.
