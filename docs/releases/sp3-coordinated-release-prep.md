# SP-3 coordinated release preparation (REL-1A) — 2026-10-03

**Status:** prepared in REL-1A; **execution in progress (REL-1B)** — see "Execution record" at the end. This note holds the audited release
state, the notes to publish, the execution order and the future commands for four tracks: `@skrewww/react@0.1.0-beta.2`,
the Figma Pro library, the Figma Free library and Community file, and the Gumroad Pro product.

## Audited Figma release state (read-only, measured)

Pro (`U6KUuNf7DF4CP9QBOkLSUx`) — every page measured: `spacing/6` = **20** (Badge Small 12, Tooltip 8; Actions,
Forms, Navigation, Containers, Content 0). Button Small 15/15 variants `minHeight` `spacing/32`, padding `spacing/0`,
32px, content gap `spacing/8`; Link Small/Medium/Large gap `spacing/4`; Text Input, Select and Search Field Small 32px
on the same model; Tabs 15 variants with an absolute indicator, heights Small 33 / Medium 35 / Large 46, gap `spacing/0`;
Split Button Small segments 32/32 with the `spacing/2` seam intact; Validation Message gap `spacing/4`; Form Field
Wrapper `spacing/8`; Combobox 15 variants (Small 32 / Medium 36 / Large 46), no `spacing/6`.

Free (`KrQIUWznpBdP0ZuWjOu2e3`) — every page measured: `spacing/6` = **12** (Badge Small only). Button Small 15/15 on the
32px model with gap `spacing/8`; Link gaps `spacing/4`; Text Input and Select Small 32px; Tabs 15 variants, absolute
indicator, heights 33 / 35 / 46. Search Field, Validation Message, Form Field Wrapper, Split Button, Combobox and
Tooltip do not exist in Free and were not added.

## Pro / Free parity matrix

| SP-3 change | Classification | Pro | Free |
|---|---|---|---|
| Button Small gap 6 → 8; Link M/L gap 6 → 4 (Stage 1) | SHARED_TECHNICAL_FIX | present | present |
| Button / Text Input / Select Small 32px model (Stage 2) | SHARED_TECHNICAL_FIX | present | present |
| Tabs overlay indicator, stable heights (SP-3B) | SHARED_TECHNICAL_FIX | present | present |
| Search Field Small 32px (Stage 2) | NO_FREE_COUNTERPART | present | n/a |
| Split Button Small segments (SP-3C) | NO_FREE_COUNTERPART | present | n/a |
| Validation Message gap 4 (SP-3D); Form Field Wrapper unchanged | NO_FREE_COUNTERPART | present | n/a |
| Combobox State × Size (SP-3F) | NO_FREE_COUNTERPART | present | n/a |

No shared fix is missing from Free; no Pro-only content leaked into Free.

## Known non-blocking follow-ups (kept out of this release)

Figma Medium/Large control heights (36 / 46) versus React (40 / 48); Split Button Medium/Large segment mismatch (35/36,
46/48); remaining React 6px values (breadcrumb, tag, calendar, menu, select popup label, credit-card and phone fields,
list-item, radio, banking row); Combobox Size option order (Medium, Small, Large); Text Input Medium 35 vs Select Medium 36;
the Combobox open-example widening. All classified NON_BLOCKING_FOLLOW_UP — none is a regression introduced by SP-3.

## Release notes (copy)

**npm `@skrewww/react@0.1.0-beta.2`** — see `docs/releases/react-v0.1.0-beta.2.md` (Fixed: Validation Message icon/text
spacing 4px; Form Field vertical spacing 8px. No API, dependency or export change.)

**Figma Pro**
- Spacing foundation: 4px base grid with an 8px-preferred macro rhythm; `spacing/2` and `spacing/6` kept only as documented,
  scoped exceptions.
- Controls: Small Button, Text Input, Select and Search Field use an explicit 32px height; Split Button Small segments align to 32px.
- Navigation: the Tabs active indicator no longer changes a tab's height when selected.
- Forms: Validation Message icon/text gap refined; Combobox now has Small, Medium and Large sizes.
- Consistency: Button and Link icon gaps align with the canonical component rhythm.

**Figma Free / Community** (only applicable changes)
- Small Button, Text Input and Select use an explicit 32px height; Button Small icon gap aligned.
- Link Medium and Large icon gap aligned.
- Tabs: the active indicator no longer changes a tab's height when selected.

## Community and Gumroad assessment

- **Figma Community (Free): `UPDATE_RECOMMENDED`.** Shared technical components changed visibly (Small controls 29 → 32px, Tabs
  state heights). The live Community listing could not be inspected from this environment; confirm its current version
  note before publishing.
- **Gumroad (Pro): update recommended** — upload the republished Pro `.fig` as a new version with the Pro notes above; marketing
  screenshots that show Small controls, Tabs selected state, Split Button, Validation Message or Combobox may need refreshing
  (not checked; no screenshots are tracked in this repository).
- **Version label:** the repository records no numbered Pro/Free release scheme; public Figma-facing changes are dated by
  month in `content/changelog.ts`. Recommended label: **October 2026**. The current Gumroad version text could not be read
  (no login), so confirm it before reusing any numbering.
- **Website at release time:** add one `content/changelog.ts` entry (October 2026) describing the Figma update and the
  `@skrewww/react@0.1.0-beta.2` fix, and update `docs/architecture/react-package.md` / `docs/project-status.md` publication
  facts. The Combobox page already says "State × Size — 15 variants", which is now accurate; no counts changed.
  Do not add the changelog entry before publication.

## Release execution order (REL-1B)

1. Release-preparation commit on `main`; CI green (done in REL-1A).
2. Fresh clean checkout of that commit; `npm ci --ignore-scripts`; `npm run release-gate:react-package`.
3. Interactive terminal: `npm login`, `npm whoami` (owner's 2FA; never stored or disabled).
4. `cd packages/react && npm publish --tag beta`.
5. Poll the registry; `npm view @skrewww/react dist-tags version`; expected `beta` → `0.1.0-beta.2`, `latest` unchanged
   (`0.1.0-beta.1`).
6. `npm run smoke:react-package -- --from-registry 0.1.0-beta.2`.
7. Signed tag `react-v0.1.0-beta.2` on the release commit; verify the tag-triggered package workflow.
8. GitHub prerelease from `docs/releases/react-v0.1.0-beta.2.md`.
9. Publish the Pro Figma library.
10. Publish the Free library if its library is published, then update the Figma Community Free file.
11. Upload the updated Pro file / notes to Gumroad.
12. Add the changelog entry, update status docs, final website and status verification.

## Future commands (execution phase only — not run)

```bash
git checkout <release-commit-sha> && npm ci --ignore-scripts
npm run release-gate:react-package
npm login && npm whoami
cd packages/react && npm publish --tag beta
npm view @skrewww/react dist-tags version
cd ../.. && npm run smoke:react-package -- --from-registry 0.1.0-beta.2
git tag -s react-v0.1.0-beta.2 <release-commit-sha> -m "@skrewww/react 0.1.0-beta.2" && git push origin react-v0.1.0-beta.2
gh release create react-v0.1.0-beta.2 --prerelease --title "@skrewww/react 0.1.0-beta.2" --notes-file docs/releases/react-v0.1.0-beta.2.md
```

## Execution record (REL-1B, 2026-10-03)

| Track | State | Evidence |
|---|---|---|
| npm `@skrewww/react@0.1.0-beta.2` | **PUBLISHED, verified** | `npm view`: version resolves, `beta` → `0.1.0-beta.2`, `latest` → `0.1.0-beta.1` (unchanged); registry sha512 and shasum identical to the verified tarball; `gitHead` = `6ea9e0d0a5c0980f88153e998ff5667acc3aab93`; public smoke `--from-registry 0.1.0-beta.2` 41/41; published CSS has Validation Message `0.25rem` and Form Field `0.5rem` |
| Git tag `react-v0.1.0-beta.2` | **PUBLISHED, verified** | signed annotated tag at the release commit (git: Good signature, ED25519; GitHub: verified, valid) |
| Tag workflow | **PASSED** | React package workflow green on the tag push |
| GitHub prerelease | **PUBLISHED** | prerelease, non-draft, notes from `docs/releases/react-v0.1.0-beta.2.md` |
| Figma Pro library | **PENDING_MANUAL** | no library-publish action exists in the available Figma tooling; the owner's completion was not confirmed; working file re-verified unchanged |
| Figma Free library | **PENDING_MANUAL** | same |
| Figma Community (Free) | **PENDING_MANUAL** | manual Figma UI |
| Gumroad (Pro) | **PENDING_MANUAL** | needs the owner's Gumroad session and the published Pro file |
| Website changelog | **UPDATED (React only)** | October 2026 entry `@skrewww/react 0.1.0-beta.2`; deliberately says nothing about Figma, Community or Gumroad because none is confirmed; a Figma-facing entry is added only after those outcomes are confirmed |

Pre-publish gate in a clean worktree of the release commit: 174 test files / 1823 tests, package integrity checks, 42/42 tarball
smoke, Make Kit check — all passed. The first REL-1A gate attempts hit one hard-coded-version test assertion (fixed) and load-induced timeouts
(rerun clean).

### Manual-track confirmation status (recorded 2026-10-03)

The handoff message for the manual tracks arrived with its outcome fields unfilled, so Figma Pro, Figma Free, Community and Gumroad are
recorded as unconfirmed (`PENDING_MANUAL`), not as done. Library publication freshness, the Community listing and Gumroad are not
verifiable with the available tooling (the Figma library tool lists library names and keys only). No claim about them is public.
