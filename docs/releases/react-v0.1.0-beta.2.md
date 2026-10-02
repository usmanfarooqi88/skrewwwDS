# @skrewww/react v0.1.0-beta.2 — release notes

**Status:** **PUBLISHED** on public npm under the `beta` dist-tag (`latest` was not moved and still points at
`0.1.0-beta.1`).

## Package

| Field | Value |
|---|---|
| Name | `@skrewww/react` |
| Version | `0.1.0-beta.2` |
| Previous | `0.1.0-beta.1` |
| npm dist-tags | `beta` → `0.1.0-beta.2`; `latest` stays on `0.1.0-beta.1` (not moved) |
| Release commit | `6ea9e0d0a5c0980f88153e998ff5667acc3aab93` |
| Git tag | `react-v0.1.0-beta.2` (signed, annotated) |
| Publish command | `npm publish --tag beta` (explicit tag required; npm 11.12.1 ignores `publishConfig.tag`) |

## What changed for consumers

### Fixed
- Validation Message icon-to-text spacing now follows the 4px micro rhythm (was 6px).
- Form Field vertical spacing between label, control and supporting or error text now follows the 8px structural
  rhythm (was 6px).

### Compatibility
- No public React API change, no new dependency, no component removal, no new export.
- No migration is required for typical consumers. Layouts that depend on the exact old gaps will see a small shift:
  Validation Message is 2px narrower, and a Form Field with supporting or error text is up to about 4px taller (two 2px gap increases).

## Package delta vs beta.1 (verified from source diff and the built candidate)

Source differences between the beta.1 release commit and this candidate that reach the tarball:
`dist/styles.css` (the two CSS gaps), `README.md` (install section and status block), and `package.json`
(`version`, and the `prepublishOnly` resolved-tag guard added after beta.1). No API or logic change: the same 33
files, exports, peer and runtime dependencies as beta.1.

| | beta.1 (published) | beta.2 (candidate) |
|---|---|---|
| Files | 33 | 33 |
| Packed size | 37,295 B | 37,483 B (+188 B) |
| Unpacked size | 170,342 B | 170,845 B (+503 B) |
| Integrity (candidate tarball) | — | `sha512-JCJ7K16ENwWTdQ171pqlQBKAiwUlF0GYUByiGBCqJ0GFs3sEOn/wRGRFfFsqXWZcO9Hc/gdme1E1GDEsKgyDYA==` |

The growth is the README install section and the manifest guard script; the two CSS values are slightly shorter strings.

## Not part of this package release

The SP-3 Figma changes (Button / Text Input / Select / Search Field Small heights, Tabs indicator, Split Button,
Combobox sizes) are Figma-only and are not npm package changes. Combobox is not in the 8-component pilot.
