# `@skrewww/react` package boundary and release mechanics

**Status: release-hardened, unpublished.** No npm release exists and no Figma Make Kit
exists. The manifest is `0.1.0-beta.1` with `"private": true`; publication is a separate,
manual step (MK-2C). This note records the package boundary and how it relates to the other
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
- **Version:** `0.1.0-beta.1` (the intended first release), independent of the
  platform, registry-schema and component versions (`docs/architecture/versioning.md`).

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

## Release mechanics (MK-2A)

### Decisions

- **First release:** `@skrewww/react@0.1.0-beta.1` on public npm, 8-component pilot only.
- **Manifest carries the release version now** (rather than keeping `0.1.0-candidate.0`
  until publication): the release commit should differ from the verified commit only by
  removing `"private": true`, mirroring how `@skrewww/guard` carried its release version
  before publication. `private: true` stays until then, so npm refuses to publish.
- **Dist-tag:** `publishConfig.tag` is `beta` and `publishConfig.access` is `public`
  (scoped packages default to private). The intent is `beta` only. The registry may still
  point `latest` at the very first version — it did for Guard
  (`docs/releases/guard-v0.1.0-beta.1.md`) — and the manifest cannot prevent that. Verify
  with `npm view @skrewww/react dist-tags` after publishing and tell consumers to use `@beta`.
  Do not move `latest` deliberately.
- **Engines:** `>=22.13.0 <23 || >=24 <25`, the repository's own tooling range, same as the
  root and Guard. Consumers with `engine-strict` on other Node versions would be refused.
- **Release method:** first publish is manual by the npm scope owner. Later releases may use
  GitHub Actions trusted publishing (not implemented here).

### Two kinds of checks — keep them separate

| Kind | Command | Runs | Cost |
|---|---|---|---|
| **Package integrity** (safe for `prepublishOnly`) | `npm run prepublish:react-package` | on every `npm publish`, by hand, and in package CI | seconds, no network, no browser |
| **Release gate** (before publication and in CI) | `npm run release-gate:react-package` | by the scope owner before publishing | minutes, needs network and Chromium |

`prepublishOnly` (`npm --prefix ../.. run prepublish:react-package`) always does a **clean
rebuild** of `dist` from canonical source, so `dist` can never be missing, partial or stale
(`dist` is generated and gitignored; `files` points at it, so publishing without a build would
ship only README, LICENSE and `package.json`). It then re-checks the output for
`next`/`recharts`/`@vercel`/server-only imports and repository `@/` aliases in the JS and
declarations, verifies every name the generated entry exports exists in the JS and declarations
and that every declaration import resolves, verifies the manifest contract
(`lib/react-package/release-checks.ts`), and checks that `npm pack --dry-run` lists only
package metadata and `dist`. It does not publish, touch the network, run the Vite consumer
smoke or run the repo gates. Publish from the package directory, not from a pre-built tarball
(`prepublishOnly` does not run for tarballs).

### Release gate (npm publication)

All must pass on the exact release commit — `npm run release-gate:react-package` runs them in
order: lint · typecheck · unit tests · root build · `guard --internal` · `git diff --check` ·
tracked tree clean and no generated output tracked (`scripts/verify-clean-tracked-state.mjs`) ·
package integrity checks (build, output checks, `npm pack --dry-run`) ·
`npm run smoke:react-package` (real tarball → clean Vite app → typecheck → build → Chromium).

**Full Playwright is not an npm release blocker** while the known, unrelated stale-navigation
failures remain (`changelog.spec.ts:26`, `gradient-foundation.spec.ts:202`; see
`docs/project-status.md`). This applies to the package release gate only; it does not weaken
product testing in general.

### CI

`.github/workflows/react-package.yml` runs `npm run prepublish:react-package` and
`npm run smoke:react-package` (Chromium installed with `npx playwright install --with-deps
chromium`) on pushes to `main` and pull requests that touch package-relevant paths
(`packages/react/**`, `components/ui/**`, `lib/react-package/**`, the shared `lib/` helpers,
registry and Foundation sources, `styles/**`, the package scripts, `package.json`,
`package-lock.json`, `.nvmrc` and the workflow itself), and always for `react-v*` tags. Docs-only
changes do not trigger it. It never publishes. The main CI job is unchanged.

### First manual release procedure (documented, not executed)

Performed by the npm scope owner; npm authentication and 2FA are the owner's, never stored here.

1. Confirm manually: owner can publish to the `@skrewww` scope, and the account/package 2FA
   policy (npm Settings → Publishing access). Confirm the Figma library state is irrelevant to
   this step (it is a separate MK-2D concern).
2. Release commit (MK-2C): remove `"private": true` and update the README status block; run
   everything below on that exact commit; CI green.
3. `git checkout <verified-release-sha>` in a clean checkout, then `npm ci --ignore-scripts`.
4. `npm run release-gate:react-package` — must pass.
5. `cd packages/react && npm publish` — `publishConfig` supplies `access: public` and
   `tag: beta`; `prepublishOnly` rebuilds and re-checks; npm prompts for the 2FA code. Never
   `--force`, never disable 2FA.
6. Verify: `npm view @skrewww/react dist-tags version`, then install the published version into a
   clean Vite app by hand.
7. Tag the release commit `react-v0.1.0-beta.1` (mirrors `guard-v0.1.0-beta.1`; this also
   triggers the package workflow) and write release notes, as for Guard.
8. Rollback is `npm deprecate`, not unpublish. npm's unpublish limits were not verified here.

## Not yet decided or built

Actual publication (MK-2C); guidelines compiler and Make setup (MK-2B); Make Kit assembly
(MK-2D); hashed CSS Module class names; React 18 (post-release investigation); charts and
wider component coverage (post-release expansion). Trusted-publishing automation for later
releases.
