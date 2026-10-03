# Make Kit guidelines (MK-2B)

**Status:** **the first Make Kit is published (privately, to the owner's team) and validated — MK-2E complete with guidance limitations.**
The kit is assembled from the published runtime package `@skrewww/react@0.1.0-beta.2` plus the generated guidelines produced by this compiler,
with no attached Figma library. The compiler and setup contract were built in MK-2B; see "Assembly readiness (MK-2D)", "MK-2E1" and
"MK-2E — first Make Kit published and validated" at the end.

## What this is

A deterministic compiler that turns canonical Skrewww metadata into the
*guidelines* a future Figma Make Kit would carry, plus one short hand-written
setup file. It is **not a source of truth**: it is a compiled projection, like
the Agent contracts it reads.

```
canonical registry ──► Agent contracts + system contract + recipes ─┐
package.json + package entry (real public exports) ─────────────────┼─► Make guideline compiler ─► make-kit/dist/
styles/tokens.css (Shape/Surface modes) ────────────────────────────┤        (pure, deterministic)
make-kit/setup.md (the only hand-written file, copied verbatim) ────┘
```

## Generated vs manual

| File (in `make-kit/dist/`) | Kind | Fed by |
|---|---|---|
| `guidelines/components/<slug>.md` (one per package component) | generated | Agent contract (summary, guidance, API props, behavior, tokens, relationships, status, accessibility level, Figma *availability*) + the package entry's public exports |
| `guidelines/system.md` | generated | system contract (principles, never-invent, naming, tokens, Shape/Surface policy), modes derived from `styles/tokens.css`, status census from contracts, three small authored policy lists (see below) |
| `guidelines/accessibility.md` | generated | system contract `accessibilityBaseline`, contracts' `accessibilityLevel`, recipes' composition-level notes |
| `guidelines/composition.md` | generated | authored recipes whose required components are all in the package |
| `guidelines/Guidelines.md` | generated | overview/router; lists files and components |
| `guidelines/setup.md` | **manual** | `make-kit/setup.md`, copied verbatim and validated |
| `manifest.json` | generated | package surface, components, exports, modes, provenance |

`make-kit/setup.md` holds only Make/Vite environment setup (stylesheet import,
React baseline, Shape/Surface attributes on `<html>`, the Dialog portal rule,
routing, fonts, Figma boundary). The compiler **rejects** a setup file that
contains a component API table, restates a canonical component fact, hard-codes
the package version, contains forbidden content, or omits required topics.

The only authored text inside the compiler is in `lib/make-kit/policy.ts`: source
precedence, the Figma boundary and status rules. Each statement names the
canonical document it restates, and a test checks that document still contains
the anchor phrase.

## npm imports are derived, not maintained

`@skrewww/react` imports come from the **actual** package surface, never from a
registry field or hand-written path: package name, version, peers and the
`./styles.css` specifier from `packages/react/package.json`; public export names
(including compound exports such as `DialogContent`) from the same barrel
statements the package entry re-exports (`readBarrelExportsByModule` in
`lib/react-package/pilot-entry.ts`). If an export disappears, compilation fails.
`npm run check:make-guidelines -- --verify-dist` additionally requires every
promised export to exist in the **built** `packages/react/dist`.

Agent contracts describe the root component's props only; compound parts are
listed from the package entry and the guideline says their props are not modeled
there. No Agent schema was changed.

## Status and Shape/Surface

Status is read from the registry/contracts and a mismatch fails the build. If
the package later includes Beta components the output carries `beta`
automatically. Shape and Surface values come from the token stylesheet. Per-
component mode support is **not** machine-readable today, so the guidelines say
so; the compiler fails if a contract ever starts declaring shape/surface fields,
so guidance cannot go stale silently.

## Figma boundary

Figma references in the guidelines are optional reference metadata (availability
and "verified reference recorded" only — no node ids, file keys or snapshot
payloads). Captured Figma snapshots are not included and are not authority.
Live Figma access is never required, and the compiler makes no Figma or network
call. React owns runtime API and semantics; Figma owns visual behavior where
verified. Canonical prose containing a Figma node id fails validation.

## Output policy, provenance, commands

- **Generated and gitignored** (`make-kit/dist/`), like `public/agent/`. Committing it
  would put a commit SHA inside committed output.
- **Deterministic:** guideline files carry no commit data and are byte-identical
  for unchanged inputs across commits. `manifest.json` records
  `sourceGitSha` / `sourceGitCommitTimestamp` (same convention as the Agent
  contracts), the contract/registry/Agent Kit versions, and a SHA-256 digest of
  all guideline files.
- `npm run build:make-guidelines` writes the output.
- `npm run check:make-guidelines` compiles twice (byte-identical), validates
  package/contract/status/export mapping, and, if `make-kit/dist` exists,
  requires it to match a fresh compile. No network, no Figma, no writes.
  `-- --verify-dist` also checks the built package. It runs in the main CI job and
  in the package workflow.

## What MK-2B does not do

It does not publish `@skrewww/react`, create or publish a Make Kit, touch Figma,
expand the package beyond its 8-component pilot, add charts or React 18, change
component status or any Shape/Surface value, or start AG-1C. Deferred: MK-2C
(publication), MK-2D (kit assembly and verification), Figma library
publication/admin confirmation, React 18, package expansion, CSS class naming.

## Assembly readiness (MK-2D, 2026-10-03)

**Verdict: ready for manual Make Kit assembly.** Nothing in this repository blocks the kit; the one remaining step cannot be
automated with the available tooling.

**Old blockers.** "Publish `@skrewww/react`" — cleared (beta.2 public, exact-version install verified from the registry).
"Confirm/publish the chosen Figma library" — cleared: the Pro and Free libraries were published in the October 2026 release
(owner-confirmed), and the first kit needs no attached library (decision below). Plan eligibility could not be checked from
here; Figma documents kits as available to Full seats on paid plans, and the Skrewww workspace is a Pro-tier team with a Full seat.

**Revalidated.** `build:react-package`, `build:make-guidelines`, `check:make-guidelines` and `check:make-guidelines -- --verify-dist` pass:
14 files, deterministic, no network or Figma access, manifest package `@skrewww/react` `0.1.0-beta.2` (ESM, peers `react` and
`react-dom` `^19.2.0`, stylesheet `@skrewww/react/styles.css`; the public package's one runtime dependency is
`@phosphor-icons/react`), 8 components all `stable`, 17 root exports (Button, Card, Dialog + 8 compound parts, FormField, Link, Spinner,
TextInput, ValidationMessage, SkrewwwRouterProvider), Shape `sharp|rounded|pill|squircle` and Surface `flat|gradient|glass` from the
token stylesheet, `guidelines/setup.md` byte-identical to `make-kit/setup.md`. The generated prose contains no Figma file key, node id
or snapshot payload (only statements that snapshots are not included); the 16 import statements in the guidelines use only real
package-root exports and no deep imports. The public npm package matches the manifest (version, peers, exports, `sideEffects` CSS).

### Figma library decision (recommendation)

No earlier decision exists. **Recommendation: attach no Figma library to the first kit** (package + guidelines only).
- The npm package is self-contained: `styles.css` carries tokens, Foundation and component styles, so Make renders Skrewww without a library.
- The package is an 8-component pilot; either library exposes far more (Free 23 components, Pro 52). Attaching one invites Make to compose
  Figma-only components (Tabs, Select, Combobox, Search Field, Split Button…) that are **not** in npm, which the guidelines forbid implying.
- Free cannot represent two package components (Form Field and Validation Message exist in Pro only); Pro is the paid product. Figma
  documents kits as published to the owner's team or organization (not publicly), so Pro would not leak publicly, but it would still add
  paid assets and Figma-only surface for no rendering benefit.
- Revisit (Free first) when the package surface grows to cover the library. This is a recommendation for the owner to confirm in the UI,
  not a durable rule.

### Make capability matrix

Sources: Figma Help "Get started with Make kits", "Write design system guidelines for Make kits", "Bring your design system package to a
Make kit" (checked 2026-10-03). The available Figma tooling creates and edits Design/FigJam/Slides files and reads libraries; it has no Make
Kit action.

| Capability | Class | Notes |
|---|---|---|
| Compile the guideline payload | AUTOMATABLE (done) | `npm run build:make-guidelines`, deterministic |
| Create a Make Kit | MANUAL | Make file → Settings → Create a kit (documented UI flow; no API documented) |
| Add the npm package | MANUAL | "Assemble your kit" modal; public npm packages are supported |
| Pin an exact package version | MANUAL, UNVERIFIED | Figma's docs do not describe version selection; the owner must enter `0.1.0-beta.2` explicitly. `latest` is still `0.1.0-beta.1`, so a default would install the wrong version |
| Attach a published library | MANUAL (not used) | Figma supports importing variables and styles; not recommended for kit 1 |
| Add guidelines | MANUAL | Markdown files in the kit's `guidelines/` folder with an entry file (`Guidelines.md`); upload/import mechanics are not documented |
| Starter code / environment | MANUAL | Follow `guidelines/setup.md` (Vite, React 19.2) |
| Test the kit | MANUAL | prompt Make to build, in the UI |
| Publish / share | MANUAL | published to the owner's team or organization |
| API creation or CI assembly | UNAVAILABLE | none documented |

### Assembly payload and manual steps

The kit receives the generated `make-kit/dist/guidelines/` tree **unmodified** — Figma's expected layout (a `guidelines/` folder with
`Guidelines.md`, `setup.md`, `components/`) already matches, and Figma sets no file-count or size limit, so no packaging layer is needed:

```
guidelines/Guidelines.md  system.md  accessibility.md  composition.md  setup.md
guidelines/components/{button,link,card,text-input,form-field,validation-message,spinner,dialog}.md
```

plus one npm dependency, **exactly `@skrewww/react@0.1.0-beta.2`**, and no attached library. `manifest.json` is a verification artifact
(digest, provenance) and is not uploaded. Steps for the owner: `npm run build:react-package && npm run build:make-guidelines` at the
verified commit; open a Make file → Settings → Create a kit → "Assemble your kit"; add `@skrewww/react` at exactly `0.1.0-beta.2`
(confirm the resulting kit `package.json` shows the exact version, not a tag or range); add the 13 guideline files with the same
folder structure; test with the scenarios below; publish to the team.

### Validation status

No Make environment was available, so the kit guidance itself is **NOT_TESTABLE** here and nothing was hand-corrected into a pass.
Package-level behavior was verified against the real public `0.1.0-beta.2` in a clean Vite + React 19 consumer (41/41): Button and Link
render real anchors with no provider, Button token height, Card, Form Field and Text Input label/description/error wiring, assertive
Validation Message, Spinner, Shape and Surface computed behavior, Dialog portal / focus / Escape / mode inheritance from `<html>`, router
provider behavior and no console errors. Scenarios to run in Make after assembly: A Button (action, link, Shape/Surface), B form composition (corrected after MK-2E1 — see below; the
original wording asked for FormField + TextInput + ValidationMessage, which is not a valid composition), C Card with a Button, D Dialog, E routing
(native anchors by default), F accessibility adherence. Classify each PASS / PASS_WITH_GUIDANCE_LIMITATION / FAIL_PACKAGE / FAIL_GUIDELINE / FAIL_MAKE_ENVIRONMENT and
do not fix generated output by hand.

**Figma boundary.** Guidelines state only that a verified Figma reference exists; they never claim a Figma-only component is in npm.
No pixel parity is claimed and no Figma file was changed.

## MK-2E1 — form composition root cause (2026-10-03)

The first real Make Kit run (owner-reported) built `FormField > TextInput` with a separate `ValidationMessage announce="assertive"` present on first render; the
accessibility audit found a duplicate label for the input and an assertive announcement for a static error.

**Root cause: multiple (A + B + D, with E).** The package runtime is correct; the kit's own canonical guidance prescribed the invalid composition.
- *A — wrong canonical recipe.* `agent/recipes/validated-text-field.ts` (feeds Agent Kit and Make) told the model to "render Form Field as the outer shell", "pass Text Input as Form
  Field `children`" and render a Validation Message — impossible against the real API (`FormField` children is a render function; `TextInput` requires its own `label` and
  already renders `FormField`).
- *B — missing constraint.* Nothing said that Text Input is a complete field, that Form Field already renders the error, or that a separate message duplicates it.
- *D — ambiguity.* `content/forms.ts` told readers to "pair" Text Input with Form Field and listed Text Input under Form Field's use cases; related-link text read "control
  composed with FormField"; a registry example rendered `announce="assertive"` statically and the `announce` description did not say what a static error should use.
- *E — scenario definition.* The MK-2D scenario (and the owner's prompt) asked for FormField + TextInput + ValidationMessage. That matched the kit's own wrong recipe, so
  the prompt did not contradict the kit — both were wrong.
- *F — model behavior* contributed only in rendering assertive on first paint without a rule to follow.

**Package assessment: no defect.** `TextInput` composes `FormField`; `FormField` renders its error through `ValidationMessage announce="off"` linked by `aria-invalid` +
`aria-describedby`; `ValidationMessage` maps announce to a role as documented. Known property (not changed): complete fields have no built-in live announcement, and
caller-supplied `aria-describedby` replaces their wiring.

**Fix (canonical sources only; generated outputs regenerated for verification).** Recipe rewritten (`requiredComponents` now `["text-input"]`, optional `form-field` and
`validation-message`, version 0.2.0); `content/forms.ts` Text Input, Form Field and Validation Message guidance; `lib/component-registry-forms.ts` related-link labels, the
`announce` description and the Validation Message example; `app/agent-kit/page.tsx` recipe line; two Agent Kit eval cases' expected components. Historical eval run artifacts are
unchanged evidence. **Regression tests:** `lib/make-kit/compiler.test.ts` (generated guidance never says to wrap Text Input or nest it as `FormField` children, states it is a
complete field, scopes Form Field, forbids a second message and static assertive output, no fenced example nests them) and `lib/agent-kit/recipe-compiler.test.ts`. The new
tests fail against the old sources (8 failures) and pass on the fix.

### MK-2E status (owner-reported run; MK-2E is not complete)

| Scenario | Result |
|---|---|
| A Button | PASS |
| B Form composition | FAIL_GUIDELINE — root cause above (fixed in source; Make Kit not yet updated) |
| C Card | PASS |
| D Dialog | pending: manual live-runtime confirmation |
| E Routing | generated-demo limitation: the demo's root-relative destinations do not exist (native anchors are correct) — a demo-quality issue, not a form or package defect |
| F Accessibility adherence | the audit surfaced the form defects above; re-check after B is re-run |

### Corrected Test B prompt (rerun in the already-created Make Kit after re-importing the regenerated guidelines)

> Build a "Request access" screen with one form, using only the Skrewww Make Kit.
> 1. Use a single `TextInput` as a complete field for "Work email": `label="Work email"`, `supportingText="We will only use this to contact you."`, `required`, `type="email"`, `name="email"`. Do not wrap it in `FormField`, do not add a separate label element, and do not render a separate `ValidationMessage` for the email error.
> 2. On first render show no error at all (the `error` prop is undefined) and no `ValidationMessage` in the page.
> 3. When the form is submitted with an empty or invalid email, set the `TextInput` `error` prop to "Enter a valid work email." Do not pass `aria-describedby` or `aria-invalid` yourself.
> 4. Also after that failed submit only, render one form-level `ValidationMessage` (`type="error"`, `announce="assertive"`) saying "We could not send your request. Fix the highlighted field and try again." It must not exist in the DOM before the failed submit.
> 5. Add a `Button` of type submit labelled "Request access". Import only from the `@skrewww/react` package root, import `@skrewww/react/styles.css` once, and do not add custom CSS or Tailwind that changes the spacing between the label, input, helper text or message.
> 6. When done, report for the email field: the number of `<label>` elements associated with the input, its accessible name, `aria-invalid` and the id that `aria-describedby` points to, before and after a failed submit; which element (if any) has `role="alert"`; and confirm `FormField` does not appear in the code.

Expected result: exactly one label for the input (accessible name "Work email (required)"); before submit `aria-describedby` targets the supporting text and no element has `role="alert"`;
after a failed submit `aria-invalid="true"` and `aria-describedby` targets the `-error` message (rendered without a live-region role); only the form-level message has `role="alert"` and
it appears only after the failed submit; spacing is package-native (label, input and message 8px apart; 4px between the message icon and text). If `FormField` itself should be tested,
make it a separate advanced scenario using `FormField` directly with a native control through its render prop — never around `TextInput`.

## MK-2E — first Make Kit published and validated (2026-10-03)

**Verdict: MK-2E COMPLETE WITH GUIDANCE LIMITATIONS.** The first real Skrewww Make Kit was assembled, tested in the real Make environment, corrected through
MK-2E1, revalidated, and published privately to the team. The facts below are **owner-confirmed**; Make and its published kits are not visible to repository tooling.

### Published Kit 1

| Item | Value |
|---|---|
| Kit name | Skrewww Make Kit |
| Published / scope | yes — team/private (not public) |
| Make Kit's own package identity | `@make-kits/skrewww-make-kit@1.0.0` — assigned by Make; **not** the runtime package |
| Runtime dependency | `@skrewww/react` pinned to the exact published version `0.1.0-beta.2` (not a tag or range) |
| Guidelines | the 13 generated Markdown files (regenerated after MK-2E1); `manifest.json` was not imported |
| Attached Figma library | **none** |

Keep the two identities apart: **`@make-kits/skrewww-make-kit@1.0.0`** is the Make Kit wrapper Make created; **`@skrewww/react@0.1.0-beta.2`** is the runtime
dependency that renders Skrewww components. Only the second is the package this repository builds and publishes.

### Validated Kit 1 architecture

`published @skrewww/react (exact pinned version)` + `generated Make guidelines` + `no attached Figma library`. This architecture is now proven in the real Make
environment. The no-library decision (see "Figma library decision" above) is not to be reopened until the npm package surface expands enough to justify attaching one.

### Validation matrix (final)

| Scenario | Result | Notes |
|---|---|---|
| A Button / Link / Shape / Surface | PASS | |
| B Form composition | PASS (after MK-2E1) | one label, accessible name "Work email (required)", no `FormField` around `TextInput`, supporting-text `aria-describedby` initially, error `aria-describedby` and `aria-invalid` only after a failed submit, no static `role="alert"`, only the dynamically introduced form-level `ValidationMessage` has `role="alert"`, package-native spacing, build passes |
| C Card | PASS | |
| D Dialog | PASS_WITH_GUIDANCE_LIMITATION | initial focus, Tab and Shift+Tab containment, Escape, focus return to the trigger, Cancel and X all pass; limitation is `MAKE_ENVIRONMENT` (below) |
| E Routing | PASS_WITH_GUIDANCE_LIMITATION | native anchors, no `SkrewwwRouterProvider`, no `preventDefault` or custom interception, modified-click, external/new-tab and hash behavior preserved; limitation is `GENERATED_IMPLEMENTATION` (below) |
| F Accessibility | PASS with demo/environment limitation | corrected field semantics, Dialog semantics and portal behavior, focus behavior, package-root imports, stylesheet imported once, document language, build passes; no package defect, no guideline defect |

### Accessibility conclusion

No Skrewww package defect and no remaining guideline defect. The one form failure found in the first run was a guideline defect (the recipe and field guidance), fixed at the canonical
source in MK-2E1 and revalidated. The remaining items are environment or generated-demo limitations, not Skrewww behavior.

### Limitations

- **`MAKE_ENVIRONMENT` — host-shell focus escape.** After excessive Tab navigation, keyboard focus can leave the embedded Make preview into Figma's surrounding host UI, and Shift+Tab may not
  reliably bring it back. This is Make's embedding, not Skrewww Dialog behavior: inside the preview the Dialog traps focus and restores it correctly. Do not treat it as a package-level
  Dialog defect, and do not fix it in the package.
- **`GENERATED_IMPLEMENTATION` — demo quality.** An earlier generated demo linked to root-relative destinations that did not exist. The links themselves were correct native anchors; the
  missing pages are a property of the generated demo, not of the package or the guidelines.

### Boundary

Kit 1 attaches no Figma library, so it makes no claim that any Figma-only component is available in npm; Figma references in the guidelines stay reference-only. Updating the kit means
republishing it from newly regenerated guidelines and, when the package changes, an exact new `@skrewww/react` version.
