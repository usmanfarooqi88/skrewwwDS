# Consumer Contract Verification (CCV)

**Status: CCV-0 ✅ COMPLETE (2026-10-04) — architecture and baseline audit. CCV-1 ✅ COMPLETE (2026-10-04) — contract derivation, evidence schema and failure taxonomy (§22).
CCV-2 ✅ COMPLETE (2026-10-05) — shadcn installed-result verifier (LOCAL_CANONICAL), run for real and reproduced (§23); the verifier is complete, the current shadcn distribution is NOT contract-clean (F1).
CCV-3 … CCV-7 NOT STARTED.** This document locks the scope, boundaries, authorities, modes, environment, evidence model and slice plan.

Baseline: `b6bbc6578d14ea4bf21e23300c8dcf0cb3bf674a`. Roadmap entry: `docs/project-status.md` → "Consumer Contract Verification".

## 1. Purpose and boundary

**The installed artifact is the subject.** CCV answers one question: *does a clean external consumer receive, and successfully use, the installed result that Skrewww claims?*

| Layer | Question | Subject | Installs / runs consumer tooling? |
|---|---|---|---|
| Canonical source tests | Does Skrewww source say the right thing? | repo files | no |
| **Guard** | Are deterministic claims about canonical Skrewww facts valid? | canonical facts, generated artifacts | **no — never** |
| Audit Agent (AG-1) | How do React, Figma and repo evidence compare? | repo facts ↔ Figma snapshot | no |
| **CCV** | Does the installed result match the promised contract and work? | a real install in a clean consumer | **yes** |

Rules that follow:

- **CCV is not a Guard rule and never becomes one.** Guard stays offline, install-free and zero-config. CCV may reuse pure helpers or facts (for example the AG-1C barrel-export extraction or CSS alias resolver) but is a separate product with its own commands, evidence and CI placement.
- **CCV output is verification evidence, not canonical.** It never feeds the registry, contracts or Figma, and it creates no second source of truth: expectations are *derived* from canonical sources (§6) wherever possible.
- **CCV is independently deterministic.** It calls no model and no Figma. The Audit Agent may later *consume* CCV results as an external evidence source; CCV never depends on the Audit Agent, its explanation layer or Figma.
- **Make Kit, Agent Kit and the Figma library are not consumer installation paths** and are out of scope. Make-generated output is never CCV evidence for React/shadcn installation.
- **Upstream tooling is not blamed on Skrewww.** shadcn CLI, create-next-app, npm and Vite behavior is recorded and separated from Skrewww-attributable behavior (§15).

## 2. Distribution paths

Only paths a consumer can actually execute today count.

| Path | Mechanism | Real? | Authority for the payload |
|---|---|---|---|
| **A. shadcn source transport** | `npx shadcn add @skrewww/<slug>`; `/r/<slug>.json` + `/r/registry.json` (56 items: 55 components + `foundation`); `@skrewww` also resolves from shadcn's built-in directory (verified manually 2026-09-30) | yes | `lib/shadcn-registry-generator.ts` over `lib/component-registry*.ts` |
| **B. npm library** | `@skrewww/react` (published `0.1.0-beta.2`; `beta` → beta.2, `latest` → beta.1); 8-component pilot surface + `SkrewwwRouterProvider` | yes | `scripts/build-react-package.ts`, `lib/react-package/pilot-entry.ts`, `packages/react/package.json` |
| **C. Foundation CSS** | not independent: shipped as `styles/skrewww-foundation.css` (a registry item that every component depends on) and as the first part of `@skrewww/react/styles.css` | yes (as part of A and B) | `styles/tokens.css` + `styles/foundation.css` extraction |
| D. other | none. (`@skrewww/guard` is a real npm package, but it is a checker, not a component distribution; it keeps its own release gate.) The old `@skrewww/core` / `npx skrewww` roadmap is not implemented. | — | — |

Not paths: Agent Kit (`public/agent`, not publicly routed), Make Kit (published privately to a team; consumes path B), the Figma library.

**Which CCV checks apply to which path** (✔ applies, — does not, ◐ partly):

| # | Roadmap check | A shadcn | B npm | C Foundation CSS |
|---|---|---|---|---|
| 1 | clean external consumer install | ✔ | ✔ | via A/B |
| 2 | real registry install | ✔ (public `/r`) | ✔ (public npm) | via A/B |
| 3 | distributed exports exist and are importable | ✔ (installed files) | ✔ (root + `styles.css`) | — |
| 4 | unresolved imports | ✔ | ✔ | ◐ (CSS `@import`/`url()`) |
| 5 | CSS variable / token resolution | ✔ | ✔ | ✔ |
| 6 | manifest ↔ export surface | ✔ (S-invariants, §14) | ✔ (N-invariants, §14) | — |
| 7 | representative renderability | ✔ | ✔ | ◐ |
| 8 | release source SHA / contract evidence | ◐ (no payload SHA) | ✔ (`gitHead`) | — |
| 9 | unexpected postinstall audit | ✔ | ✔ | — |
| 10 | token rename / removal compatibility | ✔ | ✔ | ✔ (the surface itself) |

## 3. Baseline: what `npm run smoke:consumer` already proves

`scripts/smoke-test-consumer.ts` (3,552 lines): scaffolds a real Tailwind-free Next app into `os.tmpdir()` with `create-next-app@16.3.0`, writes `components.json` by hand (`shadcn init` hard-requires Tailwind),
serves manifests built **in memory** from `lib/shadcn-registry-generator.ts` on a loopback port, runs the real `shadcn@4.16.2` `view`/`add`, snapshots the consumer filesystem before/after, wires Foundation CSS, renders a harness
page, runs `next build`, optionally drives `next start` + headless Chromium, and cleans up. It is a precursor, **not CCV**.

| Requirement | Status | Evidence |
|---|---|---|
| fresh external project | **proven** | `create-next-app@16.3.0 --no-tailwind --use-npm --yes` into `mkdtemp(os.tmpdir())` |
| OS-temp isolation | **partial** | temp root outside the repo, removed on success; **HOME, npm cache, `.npmrc` and environment variables are inherited**; `run()` leaks one `skrewww-smoke-stdout-*` dir per `view` call (12 found in the OS temp dir, two from the probes below) |
| local vs production registry | **local only** | manifests from in-memory builders; no run against `https://skrewww.com/r` (a one-off manual run is documented, 2026-08-09) |
| real shadcn CLI | **proven, stale pin** | exact `shadcn@4.16.2`; current `latest` is 4.21.1 and the zero-config flow was verified manually on 4.21.0 |
| recursive registry dependencies | **proven** | expected graph resolved from the same builders; targets and npm delta compared with what the CLI wrote |
| npm dependency install / delta | **proven** | `package.json` dependency names after − before equals the graph's declared `dependencies` |
| unexpected `package.json` / file changes | **proven** | added/removed/modified file diff outside `node_modules`, `.git`, `.next` |
| file targets | **proven** | added set == expected target set; critical paths exist |
| **per-file content ↔ manifest** | **missing (shared targets only)** | only targets declared by more than one manifest are byte-compared, **and a known CLI quirk is tolerated there** (a dropped leading `/** … */` line). Primary component files are checked for existence, not content. |
| source imports resolve | **partial, implicit** | only via `next build`; no explicit import-closure check |
| Foundation activation | **proven** | import present once, before `globals.css`; Foundation signature found in a stylesheet the built `/` route actually links |
| build | **proven** | `next build` (type checks and bundles) |
| browser runtime / computed values / interactions | **partial** | 22 of 38 descriptors carry a `browserAssert`; 16 are build-only (Button, Card, Text Input, Spinner, Divider, Link, Checkbox, Switch, Textarea, Avatar, Slider, Empty State, Tabs, Search Field, Credit Card Field, composed link/spinner/divider) |
| component coverage | **partial** | 37 descriptors + 1 composed for 55 distributed components; 18 items have none (form-field and validation-message are covered transitively by text-input; progress-bar, skeleton, radio, radio-group, pagination, breadcrumb, stepper, table, tag, list-item, timeline, toast, button-group, toggle-group, accordion, number-input are not) |
| network / drift | **required, undefended** | `npx` + `npm install` + CLI over the network; no cache policy, no step timeouts, no lockfile; Next/React/transitive versions are whatever resolves, and are not recorded |
| evidence output | **missing** | console only; no structured result; infrastructure failure and contract failure both `exit 1` |
| tooling list of builders | **second allowlist** | `MANIFEST_BUILDERS` (56 hand-listed imports) duplicates `buildDistributedRegistryItems()`; consistent today (probe), unenforced |

## 4. Baseline: what the npm package proofs prove

Three different things, not to be collapsed:

| Proof | Command | Subject | Network |
|---|---|---|---|
| **Package integrity** (candidate, no install) | `npm run prepublish:react-package` | clean rebuild of `dist`; output leak checks (next/recharts/@vercel/`@/` aliases); every name of the generated entry present in JS and `.d.ts`; declaration imports resolve; manifest release contract; `npm pack --dry-run` file list | none |
| **Candidate/tarball smoke** | `npm run smoke:react-package` | real tarball installed into a fresh Vite 8 + React 19 app: typecheck (strict, `skipLibCheck: false`), production build, bundle has no next/recharts, Chromium proof (tokens, Shape ×4, Surface ×3, Dialog portal/focus/Escape, label/error relations, router provider) — 42 checks | npm install |
| **Public-registry smoke** | `npm run smoke:react-package -- --from-registry <spec>` | the same app against the package as published: asserts resolved URL is `registry.npmjs.org` with an integrity string and, for an exact spec, the installed version — 41 checks | npm install |

| Requirement | Status | Evidence |
|---|---|---|
| tarball contents | proven | `checkPackedFiles` (allowlist of `dist/`, README, LICENSE, `package.json`) on dry-run and real pack |
| root exports exist | partial | pre-install, in `dist`; the consumer imports ~17 names it uses but **does not enumerate the installed export set** |
| unexpected extra exports | missing | no check that installed exports equal expected |
| `exports` map blocks deep imports | missing | asserted in the manifest check, never attempted from a consumer |
| CSS export | proven | consumer imports `@skrewww/react/styles.css`, tokens resolve in Chromium |
| clean install of candidate / of public package | proven (separately) | tarball mode and `--from-registry` |
| ESM resolution | partial | bundler resolution (Vite/TS); **no plain Node `import()`** |
| TypeScript usage | proven | strict, no path mapping |
| dependency / peer correctness | partial | no next/recharts/@vercel; peers are satisfied by the consumer; no negative peer test |
| Next-free boundary | proven | no `next` in `node_modules`, none in the bundle |
| router provider | proven | browser checks |
| lifecycle scripts / unexpected postinstall | **missing** | not inspected |
| provenance of the published artifact | **missing** | `gitHead` is compared by hand in release notes, not by a tool |
| public package equals the verified candidate | **manual** | done by hand for beta.1 and beta.2 (byte-identical), no automation |
| CI | candidate only | `.github/workflows/react-package.yml` runs `prepublish` + tarball smoke (path-filtered, includes tags); `--from-registry` is run by hand after publishing |
| pins | **floating** | `react ^19.2.0`, `vite ^8.0.0`, `@vitejs/plugin-react ^6.0.0`, `typescript ^5.9.0`; no lockfile |

## 5. Baseline probes (run 2026-10-04, repository unchanged)

All probes used OS-temp directories; `git status --porcelain` was identical before and after.

| Probe | Result |
|---|---|
| `npm run smoke:consumer -- button` | pass; **654 s** while the machine load average was ~70 (CCV timeouts must tolerate this) |
| `npm run smoke:consumer -- text-input` (4-item graph, shared `lib/cn.ts`, `@phosphor-icons/react`) | pass; **46 s** at normal load |
| `npm run smoke:react-package -- --from-registry 0.1.0-beta.2` | pass, 41/41, 53 s |
| production `/r/*.json` vs the generator's output at HEAD | **56/56 items and `/r/registry.json` are deep-equal** (parsed JSON) |
| `npm view @skrewww/react@0.1.0-beta.2` | `gitHead` `6ea9e0d0…` = tag `react-v0.1.0-beta.2`; `dist.integrity` sha512; two `dist.signatures`; **no `dist.attestations`** (manual publish, no provenance statement); `latest` → beta.1 |
| published beta.2 `dist/` vs a local build at HEAD | **30/30 files byte-identical** (no package-relevant commit since the release commit) |
| declared custom properties, beta.1 vs beta.2 `styles.css` | 505 and 505; 0 removed, 0 added; exports 17 and 17; 0 removed |
| shadcn install of `@skrewww/button` into a minimal project, production registry | **the origin-marker line is dropped on both `shadcn@4.16.2` and `shadcn@4.21.1`** (finding F1) |

### Findings (recorded, **not fixed** in CCV-0)

| ID | Finding | Why it matters |
|---|---|---|
| **F1** | The generator injects `/** @skrewww-component <slug> */` as the **first line** of transported `.ts`/`.tsx` primary files. A real `shadcn add` (4.16.2 and 4.21.1, minimal project, production registry) wrote `components/ui/Button.tsx` starting at `"use client";`: the marker is gone. `smoke:consumer` tolerates exactly this quirk and only on shared targets, so it never noticed. | Guard's *public* provenance contract is "resolved import whose target file contains `@skrewww-component <slug>`" (`guard-distribution.md`). In a real install that evidence can be absent. This is a product/distribution question for a separate slice (for example marker placement), not a CCV decision. CCV must report it, not allowlist it silently. Verified on `button` only; coverage of other items is exactly what CCV-2 will establish. |
| F2 | `smoke:consumer` byte-compares only shared targets; primary files are not compared. | CCV must compare every installed file with the manifest. |
| F3 | `run()` leaks one temp dir per captured-stdout call; stale `skrewww-react-smoke-*` workspaces remain from earlier failed runs. | Evidence/cleanup hygiene. |
| F4 | Pins are stale or floating (CLI 4.16.2 vs 4.21.1; create-next-app 16.3.0 vs 16.3.7 used manually; Vite/TypeScript ranges). Resolved versions are not recorded. | An upstream release can silently redefine the contract. |
| F5 | The harness keeps its own 56-entry builder list. | A second allowlist; derive from `buildDistributedRegistryItems()`. |
| F6 | 16 build-only descriptors and 18 items without any descriptor. | Coverage must be tiered, not assumed. |
| F7 | Package CSS references `--color-neutral-900` (Tooltip surface) which is not declared in the package stylesheet — **with a literal fallback** (`var(--color-neutral-900, #131316)`). | A static token check must model fallbacks, or it will either miss real gaps or fail on a harmless one. |
| F8 | The public npm smoke checks version and integrity *presence*, not equality to an expected artifact, and `gitHead` is not checked. | Post-publish proof is incomplete. |
| F9 | The shadcn payload carries no version, SHA or timestamp. | Provenance needs the equivalence method in §10, not a field. |

## 6. Derived vs hand-maintained contract

Prefer derivation. The only intended hand-maintained inputs are *scenarios* (what to render and click) and a small *exceptions* record (CLI transforms, token removals); both already have precedent (descriptors, intentional-difference records).

```ts
// Conceptual. Lives in lib/ccv/ (CCV-1), never in lib/component-registry*.ts or any public contract.
type ConsumerContract = {
  distribution: "shadcn-registry" | "npm-package";
  mode: "LOCAL_CANONICAL" | "PUBLIC_REGISTRY" | "LOCAL_TARBALL" | "PUBLIC_NPM";
  subject: string;                         // registry slug, or "@skrewww/react"
  source: {
    gitSha: string;                        // the commit the expectations were DERIVED from
    packageVersion?: string;               // npm: packages/react/package.json at gitSha
    registryOrigin?: string;               // shadcn: loopback URL or https://skrewww.com
  };
  expectations: {
    install:      { requiresTools: string[] };                       // pinned tool versions (§8)
    files?:       Array<{ target: string; sha256: string; kind: "own" | "internal" | "foundation" }>;
    dependencies?: { npm: string[]; registry: string[] };            // exact sets
    exports?:     { values: string[]; types: string[]; denied: string[] };
    css?:         { declared: string[]; selfContained: boolean; modeSelectors: string[] };
    manifest?:    { allowedKeys: string[]; allowedFileTypes: string[]; forbiddenLifecycle: string[] };
    scenarios?:   string[];                                          // references to existing descriptors, never copies
  };
};
```

**Derivation table**

| Expectation | Derived from | Hand-maintained? |
|---|---|---|
| shadcn items, files, targets, types, `registryDependencies`, npm `dependencies` | `buildDistributedRegistryItems()` + `FILE_DESTINATIONS` | no |
| per-file expected bytes | manifest `content` produced by the generator at `source.gitSha` | no |
| host requirements | registry `hostRequirements` (rendered into `docs`) | no |
| shadcn public exports per installed file | barrel `components/ui/index.ts` grouped by source file (AG-1C `publicExports`) | no |
| npm root export names (values and types) | `buildReactPackageEntry(componentRegistry, barrel)` (already used by `prepublish`) | no |
| npm `exports` map, peers, deps, tarball allowlist | `packages/react/package.json` + `checkManifest`/`checkPackedFiles` | no |
| delivered CSS declared set / used set / fallbacks | the delivered CSS itself (Foundation + module CSS, or `styles.css`) | no |
| Shape/Surface selectors, Foundation signature | Foundation extraction markers in the generator | no |
| scenarios | existing `COMPONENT_DESCRIPTORS` and `smoke-react-package` browser checks | yes (already exist) |
| accepted-installer-transform list | transformations proven to have **no** Skrewww contract consequence, keyed by the CLI pin | yes (small, exceptional, with an issue reference) — **empty** (§23); F1 can never be on it |
| token-removal allowlist | an explicit changelog decision | yes (small, exceptional) |

## 7. Authority map

| CCV claim | Authority | CCV role |
|---|---|---|
| shadcn files/targets/deps/content | canonical registry + generator at `source.gitSha` | verify the install against the generated manifest |
| npm exports / exports map / peers | `packages/react/package.json`, the generated entry, the build | verify the *installed* package against them |
| expected CSS variables | the transported CSS itself | verify delivery and resolvability, not values vs Figma |
| expected dependencies | manifest `dependencies` / package `dependencies` | verify what the installer actually added |
| expected release SHA | npm registry `gitHead`, the signed `react-v*` tag, rebuilt artifact | verify equality; the registry value is publisher-asserted |
| runtime behavior | canonical component behavior + an explicit scenario | assert the scenario in a real browser |
| token compatibility | the previous *published* artifact's delivered CSS | diff declared custom-property sets |

CCV never edits any of these.

## 8. The clean external consumer

| Aspect | Decision (v1) | Basis |
|---|---|---|
| shadcn consumer | **Next.js App Router, TypeScript, ESLint, Tailwind-free**, hand-authored `components.json`, `npm` | the proven flow (`shadcn init` refuses Tailwind-free projects); do not broaden to Vite/Remix (the manifests dropped `next` in MK-1 but a non-Next shadcn install has never been tested) |
| Tailwind consumer | **deferred**; one non-required scenario later (`create-next-app` default + `shadcn init --defaults`, case-sensitive FS note) | the public zero-config flow (Tailwind v4, `base-nova` collision on a case-insensitive FS) was verified manually only |
| npm consumer | **Vite 8 + React 19 + TypeScript strict**, `npm` | existing `smoke:react-package` |
| package manager | `npm` (matches the repo and docs) | — |
| workspace | a fresh `mkdtemp` under `os.tmpdir()`; never inside the repo; no pre-existing config except what CCV writes | existing practice |
| Node | the repository's `.nvmrc` (24.14.0); engines range is `>=22.13 <23 \|\| >=24 <25`; a Node-22 matrix is a later option | repo and package `engines` |
| internet | required for every mode (npm registry, upstream tools). LOCAL modes need no *Skrewww* network (loopback registry / local tarball) | existing |
| caching | per-run npm cache in the workspace by default; CI may restore a cache keyed by the pins (content-addressed, safe) | reproducibility over speed |
| cleanup | always remove the workspace on success; keep it on failure and print its path; **remove every temp dir CCV creates** (fixes F3) | — |
| versions | exact pins in one place (below); resolved versions recorded in every result | F4 |

**Pinning policy**

| Tool | Policy |
|---|---|
| `create-next-app` | **exact**; bumped deliberately in a reviewed change that re-runs CCV (verified-current candidate: 16.3.7) |
| `shadcn` CLI | **exact**; bumped deliberately; any accepted-transform entry would be keyed by this version (the list is empty) |
| Next, React | derived from the pinned `create-next-app`; **recorded**, not independently pinned (no committed lockfile in v1) |
| Vite, `@vitejs/plugin-react`, TypeScript, `@types/react*` | **exact**, replacing today's ranges |
| `@skrewww/react` | **exact** — release-derived: version from `packages/react/package.json` at the expected SHA (PUBLIC_NPM) or the local tarball (LOCAL_TARBALL) |
| `latest` of anything | **never** in a contract-defining run; only in a separate scheduled *canary* that reports upstream drift and never redefines the contract |

## 9. Modes

Four modes, never substituted for each other. A result always names its mode.

| Mode | Subject | Registry/package source | Can run | Proves |
|---|---|---|---|---|
| `LOCAL_CANONICAL` | shadcn | in-memory generator output at the checked-out commit, served on loopback | before deploy, in PR/release CI | canonical source → installable, usable result |
| `PUBLIC_REGISTRY` | shadcn | the real `https://skrewww.com/r/…` (and, optionally, directory resolution of `@skrewww`) | after deploy | the **deployed** payload works **and** equals what the expected commit generates (§10) |
| `LOCAL_TARBALL` | npm | `npm pack` of a fresh build | before publication, in CI | the candidate installs and works |
| `PUBLIC_NPM` | npm | the registry artifact at an exact version | after publication | the published artifact works, matches the verified candidate, and its provenance is consistent |

Publishing is never part of ordinary PR CI.

## 10. Check designs

### 10.1 Clean install and real registry install (checks 1, 2)

`LOCAL_CANONICAL`: scaffold once, then `shadcn add` for the items under test (one scaffold, many adds — see §12 on batching). `PUBLIC_REGISTRY`: identical, with `registries["@skrewww"]` set to the production URL.
Install failures are classified (§13) as contract failures (`INSTALL_FAILED`) only when the upstream tool ran and the Skrewww payload was the cause; network/tool crashes are `ENVIRONMENT_ERROR`.

### 10.2 Installed exports (check 3)

- **npm:** in the consumer, `import * as ns from "@skrewww/react"` (Node ESM `import()`, not just the bundler) and compare `Object.keys(ns)` to the derived value-export set — *equality*, so an unexpected extra export is also a failure. Type exports: a generated `.ts` file importing every expected type from `@skrewww/react` compiled by `tsc`. Denied paths: `import("@skrewww/react/dist/index.js")` and a deep source path must fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`; `./styles.css` and `./package.json` must resolve.
- **shadcn:** for each installed item, a generated `.tsx` imports every export the barrel attributes to its primary files, using the consumer's configured alias (`@/components/ui/<File>`), and uses each value as `typeof X` / each type as a type; `tsc` and `next build` must pass. Exports are never inferred from component names. No deep-import workaround is accepted: the expected import is the documented one.

### 10.3 Unresolved imports (check 4)

Three layers, because each proves something different:

1. **Import closure (static, fast, build-independent):** parse every installed Skrewww-owned `.ts`/`.tsx` with the TypeScript API using the consumer's `tsconfig`; each import must resolve to an installed file, a declared dependency, or a documented host requirement (`react`, `react-dom`, `next` only where declared). Catches a missing file or dependency without a build. Cannot see dynamic imports or runtime errors.
2. **`tsc --noEmit`:** `TS2307`/`TS2305` over everything the consumer imports. Cannot prove runtime resolution in a bundler.
3. **Production build** (`next build` / `vite build`): proves bundler resolution and server/client boundary errors. Does not prove behavior.

A build pass alone is insufficient evidence; layer 1 gives precise, attributable diagnostics.

### 10.4 CSS and token resolution (check 5)

Two levels, deliberately separate:

- **STATIC DELIVERY (every run, no browser):** over the CSS actually delivered (Foundation + module CSS, or `styles.css`): the declared custom-property set; the used set (`var()` references); each reference is *declared in the delivered set*, or has a fallback (reported, not failed — F7), or is a documented host-provided property (none today); every alias chain reaches a literal (reuse the AG-1C chain-resolution approach, mode contexts included); Foundation present once and before consumer CSS; Shape/Surface selectors present. Detects an item whose CSS depends on a token that was not transported.
- **RUNTIME RESOLUTION (representative only):** in the real browser, assert computed styles for *representative* slots — Foundation loaded, Shape (`sharp|rounded|pill|squircle`), Surface (`flat|gradient|glass`), a `:focus-visible` outline, and one component-specific slot per Tier 3 component — by **reusing the existing descriptors' `browserAssert` and the package browser checks**. No per-token browser test, no visual regression.

Undefined variables in some contexts (SVG attributes) compute silently to black/none, which is why the static level exists: runtime assertions alone cannot see them.

### 10.5 Manifest ↔ installed filesystem (shadcn)

For every file of every installed item: the installed file must equal the manifest `content` **byte for byte**. Expected hashes are never changed and installed bytes are never normalized. Also: installed target set == expected set; `registryDependencies` closure resolved; npm dependency delta == declared `dependencies`; no added, removed or modified file outside the expected targets (including no file written outside `components/`, `lib/`, `styles/`); shared targets (e.g. `lib/cn.ts`, declared by several manifests) exist exactly once with content equal to every contributing manifest; internal-dependency flattening (a private helper such as `internal/Portal.tsx` appears as a plain installed file).
**F1 classification (single rule, reconciled in CCV-2):** a byte difference is `UPSTREAM_TRANSFORM` (attribution *upstream*) only when applying a known installer transformation to the expected content reproduces the installed bytes **exactly**; any other difference is `FILE_CONTENT_MISMATCH`; `MANIFEST_MISMATCH` is reserved for manifest-level disagreement (contributing manifests that embed different bytes for one target, or a resolved closure the manifests do not justify). The F1 marker drop is therefore `UPSTREAM_TRANSFORM` — and it is still a **FAIL**: the attribution says who transformed the bytes, not that the result is acceptable, because Guard's public provenance contract reads the marker. A marker drop combined with any other change is `FILE_CONTENT_MISMATCH`. The accepted-transform list (transformations with no contract consequence) is empty, and F1 can never be added to it.

### 10.6 Manifest ↔ export surface (check 6) — two different invariants

Do not compare the shadcn transport with the npm root export mechanically: a shadcn component can copy source that is not an npm export, and the npm package exposes only the 8-component pilot.

- **S (shadcn):** S1 the installed file set equals the generator-derived set; S2 every barrel export attributed to an item's primary files is importable from the installed copy (§10.2); S3 no installed file imports a path outside the transported set; S4 the registry dependency closure resolves.
- **N (npm):** N1 root exports == `buildReactPackageEntry` names exactly; N2 `exports` map allows only `.`, `./styles.css`, `./package.json`; N3 declarations resolve with no `@/` alias; N4 only the pilot slugs are present.
- **X (cross-path, v1.1):** for a slug present in both, the public *names* exported by npm must equal the names exported by the shadcn installed primary files (both derive from the barrel). A consistency check on names, not file identity.

### 10.7 Unexpected postinstall (check 9)

**"Unexpected"** = any consumer-run lifecycle script or install-time side effect attributable to Skrewww that is not on an (initially empty) allowlist, or a side effect the manifest does not declare.

| Surface | Audit | Notes (measured) |
|---|---|---|
| `@skrewww/react` | packed manifest has no `preinstall`/`install`/`postinstall`/`prepare` (consumers run the first three; `prepare` only for git/local installs). `prepublishOnly` is publisher-only. | published `scripts` = `{ prepublishOnly }` only |
| Skrewww-declared dependencies | for the full transitive tree of `@skrewww/react`'s `dependencies`, and of each shadcn item's `dependencies`: list install-time lifecycle scripts | `@phosphor-icons/react@2.1.10`: none. `recharts@3.10.1`: `prepare: husky \|\| true` (registry installs do not run `prepare`; recorded, not a failure) |
| shadcn manifests | payload key allowlist (`$schema,name,type,title,description,author,dependencies,registryDependencies,docs,files`); file types ⊆ `{registry:ui, registry:lib, registry:file}`; no `cssVars`/`css`/`envVars`/`tailwind` side effects | shadcn items can declare more; Skrewww declares none |
| filesystem effects | the §10.5 diff (nothing outside targets, no extra `package.json` mutation) | exists today |
| process behavior | an `--ignore-scripts` install of the Skrewww-attributable subtree in an *audit consumer*: if it builds and passes, no script is functionally required | the main consumer installs normally (Next needs its own scripts) |
| network | beyond the installer's own fetches, none is attributable (a script check suffices for v1; egress logging is not built) | |

The shadcn CLI's own prompts, overwrite behavior (for example the `Button.tsx` vs `button.tsx` case-insensitive collision) and `create-next-app`'s install steps are **upstream behavior**: recorded under `environment`, never counted as Skrewww failures.

### 10.8 Representative renderability (check 7) and coverage tiers

Do not write a bespoke browser test for every component. Classify by installed-consumer risk, *derived from facts that already exist*:

| Tier | Meaning | Derived from | Applies to (today) |
|---|---|---|---|
| T1 | install + static + import/type + build | every distributed item | all 55 |
| T2 | + representative render | a descriptor exists (`renderHarness`) | 16 build-only descriptors (rendered, not interacted with) |
| T3 | + interaction / runtime / token-sensitive | the descriptor has a `browserAssert` | 22 components (overlays, charts, select/combobox/date-picker, data-table, tree-view …) |
| T4 | composed or dependency-heavy | an item with a third-party npm dependency or a registry dependency other than Foundation | text-input (form-field, validation-message, phosphor), charts (recharts), data-table, date-picker … |

The existing descriptors are **too implementation-specific to be coverage metadata** (they hold JSX, regexes and Playwright code), but they are a good *scenario library*: the tier is a function of their shape, so no second inventory is created. Items with no descriptor are T1; adding scenarios for them is optional follow-up, not a v1 requirement.
Cost control: install **all** distributed items into **one** consumer (one scaffold ≈ 40 s at normal load, one `tsc`, one build) instead of 55 scaffolds. Shared-target collisions between items — a real consumer scenario — are then exercised for free. Tier-3 browser scenarios run against pages composed per item in that single app.

## 11. Provenance (check 8) — what can actually be proven

| Source | Present today | Can CCV prove artifact ↔ commit? |
|---|---|---|
| npm registry | `gitHead` (`6ea9e0d0…` for beta.2, equals the tag commit); `dist.integrity` (sha512); two registry `dist.signatures`; **no provenance attestation** | **Partly.** `gitHead` is asserted by the publisher's npm client from local git, not attested. Stronger proof, verified feasible: rebuild the package at `gitHead` and compare file hashes with the published tarball (30/30 identical for beta.2 at HEAD; cross-machine and cross-OS determinism is **unproven** and is an acceptance item of CCV-5; if it fails, fall back to export-surface + CSS-surface equivalence). |
| signed tag | `react-v0.1.0-beta.2` (signed, annotated) | yes, tag → commit |
| shadcn payload | **none** — no version, SHA or timestamp | **By equivalence, not metadata:** the generator is deterministic, so production `/r/*.json` must equal the generator output at the expected SHA. Probe: 56/56 items and the index are deep-equal at HEAD. Which deployment serves production is visible only via Vercel/GitHub, not to a consumer. |
| Agent contracts | `provenance.sourceGitSha` | not part of any consumer artifact (`public/agent` is not transported) |
| generated artifacts | none beyond the above | — |

**No new public metadata is added in CCV-0**, and none is recommended for v1 (a SHA field in every manifest would churn every payload on every commit). If the owner later wants one, a free-form registry-item field such as `meta` may exist in the shadcn schema (not verified against the pinned CLI in CCV-0); that is a product decision for a separate slice.
"Release contract-test evidence" is satisfied by CCV's own result for the release run (stored as gitignored evidence and cited in release notes), not by a stored artifact in the package.

## 12. Token rename / removal compatibility (check 10) — realistic v1

**Consumer-visible runtime token** = a CSS custom property *declared in the delivered CSS* (npm `styles.css`: 505; shadcn `skrewww-foundation.css`). Out of scope for compatibility: Figma-only variable names, registry `tokensUsed`, `[TEMPORARY]` labels, token *values* (that would be visual regression), and package-exported constants (the package exports components and a provider only).

| Event | v1 classification |
|---|---|
| declared property removed or renamed between releases | `COMPATIBILITY_BREAK` (report-only at first; blocking in the release workflow once stable) unless on the explicit token-removal allowlist (a changelog decision) |
| property added | informational |
| value changed | ignored |
| declared property that stopped being referenced | informational |

**Baselines (so no stored second source is needed):**

- **npm:** the previous *published* version fetched from the registry. Measured: beta.1 → beta.2 = 505 → 505, nothing removed or added.
- **shadcn:** the *current production* `/r` payload versus the candidate (`LOCAL_CANONICAL`), compared before a deploy. Valid when production is the previous release. A tag-based baseline does not exist for the registry.

Deprecated tokens have no machine-readable marker today; the removal allowlist is the only mechanism and stays empty until needed. Multi-release history is excluded from v1.

## 13. Failure taxonomy

Deterministic categories; no scores. The canonical, closed set is the one implemented in CCV-1 (`lib/ccv/failure-codes.ts`, §22) — 23 codes, each with an attribution
(`skrewww`, `upstream` or `environment`). `ENVIRONMENT_ERROR` is never a contract failure: a check it affects is `unknown`, so flakes cannot masquerade as drift.
`UPSTREAM_TRANSFORM` is the only upstream code and is only ever a `fail`. The F1 rule is stated in §10.5. *(The CCV-0 draft of this table used provisional names —
`UNEXPECTED_FILE`, `UNRESOLVED_IMPORT`, `CSS_TOKEN_MISSING`, `RUNTIME_TOKEN_UNRESOLVED`, `UNEXPECTED_POSTINSTALL` — and filed the marker drop under `MANIFEST_MISMATCH`;
both are superseded by `FILE_UNEXPECTED`, `IMPORT_UNRESOLVED`, `CSS_DECLARATION_MISSING`, `CSS_RUNTIME_UNRESOLVED`, `LIFECYCLE_SCRIPT_UNEXPECTED` / `POSTINSTALL_SIDE_EFFECT` and `UPSTREAM_TRANSFORM`.)*

## 14. Result / evidence model

```ts
type CcvResult = {
  schemaVersion: string;
  subject: { kind: "shadcn-item" | "shadcn-batch" | "npm-package"; names: string[]; version?: string };
  distribution: "shadcn-registry" | "npm-package";
  mode: "LOCAL_CANONICAL" | "PUBLIC_REGISTRY" | "LOCAL_TARBALL" | "PUBLIC_NPM";
  source: { gitSha: string; workingTreeDirty: boolean; registryOrigin?: string; expectedPackageVersion?: string;
            resolved?: { version: string; integrity: string; gitHead?: string; signatures?: number } };
  environment: { node: string; npm: string; os: string; tools: Record<string, string>; resolvedVersions: Record<string, string> };
  checks: Array<{
    id: string;                                   // e.g. "shadcn.files.bytes", "npm.exports.equal"
    category: "install"|"files"|"deps"|"exports"|"imports"|"build"|"css"|"runtime"|"postinstall"|"provenance"|"compat";
    status: "pass" | "fail" | "skipped" | "not-applicable";
    failure?: string;                             // taxonomy code
    authority: string;                            // which canonical source the expectation came from
    expected?: string; actual?: string;           // concise
    evidence: Array<{ kind: string; ref: string; detail: string }>;   // each detail ≤ 400 chars; no logs dumped
  }>;
  summary: { pass: number; fail: number; skipped: number };
  status: "pass" | "fail" | "error";
  timing: { startedAt: string; durationMs: number };   // the only non-deterministic block
};
```

Every failure carries enough to reproduce (command, tool versions, workspace-relative path, expected vs actual). Output goes to a gitignored directory (like `audit/`), is never committed, and is never canonical.

## 15. Security and containment

Fresh-consumer verification executes third-party tooling and package lifecycle scripts. Threats: npm lifecycle scripts, a compromised upstream package or registry response, leakage of the maintainer's `~/.npmrc`/tokens/environment, a poisoned shared cache, and PATH/HOME contamination.

**Minimum containment (no containers in v1):**

1. dedicated `mkdtemp` workspace; refuse to run with the workspace inside the repo;
2. **environment allowlist** (`PATH`, `LANG`, `TMPDIR`, `CI`, proxy variables if set); strip `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `GH_*`/`GITHUB_*`, cloud and Vercel tokens;
3. **`HOME` and the npm cache redirected into the workspace** (so `~/.npmrc` credentials and the user cache are neither read nor polluted);
4. exact tool pins and recorded lockfile integrity strings (§8);
5. registry allowlist: loopback (LOCAL) or `skrewww.com` (PUBLIC) for Skrewww content; the local registry binds `127.0.0.1` only and uses a resolved-path traversal guard;
6. `--ignore-scripts` for the Skrewww-attributable audit consumer; the main consumer installs normally and its scripts are recorded;
7. the consumer app runs only on a loopback random port, and consumer code executes only inside Chromium's sandbox;
8. in CI: `permissions: contents: read`, no secrets, ephemeral runner; never run CCV where publish credentials exist.

## 16. Release and CI matrix

Current state: `ci.yml` runs no consumer smoke; `react-package.yml` runs package integrity + tarball smoke (path-filtered, plus `react-v*` tags); `smoke:consumer` and `--from-registry` are manual.

| Stage | Runs | Required? |
|---|---|---|
| PR / normal CI | **static, offline** CCV checks only: contract derivation, token-surface extraction, manifest/package allowlists, export-name derivation (unit tests) | yes (cheap; many already exist) |
| PR, path-filtered | `LOCAL_TARBALL` (existing workflow, extended in CCV-3) and a new `LOCAL_CANONICAL` batch consumer (CCV-7) | **non-required** until stable |
| release candidate (before publish) | `LOCAL_TARBALL` + `LOCAL_CANONICAL` full batch + npm compatibility vs the previous published version | **blocking in the release workflow** |
| post-publish / post-deploy | `PUBLIC_NPM` (exact version, expected SHA) + `PUBLIC_REGISTRY` (expected SHA) | manual or tag-triggered; its failure blocks announcing the release, not a revert |
| scheduled (weekly) | `PUBLIC_*` plus a floating-tooling **canary**; reports upstream drift | non-blocking, report only |

Do not add network-heavy `create-next-app` installs to ordinary `npm test`. Recommended first CI slice: **non-required, path-filtered, Linux, ~1–3 min**; promote to required only after a stable record. No workflow enforcement is changed in CCV-0.
Cost and flake notes: a scaffold + one install is ~46 s at normal load and 10+ minutes under heavy load (measured), so every step needs generous, explicit timeouts and an `ENVIRONMENT_ERROR` outcome; runs are not retried silently.

## 17. Gap matrix

Legend: ✅ ALREADY SUFFICIENT · ◐ REUSABLE BUT INCOMPLETE · ✖ MISSING · ⏸ DEFER FROM V1.

| Capability | Existing proof | Missing proof | Risk | Slice |
|---|---|---|---|---|
| clean consumer install (shadcn) | ✅ pinned Next consumer + real CLI | env/HOME isolation, structured evidence, recorded versions | medium | CCV-2 |
| clean consumer install (npm) | ✅ tarball + Vite | pins, evidence | low | CCV-3 |
| real registry install (shadcn) | ✖ manual 2026-08-09 only | automated `PUBLIC_REGISTRY` mode + payload equivalence | **high** (deployment drift undetected) | CCV-5 |
| real registry install (npm) | ◐ `--from-registry` manual | exact-artifact equality, `gitHead`, signature | medium | CCV-5 |
| distributed exports importable | ◐ implicit via render | enumerated value/type equality, denied deep imports, Node ESM | medium | CCV-3 (npm), CCV-2 (shadcn) |
| per-file content ↔ manifest | ◐ shared targets only | every file, exact bytes, proven-transform classification; **F1** | **high** | CCV-2 |
| unresolved imports | ◐ implicit via build | import-closure + attributable diagnostics | medium | CCV-2/CCV-3 |
| CSS static delivery | ✖ | declared/used/fallback/alias analyzer on delivered CSS | medium | CCV-4 |
| CSS runtime resolution | ◐ 22 of 38 descriptors; package browser checks | representative common checks, tier derivation | medium | CCV-4 |
| manifest ↔ export surface | ✖ | S-, N-, (X) invariants | medium | CCV-1/2/3 |
| representative renderability | ◐ 38 descriptors + package app | tiering; batch consumer | medium | CCV-2/CCV-4 |
| release source SHA | ✖ manual notes | `gitHead`/tag/rebuild-hash; registry equivalence | medium | CCV-5 |
| unexpected postinstall | ✖ | script audit + payload key allowlist + `--ignore-scripts` consumer | medium | CCV-1 (payload/manifest), CCV-3 |
| token rename/removal compatibility | ✖ | npm vs previous published; shadcn vs current production | medium | CCV-6 |
| structured evidence + failure taxonomy | ✖ | schema, writer, exit semantics | low | CCV-1 |
| version pinning | ◐ CLI, create-next-app pinned | Vite/TS exact, recorded resolved versions, canary separation | medium | CCV-2/3 |
| Tailwind consumer, Vite/Remix shadcn, case-sensitive FS | ✖ | scenarios | low | ⏸ |
| visual regression, a11y certification, all-interaction coverage | ✖ | — | — | ⏸ |
| multi-release compatibility history | ✖ | — | — | ⏸ |

## 18. CCV v1 — the smallest credible scope

**Included:** both distributions (**shadcn source** and **`@skrewww/react`**); the four modes (`LOCAL_CANONICAL`, `PUBLIC_REGISTRY`, `LOCAL_TARBALL`, `PUBLIC_NPM`); one pinned Next consumer (Tailwind-free, batch of all distributed items) and one pinned Vite consumer; derived contracts; per-file byte equivalence (installer transforms classified, never accepted); dependency and file-set equality; import closure + `tsc` + production build; installed export equality (values, types, denied deep imports); static CSS delivery including fallbacks; representative runtime via the existing descriptors/browser checks; postinstall and payload audits; provenance (`gitHead`, integrity, signature, rebuild-hash, registry equivalence); npm compatibility against the previous published version (report-only, blocking only in the release workflow); structured evidence and the failure taxonomy.

**Not in v1:** other frameworks/bundlers for shadcn; Tailwind consumers; Windows or case-sensitive-FS matrices; visual regression; accessibility certification; browser interaction for every component; shadcn compatibility beyond "current production vs candidate"; multi-release compatibility; cryptographic attestation or new public metadata; Figma, Make Kit, Guard changes; any hosted service; any fix to product defects found (F1 is reported, not fixed).

## 19. Implementation slices

Decomposition chosen from the audit: derive and structure first (offline, cheap), then one shared runner, then the two installed-result verifiers, then CSS/runtime, then public/provenance, then compatibility, then CI.

| Slice | Goal | Inputs | Outputs | Acceptance | Stop boundary |
|---|---|---|---|---|---|
| **CCV-1 — contract derivation, evidence schema, taxonomy** *(✅ implemented — §22)* | Pure, offline derivation of every expectation in §6, plus `CcvResult`, the failure codes, a gitignored evidence writer | registry, generator, `pilot-entry`, barrel, `packages/react/package.json` | `lib/ccv/` (types, `deriveShadcnContract`, `deriveNpmContract`, payload/manifest allowlist checks, CSS-surface extractor, result builder, writer) + tests; `ccv-out/` in `.gitignore` | deterministic contracts for all 56 items and the package; payload-key/file-type and package-lifecycle checks pass on the real generator output and manifest; schema validated; no network, no install; works with `npm test` offline | no consumer runs, no CI, no Guard change |
| **CCV-2 — clean-consumer runner + shadcn installed-result verifier (`LOCAL_CANONICAL`)** *(✅ implemented — §23)* | One sandboxed batch consumer; verify the installed result of all items | CCV-1 contracts; pins | shared runner (workspace, env allowlist, HOME/cache redirect, timeouts, cleanup, version recording, `ENVIRONMENT_ERROR`); batch Next consumer; per-file byte check (proven installer transforms classified as `UPSTREAM_TRANSFORM`, never accepted); set/dep/shared-target checks; import closure; `tsc`; build; installed export check; evidence JSON | all 55 items install in one consumer; **F1 reported as `UPSTREAM_TRANSFORM` (a FAIL) for every affected file**; builder list derived (F5); temp dirs not leaked (F3); results reproducible across two runs | `smoke:consumer` retained as-is until CCV-2 supersedes it; no public mode; no runtime token checks beyond existing descriptors |
| **CCV-3 — npm installed-result verifier (`LOCAL_TARBALL`)** | Prove the candidate tarball's installed result | CCV-1 npm contract; `smoke-react-package` | extends the existing smoke: exact export equality (Node `import()` and `tsc`), denied deep imports, `exports` map, declarations without aliases, lifecycle audit (`--ignore-scripts` consumer), peer/dependency policy, exact tool pins, evidence JSON | all checks pass on beta.2's candidate; mutation checks (extra export, removed export, added `postinstall`) fail with the right code | no public mode, no CI change |
| **CCV-4 — CSS/token delivery + representative runtime** | Static delivery analyzer and a derived tier assignment | delivered CSS of both paths; descriptors | analyzer (declared/used/fallback/alias, mode selectors, Foundation order); tier function; common representative browser checks (Foundation, Shape, Surface, focus-visible) | analyzer reproduces the measured 505-property surface and the F7 fallback; a deliberately removed token fails `CSS_TOKEN_MISSING`; tiers computed, no new inventory | no per-token browser tests, no visual regression |
| **CCV-5 — public modes + provenance** | `PUBLIC_REGISTRY` and `PUBLIC_NPM` with expected-SHA proof | expected commit/tag; production URLs; npm registry | modes; payload equivalence (`PROVENANCE_MISMATCH` with diff list); `gitHead`/integrity/signature/dist-tag checks; rebuild-at-`gitHead` hash comparison; network-failure classification | beta.2 passes `PUBLIC_NPM`; production passes `PUBLIC_REGISTRY` at the release SHA; **rebuild determinism proven in CI (Linux), not just locally** | no new public metadata; no publishing; read-only network |
| **CCV-6 — compatibility baseline** | Token/export removal detection | previous published npm; current production registry | diff reports; `COMPATIBILITY_BREAK`; empty allowlist mechanism | beta.1 → beta.2 reports no break; a synthetic removal is caught; report-only by default | no value comparison, no multi-release history |
| **CCV-7 — CI and release integration** | Place the modes in the lifecycle (§16) | CCV-2…6 | `consumer-contract.yml` (non-required, path-filtered, no secrets); release-gate and post-publish hooks; weekly canary; docs | green on `main`; documented runtimes; failures classified | no required-check enforcement without owner approval |

## 20. Relationships

- **Audit Agent:** may later treat a CCV result as an external evidence source (a new evidence source type, a later slice). CCV never calls the explanation layer, a model or Figma.
- **Guard:** CCV findings never become Guard rules or facts; F1 is a *dependency* of Guard's public provenance contract and should be raised as a distribution/Guard-contract question, outside CCV.
- **Make Kit:** consumes path B; no Make output is used as evidence here and no Make Kit change belongs to this track.

## 21. Decisions requested from the owner (not blocking CCV-1)

1. **F1 (marker dropped by the shadcn CLI):** fix the placement/contract in a separate distribution slice *before* CCV-2, or let CCV-2 ship reporting it as a known failing check?
2. Promote the `LOCAL_CANONICAL` workflow to required after how long a stable record?
3. Add `meta.sourceGitSha` to registry payloads (payload churn per commit) or keep provenance by equivalence only?
4. Add a Tailwind-v4 consumer scenario to v1.1?

## 22. CCV-1 — contract derivation, evidence schema and failure taxonomy (implemented 2026-10-04)

CCV-1 answers *what exactly should an external consumer receive?* It does **not** answer *what did the consumer actually receive?* — that starts in CCV-2. It is offline,
deterministic and read-only: no network, no temp consumer, no `npm install`, no shadcn CLI, no browser, no model, no Figma, no source mutation. **F1 is neither fixed nor hidden.**

```
canonical sources ─► deterministic derivation ─► ConsumerContract ─► (CCV-2…) installed-result verifier ─► CcvResult
```

**Code:** `lib/ccv/` — `types.ts` (schemas), `failure-codes.ts`, `serialize.ts` (stable JSON, SHA-256), `css-surface.ts`, `derive-shadcn-contract.ts`, `derive-npm-contract.ts`, `ids.ts`,
`validate.ts`; debug CLI `npm run ccv:contract` (`scripts/ccv-contract.ts`); tests under `lib/ccv/` (63). The only edit outside `lib/ccv/` is additive: `lib/react-package/release-checks.ts`
now exports the tarball file rules (`REQUIRED_PACKED_FILES`, `PACKED_ALLOWED_EXACT`, `PACKED_ALLOWED_PREFIXES`) that its own `checkPackedFiles` already used, so CCV reads the same rule instead of restating it.

**Modes.** `LOCAL_CANONICAL` / `PUBLIC_REGISTRY` verify shadcn; `LOCAL_TARBALL` / `PUBLIC_NPM` verify npm; a validator rejects any other pairing. The expectations are **identical across the
two modes of one distribution** — only `mode` and `source.registryOrigin` differ (`https://skrewww.com` for `PUBLIC_REGISTRY`, `https://registry.npmjs.org` for `PUBLIC_NPM`, none for the local modes) —
so contracts are not duplicated per mode.

**`ConsumerContract`** (`schemaVersion` 1.0.0): `distribution`, `mode`, `subject`, `source { gitSha, packageVersion?, registryOrigin? }`, optional `tools` (pins; supplied by CCV-2, never derived from `latest`) and
`expectations`. It holds an expectation and **never** a result, status or pass/fail. The two distributions keep their own explicit shapes:

- **shadcn** — `item`; `manifest { keys, fileEntryKeys }`; `files[]` (`target`, `installPath`, `sourcePath`, `sha256`, `bytes`, `kind` own/internal/foundation, `fileType`, `originMarker?`); `dependencies { npm, registry }`;
  `hostRequirements` (evidence only); `closure { items, npm, installPaths, sharedTargets[] }` (the transitive registry-dependency closure; a shared target lists every item that installs it and the distinct hashes);
  `exports { values, types, bySourcePath }`; `css` (surface plus `sourceFiles`, `resolvedAgainst`, `scriptSuppliedCustomProperties`); `authorities`.
- **npm** — `package` (name, exact version, `type`, `engines`, the `exports` map verbatim, `publicSpecifiers`, packed-file rules, lifecycle-script state, `publishConfig`, `sideEffects`); `dependencies` (names and ranges for
  runtime, peers, optional); `exports { values, types, denied, byModule }`; `css` (surface plus `stylesheetSpecifier`, `sourceFiles`, `scriptSuppliedCustomProperties`); `authorities`.

**Derivation sources (nothing is hand-maintained).**

| Expectation | Derived from |
|---|---|
| the set of shadcn items | `buildDistributedRegistryItems()` itself — **no second slug allowlist** (finding F5). A test scans every CCV source for any registry slug literal; another injects a different item list and the contracts follow it |
| shadcn files, targets, types, dependencies | the generated items; `sha256` is of the exact manifest `content`, before any installer transformation (no file bodies are stored) |
| own / internal / foundation | the canonical registry entry's `files` and `internalDependencies`; Foundation is its own kind |
| shadcn exports | the public barrel read with the TypeScript API (`readPublicBarrel`, reused from AG-1C), attributed to each item's own source files |
| npm exports | `buildReactPackageEntry` — the package build's own logic — `extractExportedNames`, **cross-checked against the TypeScript reading of the barrel**: any disagreement (for example an inline `type` modifier that the build's regex would misclassify) aborts the derivation |
| npm public / denied specifiers | the `exports` map (public) and the tarball file rules (denied: every packed file the map does not expose, plus source-style paths such as `@skrewww/react/components/ui/Button`) |
| npm lifecycle | the manifest `scripts`, split into scripts a consumer install runs (`preinstall`, `install`, `postinstall`, `prepare`) and the rest; the **allowed** consumer-run set is policy and is empty |
| npm CSS | the Foundation extraction plus every CSS file reachable from the package entry modules (AG-1C import-graph walker) |

**CSS analyzer** (`analyzeCssSurface`): declared custom properties (any selector), every `var()` use (including inside fallbacks), uses without a usable fallback, fallback-only uses, and
`[data-skrewww-shape|surface]` selectors. `var(--x, fallback)` is **never** treated as `var(--x)` (finding F7): an undeclared name is *unresolved* only when a use has no fallback (or its fallback's own
nested `var()` cannot resolve); a name whose every use is backed by a literal fallback is `fallbackBackedUses`, not a failure. Nested fallbacks are judged lazily, as CSS does. The analyzer is not a CSS engine
(no cascade, no computed values) and does not look at Figma or `tokensUsed`. Derived facts: the Foundation (and the npm stylesheet) declare 497 / 505 custom properties; the only fallback-backed use is
`--color-neutral-900` (the Tooltip surface); no delivered CSS has an unresolved use except **Slider**, which uses six properties (`--slider-fill-percent`, …) that no CSS declares and that `Slider.tsx` assigns inline —
that is why `scriptSuppliedCustomProperties` is recorded *beside* the unresolved list and never subtracted from it. Judging it is CCV-4's job.

**`CcvResult` and evidence** (schema only; no real result exists yet). A result has `distribution`, `mode`, `subject`, `environment`, `source { expectedGitSha, observedGitSha?, packageVersion?, integrity? }`, ordered `checks`, a
`summary` (pass / fail / unknown / not-applicable) and an optional `volatile` block (the only place a timestamp may live). A check has a stable `checkId`, `status`, optional `failureCode`, `claim`, `expected`/`actual`, a
required **`authority`** (one of: generator, canonical-registry, package-manifest, public-barrel, package-build-entry, delivered-css, release-tag, npm-registry-metadata, ccv-scenario) and `evidence[]`.
Evidence is `{ kind, ref, observed ≤ 400 chars, sha256? }` with a closed kind list — no log dumps, file bodies or `node_modules`. The validator is strict (unknown fields rejected, nothing sanitized): a `fail` needs a failure code and
evidence; a `pass`/`not-applicable` cannot carry a code; an `unknown` may carry only `ENVIRONMENT_ERROR`; `ENVIRONMENT_ERROR` is never a `fail`; check ids are unique, well-formed and prefixed by the distribution; the summary must equal the checks.

**Failure taxonomy** (`failure-codes.ts`): the closed set of 23 codes — `ENVIRONMENT_ERROR`; `INSTALL_FAILED`, `MANIFEST_MISMATCH`; `FILE_MISSING`, `FILE_UNEXPECTED`, `FILE_CONTENT_MISMATCH`, `UPSTREAM_TRANSFORM`; `EXPORT_MISSING`,
`EXPORT_UNEXPECTED`, `DEEP_IMPORT_EXPOSED`; `IMPORT_UNRESOLVED`, `TYPECHECK_FAILED`, `BUILD_FAILED`; `DEPENDENCY_MISMATCH`, `PEER_DEPENDENCY_MISMATCH`; `CSS_DECLARATION_MISSING`, `CSS_RUNTIME_UNRESOLVED`;
`LIFECYCLE_SCRIPT_UNEXPECTED`, `POSTINSTALL_SIDE_EFFECT`; `PROVENANCE_MISSING`, `PROVENANCE_MISMATCH`; `COMPATIBILITY_BREAK`; `INTERACTION_FAILED`. Each has an area, a plain-language meaning and an **attribution** — `skrewww`
(all but two), `upstream` (`UPSTREAM_TRANSFORM`) or `environment` (`ENVIRONMENT_ERROR`) — so an installer's transformation is distinguishable from a Skrewww-generated defect and an environment failure is never a contract failure. There is no score.

**Stable ids** (`ids.ts`): `<shadcn|npm>:<subject>:<category>:<key>` built from the thing identified (an install path, an export, a custom property, a denied specifier) — for example
`shadcn:button:file:components/ui/Button.tsx`, `npm:@skrewww/react:export:DialogBody`, `npm:@skrewww/react:css:--semantic-action-primary`. Never an index, never random.

**Determinism.** `stableStringify` sorts keys by code unit, drops `undefined`, ends with a newline; arrays are sorted by the derivers wherever order is semantically irrelevant. The same commit and mode give byte-identical JSON,
and a contract contains no timestamp. The CLI prints the same bytes the library derives.

**F1 (origin marker) treatment.** The expected file bytes are the generator output **including** the `/** @skrewww-component <slug> */` first line, and the contract records it (`originMarker`). Nothing in CCV-1 strips, normalizes,
tolerates or allowlists it: no contract field, function or comment concerns transforms or allowlists (a test walks every key and scans the sources), every `sha256` equals the hash of the untouched generator content for every
item, and the hash of the marker-less content provably differs. `UPSTREAM_TRANSFORM` can be recorded only on a `fail`; a `pass` with that code is invalid. **CCV-2 is expected to surface the shadcn marker drop as a real finding.**

**Offline boundary.** Tests derive every contract with `fetch`, `child_process` and `http(s)` replaced by functions that throw; scan every CCV source for network, process, installer, browser, model and Figma code; and allow
only repository derivation helpers plus `node:crypto`/`node:path`/`node:url` as imports (no Guard rules, no Audit Agent comparison or explanation layers). The CLI needs `git` only to read the current SHA.

**Coverage today.** One contract per generator item (the full distributed set, Foundation included) and exactly one npm contract (`@skrewww/react` at the manifest version). The derived npm root surface equals the package build's
entry expectations: 17 value exports and 29 type exports (Dialog's nine compound parts among the values), a three-specifier public surface, and a denied list derived from the exports map. When a local `packages/react/dist` exists, an
extra test (skipped on a clean checkout) confirms the derived CSS surface equals the built stylesheet's.

**Next:** CCV-2 — shadcn installed-result verifier (clean-consumer runner plus per-file byte comparison). It is expected to surface the F1 marker transform as a real finding rather than accept it.

## 23. CCV-2 — clean-consumer runner and shadcn installed-result verifier (✅ COMPLETE 2026-10-05)

CCV-1 says what a consumer *should* receive; CCV-2 checks what a clean shadcn consumer *did* receive, in `LOCAL_CANONICAL` mode only (the registry payload is the canonical
generator output served on loopback). `PUBLIC_REGISTRY`, `LOCAL_TARBALL` and `PUBLIC_NPM` are rejected by the CLI (later slices). **F1 is detected, kept as a FAIL with
`UPSTREAM_TRANSFORM`, and neither fixed nor allowlisted.** `scripts/smoke-test-consumer.ts` is unchanged.

```
CCV-1 contracts ─► workspace (OS temp, isolated env) ─► loopback registry (generator items)
  ─► create-next-app@16.3.7 (Tailwind-free) + hand-written components.json ─► snapshot
  ─► shadcn@4.21.1 add <every subject> (one consumer) ─► snapshot ─► file set · per-file bytes · dependencies · registry closure · imports
  ─► export harness ─► next typegen · tsc ─► next build ─► cleanup ─► validated CcvResult
```

**Code.** `lib/ccv/runner/` — `pins.ts` (exact pins, time limits, Node range), `env.ts` (allowlisted child environment, evidence redaction), `process.ts` (bounded commands,
environment-vs-contract classification), `workspace.ts` (create / clean up), `registry-server.ts` (loopback registry with a request log). `lib/ccv/shadcn/` — `expected.ts` (batch
expectation from contracts), `fs-snapshot.ts`, `compare-files.ts` (byte comparison and transform proof), `dependencies.ts`, `closure.ts`, `imports.ts`, `exports-harness.ts`,
`tsc-diagnostics.ts`, `result.ts` (result, exit codes, summary, stable comparison) and `verify.ts` (thin orchestration with an injectable command runner). CLI:
`npm run ccv:shadcn` (`scripts/ccv-shadcn.ts`). Results go to the gitignored `ccv-out/` (or a directory outside the repository).

**Isolation.** One `mkdtemp` workspace under the OS temp directory, refused if it overlaps the repository. It holds the consumer, `HOME`, XDG config, `TMPDIR`, the npm cache and an
empty npm user config, so the user's `~/.npmrc`, `~/.config` and npm cache are never read or written. The child environment is an allowlist (`PATH`, locale, proxy variables)
plus those redirections; no token or other secret-bearing variable is forwarded, and secret values, the workspace path and the registry port are redacted from evidence. The
registry binds `127.0.0.1` on an ephemeral port and serves only `/r/<name>.json` for the generator items; nothing is written to `public/r`, and the production registry is never contacted.

**Pins (never `latest`).** `create-next-app` **16.3.7** (the known-good zero-config version; replaces smoke:consumer's 16.3.0) and `shadcn` **4.21.1** (the version CCV-0 reproduced
F1 on with a Tailwind-free components.json; replaces 4.16.2); Node from the repository's engines range; npm recorded. Resolved Next / React / TypeScript and the CLI's
self-reported version are recorded in `environment.tools`. A floating-`latest` canary remains CCV-7.

**Timeouts.** Scaffold and install 15 min each, `next typegen` 5 min, `tsc` and `next build` 15 min each, version probes 2 min; every command is also clamped to what remains of a
30-minute run budget. On timeout the whole process group is terminated (SIGTERM, then SIGKILL). Output is kept in memory as a bounded tail — no capture files. There is no retry
loop: only a scaffold that fails with a recognisable network error is retried, once; a timeout is never retried. A timeout, a process that cannot start, a signal kill or a network/disk
error is `ENVIRONMENT_ERROR`: the affected check and every check that could not run become `unknown`, never `fail`.

**Subjects and install.** The subjects are every distributed item of type `registry:ui`, in generator order, read from `buildDistributedRegistryItems()` (no second list); Foundation
is not requested — it must arrive through `registryDependencies`. All subjects are installed into ONE consumer with ONE `shadcn add … --yes` invocation (`--install sequential` runs one
invocation per subject inside the same consumer). The order is recorded in the install check.

**File comparison.** The expected install paths are the union of the subjects' CCV-1 closures. After the install: every expected path must exist (`FILE_MISSING`), nothing outside
those paths may be added, removed or modified — package manifests only when npm dependencies are declared (`FILE_UNEXPECTED`), and every installed file is hashed and compared with
its contract SHA-256. Hashes are never changed and installed bytes are never normalized. A difference is classified by trying to PROVE an installer transformation: each known
transformation is applied to the expected content (the generator output whose hash the contract records — verified before use) and only an exact match with the installed bytes
counts. Proven → `UPSTREAM_TRANSFORM`; otherwise → `FILE_CONTENT_MISMATCH`; contributing manifests that disagree about one target → `MANIFEST_MISMATCH`. All three are FAIL. The
accepted-transform list (transformations with no contract consequence) is **empty**. Known transformations: `origin-marker-line-removed` and `leading-block-comments-removed`.

**Dependencies, closure, imports, exports.** The direct-dependency delta of `package.json` must equal the union of declared npm dependencies (`DEPENDENCY_MISMATCH` for a missing,
extra, removed or changed one); the scaffold's own dependencies are the baseline and host requirements are never expected to be installed. The local registry's request log must show
exactly the derived closure (missing → `INSTALL_FAILED`; extra or unknown → `MANIFEST_MISMATCH`). Every installed TS/TSX file is parsed with the TypeScript API: relative and `@/` imports
must resolve to a transported installed file, and bare imports to a package that is both installed and declared (npm dependency or documented host requirement) by the items that install
the file (`IMPORT_UNRESOLVED` / `DEPENDENCY_MISMATCH`). A generated harness (`ccv/exports-harness.tsx`) imports every value and type CCV-1 attributes to each installed source file, from
that file through the consumer's `@/` alias, one name per line, so a `tsc` diagnostic maps to one export (`EXPORT_MISSING`). Then `next typegen` and `tsc --noEmit` (the scaffold's
`strict: true`, `skipLibCheck: true`, `isolatedModules: true` are recorded; nothing is relaxed) and `next build`, with `app/page.tsx` importing the Foundation stylesheet and the harness so every
installed module is compiled. The build is additional proof, never a substitute for the other checks. No browser, computed-style or interaction checks (CCV-4).

**Result and exit codes.** A validated CCV-1 `CcvResult` with stable check ids (`shadcn:<subject>:<area>:<key>` — workspace, tools, registry, scaffold, install, one per file,
file-set, one per declared dependency, dependencies, registry-closure, one per TS file for imports, one per exporting file, typecheck, build, cleanup); every check names its authority; timestamps
and durations live only in `volatile`. Exit **0** — all contract checks pass; **1** — usage error; **2** — environment/tooling failure, no trustworthy verdict; **3** — the verifier completed and
found contract failures (the expected outcome while F1 is open). The summary says separately whether the *verifier* completed and what the *contract result* is. A run never overwrites an
earlier result: each is written to the next `….run-<n>.json`, and the CLI compares the new stable sections with the previous result; `npm run ccv:shadcn -- --compare <a> <b>` does the same
offline (exit 0 identical, 3 different); `--across-commits` neutralises only the commit label, for runs taken at different commits whose canonical inputs are unchanged — every check, including every expected hash, must still match.

**Real runs (owner's terminal; the agent sandbox cannot resolve `ui.shadcn.com`, from which the shadcn CLI fetches its base-color data).** Commit `5431180`, Node 24.14.0, npm 11.12.1,
macOS x64; create-next-app 16.3.7 → Next 16.3.7, React 19.2.8, TypeScript 5.9.3; shadcn 4.21.1.

| Run | Subjects | Pass | Fail | Unknown | Failures (all `UPSTREAM_TRANSFORM`) | Skrewww-attributed |
|---|---|---|---|---|---|---|
| Button probe | 1 (closure: button + foundation) | 25 | 2 | 0 | `Button.tsx` origin marker removed; `internal/link-utils.ts` leading comment removed | 0 |
| Full batch | 55 (closure: all 56 items) | 278 | 67 | 0 | 55 origin-marker removals (every marked file) + 12 leading-comment removals | 0 |

Full batch detail: one `shadcn add` of 55 subjects succeeded; the CLI requested exactly the 56-item closure (Foundation through `registryDependencies`); 166 files added, exactly the 166
expected install paths, plus `package.json` / `package-lock.json`; dependency delta exactly `@phosphor-icons/react` and `recharts`; 110 import checks and 55 export checks pass; `tsc` and
`next build` pass; the workspace was removed. 99 installed files are byte-identical to the generator output. Every one of the 55 files that carries `@skrewww-component <slug>` lost
exactly that line (the rest of each file is byte-identical); 12 unmarked files lost exactly their leading block comment (for example `internal/link-utils.ts`, `internal/calendar-date.ts`,
`internal/chart-format.ts`, two CSS modules). Both are shadcn 4.21.1 behavior; both remain FAIL. The marker loss has a real consequence (Guard's public provenance contract reads the marker);
the comment loss has no runtime consequence but is not accepted either — the accepted list stays empty.

**Reproducibility — CLOSED.** The first two full batches could not be compared (the second overwrote the first; the CLI now writes `….run-<n>.json` and never overwrites).
A third, independent full batch was then run in a fresh workspace and compared with the saved batch **from the artifacts**:

| | Earlier saved batch | Reproducibility batch |
|---|---|---|
| commit | `5431180` | `095f74b` |
| subjects / closure | 55 / 56 | 55 / 56 |
| pass · fail · unknown | 278 · 67 · 0 | 278 · 67 · 0 |
| failure codes | 67 × `UPSTREAM_TRANSFORM` (55 marker, 12 comment) | identical |
| Skrewww-attributed failures | 0 | 0 |

`npm run ccv:shadcn -- --compare <earlier> <reproducibility> --across-commits` → **IDENTICAL** (exit 0): the same 345 check ids in the same order, the same statuses, failure codes,
expected and installed hashes and evidence; with the commit label neutralised the stable serialisations are byte-identical. The only stable field that differs is
`source.expectedGitSha`, and it differs legitimately: between `5431180` and `095f74b` no canonical input of the contracts changed (no change under `components/`, `styles/`, the
registry, the generator, the provenance marker or the CCV-1 derivation — `095f74b` added the CCV-2 verifier and docs only), which the identical expected hashes confirm independently.
Neither result's stable sections contain a temp path, home path, cache path, port, duration or timestamp; those live only in `volatile` (durations 119 s and 151 s).

**Limitations.** LOCAL_CANONICAL only; one Next/Tailwind-free consumer on one OS; the CLI needs `ui.shadcn.com` (base-color data) besides the npm registry; static import resolution covers
static `import`/`export … from` (not dynamic `import()`); no runtime/CSS checks (CCV-4); no public-registry or provenance checks (CCV-5); a full run takes about two minutes on an idle
machine and much longer under load.

**Closure.** Tool complete: every CCV-2 acceptance criterion is met, including two-run reproducibility. Product not clean: the current shadcn distribution fails 67 file checks, all upstream-attributed (F1 plus leading-comment removal); F1 stays a FAIL until a separate distribution decision addresses it.

**Stop boundary.** No Guard, product, registry, Figma, Make Kit or package change; F1 not fixed; no CI wiring. Next: **CCV-3 — npm installed-result verifier**.
