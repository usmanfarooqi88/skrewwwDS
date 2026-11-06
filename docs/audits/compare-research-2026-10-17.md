# /compare research matrix — APPROVED AND APPLIED (2026-10-17)

**Verified:** 2026-10-17 (every source below was fetched or queried that day).
**Status:** approved and applied to `lib/comparison.ts` with these owner decisions: Spectrum shadcn rows
are `Partial` and scoped to Adobe React Aria Components; Skrewww Guard is `Partial — Guard Beta, 3 consumer
rules`; Skrewww Shape/Surface read "4 / 3 selectable modes"; the parity claim names five pilot components.
The tables below are the original proposal and remain the evidence record; the production values live in
`lib/comparison.ts`, with source ids resolved through `comparisonSources`.
**Method:** first-party docs, official repos, and package registries only. Search-engine
summaries were used as leads and never as evidence. Absence of evidence is recorded as
`Not yet verified`, never as `No`.

Status codes: **Y** = Yes · **P** = Partial · **F** = factual label (no judgement) · **U** = Not yet verified.

## Rubric used for ambiguous rows (approve or change)

| Row | Yes | Partial | Notes |
|---|---|---|---|
| Shape system | Official docs describe selectable shape modes | Official corner-radius/shape tokens or guidance, no selectable modes | No competitor documents selectable modes |
| Surface system | Official docs describe selectable surface modes (flat/gradient/glass) | Official elevation/material/shadow guidance, no selectable modes | Fluent "Material" could be argued as Yes |
| Agent-readable contracts | Official machine-readable component specs for agents | Official AI-oriented docs access (MCP/llms.txt) without confirmed component specs | |
| Agent Skill / AI guidance | Public agent skill for consumers | Public AI guidance without a public skill | |
| Deterministic validation | Official static checks of design-system usage | Exists but narrower/not equivalent | Not equivalent to Guard's contract-claim checks |
| shadcn distribution / installability | Official registry installable with the shadcn CLI | Official but scope differs from the compared system | |

## The 16-row matrix (proposed)

| # | Capability | Carbon | Fluent 2 | Spectrum | Atlassian |
|---|---|---|---|---|---|
| 1 | Component coverage | U | U | U | U |
| 2 | React implementation | Y | Y | Y | Y |
| 3 | Figma support | Y | Y | **U** | **U** |
| 4 | Design tokens | Y | Y | Y | Y |
| 5 | Shape system | U | P | P | P |
| 6 | Surface system | U | P | P | P |
| 7 | shadcn-compatible distribution | U | U | **P (scope!)** | U |
| 8 | npm distribution | Y | Y | Y | Y |
| 9 | Registry installability | U | U | **P (scope!)** | U |
| 10 | Agent-readable contracts | P | P | Y | P |
| 11 | Agent Skill / AI guidance | P | U | Y | P |
| 12 | Deterministic validation | U | U | U | Y |
| 13 | Accessibility guidance | Y | Y | Y | Y |
| 14 | Documentation | Y | Y | Y | Y |
| 15 | Open-source availability | Y | Y | Y | **U** |
| 16 | Maturity / ecosystem status | U | U | U | U |

## Evidence by row (verified 2026-10-17)

### 1. Component coverage — all U
Official indexes are not like-for-like, so no count is proposed. Raw entry counts (not usable as component counts):
Carbon 43 entries under "Components" in `llms.txt`; Fluent ~113 distinct `Components/*` doc groups in its
`llms.txt`; React Spectrum S2 117 `.md` entries (includes non-component docs); Atlassian 59 packages in
`llms-components.txt`. **Needs a counting protocol** (same inclusion rules for all five) before any count is shown.

### 2. React implementation — Y ×4
- Carbon: `@carbon/react` 1.118.0, Apache-2.0 — https://www.npmjs.com/package/@carbon/react
- Fluent: `@fluentui/react-components` 9.74.9, MIT — https://www.npmjs.com/package/@fluentui/react-components
- Spectrum: `@adobe/react-spectrum` 3.47.7, `@react-spectrum/s2` 1.8.2 — https://www.npmjs.com/package/@react-spectrum/s2
- Atlassian: `@atlaskit/*` React components — https://atlassian.design/llms.txt ("High-level React components"), https://www.npmjs.com/package/@atlaskit/button

### 3. Figma support
- Carbon **Y**: official "Figma libraries" incl. "(v11) Carbon Design System"; public Figma Community versions need a Figma license; "some content is accessible to IBMers only" — https://www.carbondesignsystem.com/getting-started/designing/design-resources
- Fluent **Y**: "Fluent 2 UI kits… Built in Figma" (Core Web/iOS/Android) — https://fluent2.microsoft.design/get-started/design
- Spectrum **U**: a search snippet referenced a "Spectrum Web Figma Library" on the old S2 site; could not re-confirm on a first-party page. Figma Community kits found are third-party. Needs a manual check of spectrum.adobe.com.
- Atlassian **U**: `llms.txt` says "Official Figma plugin… Component library", but https://atlassian.design/get-started/figma-libraries rendered no content and redirected under an `/atlassians` path, so public availability is unclear.

### 4. Design tokens — Y ×4
- Carbon: Themes page, tokens per theme — https://www.carbondesignsystem.com/building-blocks/foundations/themes ; https://www.npmjs.com/package/@carbon/themes
- Fluent: "global tokens… alias tokens" — https://fluent2.microsoft.design/design-tokens
- Spectrum: https://spectrum.adobe.com/page/design-tokens/ ; https://www.npmjs.com/package/@adobe/spectrum-tokens
- Atlassian: https://atlassian.design/llms.txt ("Design Tokens", `@atlaskit/tokens`) ; https://www.npmjs.com/package/@atlaskit/tokens

### 5. Shape system
- Carbon **U**: Themes page does not mention corner radius/shape; nothing else reviewed.
- Fluent **P**: four shape forms plus corner-radius tokens (None/Small/Medium/Large/X-Large/Circle); no selectable modes documented — https://fluent2.microsoft.design/shapes
- Spectrum **P** (medium confidence): token catalogue lists "Layout — spacing, dimensions, corner radius, and other layout primitives" — https://opensource.adobe.com/spectrum-design-data/tokens/
- Atlassian **P**: `radius.xsmall`…`radius.full` tokens — https://atlassian.design/foundations/radius

### 6. Surface system
- Carbon **U**: not found on pages reviewed (themes are colour themes: White, Gray 10, Gray 90, Gray 100).
- Fluent **P**: "Material… solid, mica, acrylic, and smoke" (acrylic described as frosted glass; Windows-oriented) — https://fluent2.microsoft.design/material
- Spectrum **P**: drop-shadow styles for elevation — https://spectrum.adobe.com/foundations/styles/object-styles/drop-shadow
- Atlassian **P**: elevation surfaces sunken/default/raised/overlay with shadows — https://atlassian.design/foundations/elevation

### 7 & 9. shadcn-compatible distribution / registry installability
- **Spectrum — P, scope decision needed.** Adobe's React Aria publishes a first-party shadcn registry (159 items, `registry:ui` etc.) at https://react-aria.adobe.com/registry/registry.json, listed in the shadcn directory as `@react-aria` (homepage on adobe.com), and its docs have a "shadcn CLI" install section — https://react-aria.adobe.com/getting-started.md ; https://ui.shadcn.com/r/registries.json. It covers React Aria Components (Tailwind/CSS examples), **not React Spectrum S2**. Decide whether "Spectrum" includes React Aria.
- Fluent **U**: the only Fluent-named entry, `@fluent2-react-kit`, states "Independent open-source project, not affiliated with Microsoft" — excluded. No official registry found.
- Carbon **U**, Atlassian **U**: not in the shadcn directory index (462 entries, searched 2026-10-17); no official mention found. This is absence of evidence, not a "No".
- Note: `@spectrumui` in the same index is unrelated (spectrumhq.in).

### 8. npm distribution — Y ×4
Carbon `@carbon/react`; Fluent `@fluentui/react-components`; Spectrum `@adobe/react-spectrum`, `@react-spectrum/s2`, `react-aria-components`; Atlassian `@atlaskit/*`. All queried via https://registry.npmjs.org/<pkg>. **Recommend package names, not versions, in labels** (versions go stale).

### 10. Agent-readable contracts
- Carbon **P**: hosted MCP covering "components, design tokens, icons, guidance, and code examples"; IBMid sign-in required; release status not stated — https://www.carbondesignsystem.com/getting-started/carbon-mcp/overview ; https://www.carbondesignsystem.com/getting-started/carbon-mcp/onboarding-and-setup ; https://www.carbondesignsystem.com/llms.txt
- Fluent **P**: `llms.txt` doc index for React v9 only; no MCP found — https://storybooks.fluentui.dev/react/llms.txt
- Spectrum **Y** (judgement): `@adobe/design-data-mcp` serves tokens and "component schemas listing variants, sizes, states, and boolean props"; `@react-spectrum/mcp` serves docs; `llms.txt` — https://opensource.adobe.com/spectrum-design-data/ai/ ; https://react-spectrum.adobe.com/ai
- Atlassian **P**: official ADS MCP (hosted + `@atlaskit/ads-mcp`) for tokens, icons, components, primitives, accessibility tooling; whether it exposes prop-level contracts is unverified — https://atlassian.design/llms.txt ; https://www.npmjs.com/package/@atlaskit/ads-mcp

### 11. Agent Skill / AI guidance
- Carbon **P**: MCP "Prompts" and "Token conservation" guidance pages; no skill found — https://www.carbondesignsystem.com/llms.txt
- Fluent **U**: repo has `AGENTS.md`/`CLAUDE.md`/`.github/skills`, but they are contributor-facing (rules for developing Fluent). No consumer skill found — https://github.com/microsoft/fluentui/blob/master/AGENTS.md
- Spectrum **Y**: `npx skills add https://react-spectrum.adobe.com`; `design-data` skill — https://react-spectrum.adobe.com/ai ; https://opensource.adobe.com/spectrum-design-data/ai/
- Atlassian **P**: skill exists but is "Atlassian only"; public llms.txt + MCP — https://atlassian.design/llms.txt

### 12. Deterministic validation
- Atlassian **Y**: `@atlaskit/eslint-plugin-design-system`, `@atlaskit/eslint-plugin-ui-styling-standard` — https://atlassian.design/llms.txt ; https://www.npmjs.com/package/@atlaskit/eslint-plugin-design-system
- Fluent **U**: `@fluentui/eslint-plugin-react-components` ("custom rules for Fluent UI components v9", MIT) exists but has no readme or docs; consumer scope unverified — https://www.npmjs.com/package/@fluentui/eslint-plugin-react-components
- Carbon **U**: `eslint-config-carbon` is a general lint config; design-system-usage validation not verified — https://www.npmjs.com/package/eslint-config-carbon
- Spectrum **U**: none found.

### 13. Accessibility guidance — Y ×4 (stated targets differ; show them as labels)
- Carbon: "IBM Accessibility Checklist… based on WCAG AA, Section 508, and European standards" — https://www.carbondesignsystem.com/building-blocks/foundations/accessibility
- Fluent: "components meet or surpass WCAG 2.1 AA" — https://fluent2.microsoft.design/accessibility
- Spectrum: React Aria tested with VoiceOver/JAWS/NVDA/TalkBack, follows ARIA APG; **does not claim WCAG conformance** — https://react-aria.adobe.com/quality (no design-level Spectrum accessibility page found)
- Atlassian: WCAG 2.1 AA guidance, ARIA, keyboard — https://atlassian.design/llms.txt

### 14. Documentation — Y ×4
https://www.carbondesignsystem.com · https://fluent2.microsoft.design and https://storybooks.fluentui.dev/react · https://spectrum.adobe.com and https://react-spectrum.adobe.com · https://atlassian.design

### 15. Open-source availability
- Carbon **Y**: Apache-2.0 — https://github.com/carbon-design-system/carbon
- Fluent **Y**: MIT — https://github.com/microsoft/fluentui
- Spectrum **Y**: Apache-2.0 — https://github.com/adobe/react-spectrum ; https://github.com/adobe/spectrum-design-data
- Atlassian **U**: npm packages declare Apache-2.0, but the repository field points at a Bitbucket "atlassian-frontend-mirror" whose page could not be read; source/contribution terms unverified — https://www.npmjs.com/package/@atlaskit/button

### 16. Maturity / ecosystem status — all U
First-publish dates are misleading (`@carbon/react` was created 2021-07-30 as the v11 rename; Carbon predates it). Spectrum's hub says its "React and Web Components" areas are "beta" (https://spectrum.adobe.com/). Needs an official release-phase or versioning statement per system (Atlassian has a "Release phases" page; not yet read).

## Ambiguous / unverified cells (needs a decision or manual check)

1. Row 7/9 Spectrum — does "Spectrum" include React Aria's registry?
2. Row 3 Spectrum and Atlassian — Figma availability (first-party page missing/blank).
3. Row 15 Atlassian — Bitbucket mirror terms.
4. Rows 5/6 — "Partial" is a rubric judgement; Fluent Material may merit "Yes".
5. Row 10 Spectrum "Yes" and Atlassian "Partial" are judgement calls.
6. Row 12 — non-equivalence to Guard; Fluent/Carbon lint packages unconfirmed as consumer-facing.
7. Rows 1 and 16 — no defensible like-for-like value yet.
8. Carbon MCP — the status ("public preview") appeared in a search summary but not on the official pages; access requires an IBMid.

## Skrewww claim audit (read-only; `lib/comparison.ts` and `app/compare/page.tsx` NOT edited)

| Where | Current wording | Evidence | Verdict | Recommended wording |
|---|---|---|---|---|
| Row 7 note + differentiator card | "Listed in the shadcn community registry directory" | Skrewww is in shadcn's `registries.json` (56 items) and shadcn-ui/ui#12059 merged 2026-09-30; Awesome shadcn/ui #626 merged 2026-10-16 | Both listings are real, but the wording conflates a registry index with endorsement-adjacent "directory" language | "Listed in the community-curated Awesome shadcn/ui directory." Optionally add separately: "Indexed in shadcn's registry directory." |
| Differentiator "Figma and React parity" | "Parity is audited per component, not claimed across the board" | Parity audit ran on **five pilot components** (Button, Text Input, Alert, Dialog, Chart Card); AG-2 not started (docs/architecture/agent-readiness.md, project-status) | **Stronger than evidence** | "Skrewww ships paired Figma libraries and a React implementation. A parity audit has been run on five pilot components; full parity is not claimed." |
| Section title "Where Skrewww's architecture differs" | implies differentiation | Research shows comparable capabilities elsewhere: MCP/skills (Spectrum, Atlassian), ESLint rules (Atlassian), Material (Fluent), shadcn registry (Adobe React Aria) | Overstated | "How Skrewww is built" |
| Row 12 Guard | status "Yes" | Guard has three consumer rules (Beta); Atlassian ships broader lint plugins | Possibly stronger than evidence in a like-for-like read | Label "Guard CLI (Beta, 3 consumer rules)" or use "Partial" |
| Row 8 npm | "@skrewww/react 0.1.0-beta.2 — Published as a beta release" | npm `beta` → 0.1.0-beta.2, but `latest` → 0.1.0-beta.1; version is read from the repo manifest | Accurate but fragile | "@skrewww/react (beta tag)" |
| Rows 5/6 | "Yes — 4 / 3 modes" | system-contract.ts; per-component support varies | Accurate; "Yes" is the strongest label while others get "Partial" for tokens | Label "4 selectable modes" / "3 selectable modes" |
| Row 16 | "Beta" | Matches package and Agent Kit stage | OK, but `siteConfig.designSystemVersion` is "1.0.0" | Check consistency of version messaging |
| Row 15 | "MIT-licensed repository" | LICENSE is MIT; repo is public; GitHub does not auto-detect the license (SPDX blank) | OK; minor | none |
| Rows 1–4, 9, 10, 11, 13, 14 | as written | Backed by registry, siteConfig, Agent Kit page, Skill at `/agent/skill/SKILL.md`, WCAG 2.2 AA "(target)" | OK | none |

Same "official shadcn community registry directory" phrasing also appears outside `/compare`:
`README.md` (lines 24, 203), `app/agent-kit/page.tsx:151`, `content/changelog.ts` (89, 91),
`docs/getting-started.md:423`, `docs/architecture/shadcn-distribution.md:569`, `docs/project-status.md:591-595`.
The listing is real; the word "official" is the risk. Not edited.

## Other facts verified today
- shadcn-ui/ui#12059 — MERGED 2026-09-30, https://github.com/shadcn-ui/ui/pull/12059
- birobirobiro/awesome-shadcn-ui#626 — MERGED 2026-10-16, https://github.com/birobirobiro/awesome-shadcn-ui/pull/626
- `@skrewww` entry in https://ui.shadcn.com/r/registries.json — present, status healthy, 56 items.

---

## Follow-up pass (2026-10-17): evidence validation and corrections

Method unchanged: official primary sources only, absence of evidence stays `Not yet verified`, never `No`.

### Ratings changed

| Cell | Was | Now | Evidence |
|---|---|---|---|
| Spectrum — Agent-readable contracts | Yes | **Partial** | The design-data MCP serves tokens, guidelines and component schemas (variants, sizes, states, boolean props), but the page states it "does not generate component code or plug into Spectrum Web Components or React Spectrum". The schemas are design-level, not React Spectrum's API. https://opensource.adobe.com/spectrum-design-data/ai/ ; https://www.npmjs.com/package/@adobe/design-data-mcp. `@react-spectrum/mcp` is documentation-only: https://react-spectrum.adobe.com/ai |
| Spectrum — Agent Skill | Yes | **Yes (kept, label tightened)** | A public `react-spectrum-s2` skill is served at https://react-spectrum.adobe.com/.well-known/skills/index.json and documented at https://react-spectrum.adobe.com/ai ("To install the React Spectrum skill, run `npx skills add https://react-spectrum.adobe.com`"). |
| Atlassian — Figma support | Not yet verified | **Yes** | "Anyone with a Figma account can use our public-access Figma Community libraries" — https://atlassian.design/get-started/design/figma-libraries/marketplace-partners |
| Atlassian — Open-source availability | Not yet verified | **Yes** | Public mirror "of Atlassian Frontend. All publicly published packages source files will be mirrored here daily" (Bitbucket API, `is_private: false`), LICENSE is Apache-2.0 — https://bitbucket.org/atlassian/atlassian-frontend-mirror ; https://www.npmjs.com/package/@atlaskit/button |
| Fluent 2 — Deterministic validation | Not yet verified | **Partial** | Official ESLint plugin for Fluent UI React Components with a documented setup; rules include `prefer-fluentui-v9` and `enforce-use-client` — https://github.com/microsoft/fluentui/tree/master/packages/react-components/eslint-plugin-react-components |

Competitor cells still unverified: 23 → **20**.

### Still unverified, with what was checked
- **Component coverage (×4) and Maturity (×4):** official indexes and release statements are not like-for-like with Skrewww's registry count or release stage. A first-publish date is not a maturity statement (`@carbon/react` dates from the 2021 v11 rename).
- **Spectrum — Figma:** the only first-party Figma mention found was the Component Options Editor plugin (schema authoring) in https://github.com/adobe/spectrum-design-data, not a design library. The `spectrum.adobe.com` resources and what's-new pages render no text for crawlers.
- **Carbon — Shape and Surface:** Carbon's foundations index lists 2x Grid, Accessibility, Carbon for AI, Color, Content, Icons, Motion, Pictograms, Spacing, Themes and Typography. No shape/radius or surface/elevation foundation page exists in the index. This is not a "No".
- **shadcn distribution and installability (Carbon, Fluent 2, Atlassian):** no first-party registry found; the shadcn directory entries `@fluent2-react-kit` ("not affiliated with Microsoft") and `@spectrumui` are independent. Absence is not a "No".
- **Fluent 2 — Agent Skill:** `AGENTS.md` and `.github/skills` in `microsoft/fluentui` are contributor-facing; Fluent's `llms.txt` has no AI or agent guidance.
- **Carbon and Spectrum — Deterministic validation:** no design-system-usage lint plugin found (`eslint-config-carbon` is a general config; `packages/` in both monorepos lists none).
- **Atlassian — Figma note:** the Atlassian page has separate tabs for Atlassians and Marketplace partners. The `/atlassians` tab renders no public text.

### Skrewww consistency corrections made in this pass
- Homepage pill: `1.0.0 — N React components` → `Docs v1.0.0 — N React components …`.
- `softwareVersion: 1.0.0` removed from the SoftwareApplication JSON-LD (the platform release is a docs-site identifier).
- llms index: `Design system version: 1.0.0` → `Documentation platform release: 1.0.0 (versioned separately …; @skrewww/react, Agent Kit and Guard are in beta)`.
- README: "individual entries remain Beta until promoted" removed (the registry has Stable and Beta entries); platform release re-labelled.
- `docs/architecture/versioning.md`: platform release defined as a docs-site identifier; the stale "`stable` reserved for future promotion" row corrected.
- `/compare` maturity row: `Beta` → `Beta packages; N of M components Stable` (derived), with the platform-release note.
- shadcn wording: "official shadcn community registry directory" → "indexed in the shadcn registry directory", the Awesome shadcn/ui list stated separately, neither an endorsement (README, Agent Kit page, changelog, getting-started, shadcn-distribution, project-status).
