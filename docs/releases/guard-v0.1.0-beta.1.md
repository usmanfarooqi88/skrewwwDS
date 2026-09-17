# Skrewww Guard v0.1.0-beta.1 — Beta release notes

**Status:** **PUBLISHED** on npm (`beta` dist-tag). GitHub Release / git tag as recorded below.

## Package

| Field | Value |
|---|---|
| Name | `@skrewww/guard` |
| Version | `0.1.0-beta.1` |
| License | MIT |
| Bin | `skrewww-guard` |
| npm dist-tag (proposed) | `beta` |
| Git tag (proposed, not created) | `guard-v0.1.0-beta.1` |

## NEW

- Public Guard CLI (`skrewww-guard`)
- Portable canonical consumer facts (55 components)
- Provenance-aware validation via `@skrewww-component` origin markers
- Structured maturity / installability claims (`--claims` JSON **data**)
- Offline / local / zero-config validation after install

## Public consumer rules (3)

1. `component/nonexistent-slug`
2. `maturity/false-stable-claim`
3. `distribution/false-installable-claim`

## Internal Skrewww-repo rules (not in public CLI)

4. `token/undeclared-css-var`
5. `distribution/hostrequirements-leak`
6. `distribution/hosthost-schema-consistency`

## LIMITATIONS

- `api/nonexistent-prop` deferred (Guard is not a prop-type checker)
- No Shape / Surface / accessibility / WCAG / Figma parity / visual checks
- Pre-marker registry installs may need reinstall/update for recognition
- Does not replace TypeScript

## Publish record

Executed:

```bash
cd packages/guard
npm publish --access public --tag beta
```

- npm: https://www.npmjs.com/package/@skrewww/guard
- Install: `npm install --save-dev @skrewww/guard@beta`
- Note: first package publish also set npm `latest` → `0.1.0-beta.1` (registry behavior for first version; cannot remove `latest` while it is the only version). Prefer the `beta` tag until a stable release.

## Human checklist

- [x] Package metadata final (`@skrewww/guard` / `0.1.0-beta.1` / MIT / bin)
- [x] Version consistency (package.json ↔ `GUARD_TOOL_VERSION` ↔ facts)
- [x] License consistency (package.json + LICENSE + MIT)
- [x] Facts fresh / integrity tests
- [x] Package build + pack file list (5 files; ~77.4 kB packed / ~379.8 kB unpacked)
- [x] Isolated install green (outside repo)
- [x] Public rules exit 0/1; tool failure exit 2
- [x] No `--internal` in public help
- [x] Offline / privacy claims match implementation
- [x] README + release notes reviewed
- [x] Exact publish command drafted (not run)
- [x] npm `beta` dist-tag planned
- [x] npm package name `@skrewww/guard` currently unpublished (registry 404)
- [x] npm `@skrewww` scope ownership / publish auth / 2FA
- [x] Explicit human message: **Publish Guard Beta**
- [x] `npm publish --access public --tag beta` executed
- [x] Registry install smoke (`@skrewww/guard@beta`)

## CI adoption

**NOT STARTED.** Release ≠ required repo gate.
