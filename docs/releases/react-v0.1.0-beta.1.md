# @skrewww/react v0.1.0-beta.1 — release notes

**Status:** **PUBLISHED** on public npm under the `beta` dist-tag.

## Package

| Field | Value |
|---|---|
| Name | `@skrewww/react` |
| Version | `0.1.0-beta.1` |
| License | MIT |
| Format | ESM only |
| Peers | `react`, `react-dom` `^19.2.0` |
| Runtime dependency | `@phosphor-icons/react` |
| Release commit | `47c7b5ca2d62fe9d482f6bfcb453c4b36f53236a` |
| Git tag | `react-v0.1.0-beta.1` |
| npm dist-tags | `beta` and `latest` both → `0.1.0-beta.1` (npm sets `latest` for a package's first version; not moved) |

## What it is

The first public beta of Skrewww's framework-agnostic React package: an **8-component Stable pilot**
— Button, Link, Card, Text Input, Form Field, Validation Message, Spinner, Dialog — plus an optional
`SkrewwwRouterProvider`. One stylesheet import (`@skrewww/react/styles.css`) provides the tokens,
Foundation utilities and component styles. Shape (`sharp | rounded | pill | squircle`) and Surface
(`flat | gradient | glass`) are set with data attributes on `<html>`. Links render native anchors; the
router provider is optional.

## Not included

The rest of the Skrewww component library, charts, React 18 support (React 19.2 is the verified
baseline), and a Figma Make Kit. The shadcn-style `/r/*` distribution is a separate, unchanged path.

## Verification

Release gate passed in a clean clone; registry tarball identical to the verified candidate; fresh Vite +
React 19 app installed from public npm passed typecheck, production build and the Chromium proof
(`npm run smoke:react-package -- --from-registry 0.1.0-beta.1`).

## Release lesson

npm 11.12.1 ignores `publishConfig.tag`; a plain `npm publish` resolves to `latest`. The release was
published with an explicit `--tag beta`, and `prepublishOnly` now refuses a prerelease publish unless the
resolved tag is `beta`. Details: `docs/architecture/react-package.md`.
