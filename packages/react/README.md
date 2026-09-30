# @skrewww/react (unpublished candidate)

> **Status: unpublished candidate (MK-1).** Not on npm. Nothing here is a
> release, and there is no Figma Make Kit yet. The package is marked
> `"private": true` until publication is explicitly approved.

A framework-agnostic distribution of a **pilot subset** of Skrewww's canonical
React components, built from `components/ui` in this repository — it is not a
second component library.

Pilot surface: Button, Link, Card, Text Input, Form Field, Validation Message,
Spinner, Dialog, plus the optional `SkrewwwRouterProvider`. Charts and other
components are not included yet.

## Use

```tsx
import "@skrewww/react/styles.css";
import { Button, Card } from "@skrewww/react";
```

- **One stylesheet.** `@skrewww/react/styles.css` carries the design tokens,
  Foundation utilities (`.sr-only`) and the compiled component styles. Import it
  once, before your own styles. Tailwind is not required.
- **Shape and Surface modes** are data attributes on an ancestor. Put them on
  `<html>` (Dialog portals to `<body>`, so a wrapper `<div>` would not reach it):

  ```html
  <html data-skrewww-shape="rounded" data-skrewww-surface="flat">
  ```

  Shape: `sharp | rounded | pill | squircle`. Surface: `flat | gradient | glass`.
  Both are optional; defaults render without them.
- **Fonts are not shipped.** Components inherit the host font.
- **Peers:** `react` and `react-dom` `^19.2` (the only version verified so far).

## Links and routing

Link-bearing components render a native `<a href>`. With no setup, a click is
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

## Build and verify (repository maintainers)

```bash
npm run build:react-package   # build packages/react/dist from canonical source
npm run smoke:react-package   # build, pack, install into a clean Vite app, typecheck, build, browser-verify
```

Architecture: `docs/architecture/react-package.md`.
