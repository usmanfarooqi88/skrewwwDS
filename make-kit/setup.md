# Setup

**This file is hand-written.** It is the only manual file in this kit and covers environment setup for Figma Make (Vite) only. Component APIs, accessibility guidance, status and Shape/Surface values are generated elsewhere in this kit from canonical sources — do not repeat or override them here.

## Package

- Package: `@skrewww/react`. The version these guidelines were generated for is recorded in `manifest.json`. The package is published on public npm. A kit must pin an exact published version in its package.json — not a tag or a range.
- Import the stylesheet once, at the app entry, before your own styles:

  ```tsx
  import "@skrewww/react/styles.css";
  ```

  Without it, components render unstyled. Tailwind is not required.
- Import components only from the package root. Do not deep-import package internals.

## React

- React 19.2 is the verified baseline. React 18 is not claimed to work.
- The package is ESM-only.

## Shape and Surface

Set the mode attributes on `<html>`:

```html
<html data-skrewww-shape="rounded" data-skrewww-surface="flat">
```

- The allowed values for each attribute are listed in `system.md`.
- Both attributes are optional; components render with defaults when they are absent.
- Dialog and other overlay components render through a portal into `<body>`, outside the app root. They inherit mode attributes only from `<html>` or `<body>`, not from a wrapper element inside the app.

## Routing

- Link and Button with `href` render native `<a>` elements and work as ordinary browser navigation. Do not replace anchors with buttons for navigation.
- `SkrewwwRouterProvider` is optional. Use it only when the app has a client-side router, for example `navigate={(href) => router.push(href)}`. A plain Vite app does not need it.
- Only plain, same-window clicks on root-relative paths are handed to `navigate`; modified clicks, new-tab and download links, hash links and external URLs stay with the browser.

## Fonts

- The package ships no font; components inherit the host font.
- The Skrewww Figma text styles use Inter. If the kit's Figma source is attached, load Inter in the app. This is Figma and setup guidance, not a package runtime requirement.

## Figma

- Figma references in these guidelines are reference only. No live Figma access is needed to use them, and captured Figma snapshots are not part of this kit.
