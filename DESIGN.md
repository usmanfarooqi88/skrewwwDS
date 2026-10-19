---
version: alpha
name: Skrewww
description: Public design values derived from canonical Skrewww sources; do not edit directly.
colors:
  primary: "{colors.primitive-color-brand-500}"
  primitive-color-brand-500: "#6c4cf2"
  primitive-color-brand-600: "#5638d6"
  primitive-color-brand-700: "#4229ad"
  primitive-color-danger-100: "#fde2e1"
  primitive-color-danger-500: "#e5484d"
  primitive-color-danger-600: "#cc3b37"
  primitive-color-danger-700: "#b3261e"
  primitive-color-warning-100: "#fef3d6"
  primitive-color-warning-500: "#f5a524"
  primitive-color-warning-700: "#b9770e"
  primitive-color-warning-800: "#8a4f00"
  primitive-color-success-700: "#1f7a4d"
  primitive-color-info-700: "#1d4ed8"
  primitive-color-neutral-0: "#ffffff"
  primitive-color-neutral-50: "#f7f7f8"
  primitive-color-neutral-100: "#ededf0"
  primitive-color-neutral-200: "#dfe0e4"
  primitive-color-neutral-300: "#c5c6cc"
  primitive-color-neutral-400: "#a0a3ac"
  primitive-color-neutral-500: "#71737c"
  primitive-color-neutral-600: "#5b5f68"
  primitive-color-neutral-900: "#17181b"
rounded:
  radius-full: 9999px
omitted:
  - section: typography
    reason: No single composite typography scale is exported here; component typography and host fonts have separate authorities.
  - section: spacing
    reason: React has no primitive spacing custom-property scale; preserve the documented spacing policy instead of inventing aliases.
  - section: components
    reason: Component styling depends on context and state; use canonical components and Agent Kit contracts rather than flattened style recipes.
---

## Overview

Derived from canonical Skrewww sources; do not edit directly. The exported YAML
tokens are normative values for DESIGN.md consumers. Canonical authoring remains
in Skrewww's existing token, registry, and Figma sources; make design changes
there, then refresh this projection and review its prose.

This is an exact, deliberately partial public projection. Primitive keys preserve
CSS custom-property names without the leading `--`; `primary` projects the
existing `--semantic-action-primary` alias. Omitted groups are not permission to
invent values. Use the canonical runtime CSS and components when implementing
Skrewww rather than replacing them with a flattened export.

Authority: [source-of-truth rules](docs/architecture/source-of-truth.md),
[token policy](docs/architecture/token-source-of-truth.md),
[runtime tokens](styles/tokens.css), and each component's implementation and
registry-derived Agent Kit contract. Figma remains authoritative for approved
Figma design behavior; this file makes no new Figma parity claims.

Only public repository values are projected. Paid Figma Pro source/assets and
Gumroad deliverables are excluded. The public code license does not grant rights
to the Skrewww brand or define the Free Figma file's license; see
[licensing boundaries](docs/licensing.md).

## Colors

All explicitly VERIFIED public primitive colors in `styles/tokens.css` are
projected literally: Brand, Danger, Warning, Success, Info, and Neutral. Sparse
families stay sparse. TEMPORARY, UNRESOLVED, EXPERIMENTAL, and inferred values
are excluded. Light/Dark semantic values are not flattened into global colors.
Prefer the existing semantic or component CSS custom property over a raw
primitive. For example,
`--semantic-action-primary` aliases `--primitive-color-brand-500`.
Do not synthesize missing palette steps or turn the documentation shell's
Tailwind palette into public component tokens.

## Typography

The documentation shell loads Inter and JetBrains Mono in `app/layout.tsx`, with
font stacks in `tailwind.config.ts`. Public component typography comes from each
component's CSS and component-tier tokens; Button inherits its host font family.
No shell heading scale or universal composite typography tokens are asserted here.

## Layout

Use the [canonical spacing policy](docs/architecture/spacing-foundation.md):
a 4px base grid with an 8px-preferred macro rhythm. Prefer an existing
`spacing/<n>` token, then a valid grid value, then a documented exception.
Do not select `spacing/2` or `spacing/6` for new layouts. React expresses spacing
through component tokens and literals, not `--primitive-spacing-*` aliases.

## Elevation & Depth

Surface is ambient context, not a universal component prop. Flat, Gradient, and
Glass are implemented in `styles/tokens.css`; check each component's contract
before assuming support. Do not flatten contextual fills, gradients, blur, or
foregrounds into one global style. Shadow primitives marked temporary are not
promoted to approved design values in this projection.

## Shapes

Shape is document-wide or parent context for applicable components. Sharp,
Rounded, Pill, and Squircle are defined in `styles/tokens.css`; fixed-radius
components are not automatically Shape-capable. The exported `radius-full`
is the existing fixed-radius token, not a replacement for contextual Shape
tokens. Do not approximate Squircle with a border radius or infer one universal
control radius.

## Components

Use canonical public components and their actual APIs, not recreated raw-element
lookalikes. The registry (`lib/component-registry.ts` and its category files)
owns implementation status and component contracts; authored `content/*.ts`
owns usage guidance. Consult Agent Kit's system policy, compiled component
contracts, and recipes for composition rather than deriving APIs from this file.

Button uses a native button for actions and link semantics with `href` for a
prominent navigational CTA. Use Link for inline or lower-emphasis navigation.
Text Input is for single-line form values; Textarea is for multi-line content;
Search Field is for search/filter inputs. These distinctions come from
`content/actions.ts` and `content/forms.ts`.

## Do's and Don'ts

- Preserve existing semantic HTML, accessible names, focus, and keyboard behavior.
- Never rely on color alone to convey state.
- Do not invent component props, unsupported modes, token values, or parity claims.
- Motion is component-specific in CSS/tokens; no global duration or easing scale
  is implied here. Preserve the relevant implementation's reduced-motion behavior.
- Maintain this as a derived projection with reviewed prose. Run
  `npm test -- lib/design-md.test.ts` after canonical changes. Value-specific
  tests check the complete verified primitive color set, primary alias, fixed
  radius, and selected guidance facts. Refresh from canonical sources when those
  checks fail; do not change canonical values to match this file. Google alpha
  lint checks format. Prose still requires review when its source guidance changes.
