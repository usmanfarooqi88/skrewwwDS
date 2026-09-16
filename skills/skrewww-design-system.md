---
name: skrewww-design-system
description: >
  Use when creating, reviewing, or refining product interfaces with the
  Skrewww Design System in Figma Design or Figma Make. Prefer real Skrewww
  components and semantic variables; respect Shape and Surface architecture;
  compose application UI from primitives; run design-level accessibility
  checks; do not invent unsupported Skrewww components, properties, or tokens.
---

# Skrewww Design System

Teach the Figma Agent and Figma Make how to build, audit, and refine UI with
**Skrewww** — an AI-first design system meant to be used consistently by
designers, developers, and agents.

This skill is self-contained. Do not require local repository files, scripts,
or private docs at runtime. Optional public references for humans:

- https://skrewww.com
- https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free
- https://github.com/usmanfarooqi88/skrewwwDS

## When to use

Invoke for Skrewww work in **Figma Design** or **Figma Make** when the user
asks to:

- create or extend a screen, flow, state, or product page (**Build**)
- review consistency, tokens, components, or accessibility intent (**Audit**)
- improve alignment without redesigning the product (**Refine**)

## Modes

Choose one mode from the request. You may switch modes only when the user
asks.

### Mode A — Build

Create or extend UI with real Skrewww assets when available.

### Mode B — Audit

Inspect first. Report findings. Fix only what the user asked to fix.

### Mode C — Refine

Improve hierarchy, component usage, states, and token consistency on an
existing Skrewww-based design without changing product intent.

## Hard rules

1. **Inspect before editing.** Never create UI until you know what Skrewww
   assets exist in the current file/context.
2. **No invented components.** If a Skrewww component exists, use it. Do not
   draw a lookalike. Do not invent names, properties, variants, or states.
3. **No invented tokens.** Prefer existing Skrewww semantic variables. Do not
   rename, restructure, or invent variable architecture unless the user
   explicitly asks.
4. **One foundation — no style forks.** Do not create parallel libraries such
   as “Button / Pill” or “Button / Glass” as unrelated components. Appearance
   comes from the same semantic component plus supported properties,
   variables, Shape, and Surface.
5. **Composition ≠ design-system component.** Application patterns are built
   from primitives unless the user explicitly asks to create a new DS
   component.
6. **Do not detach** Skrewww instances to chase a visual tweak. Report the
   limitation. Detach only if the user explicitly accepts the tradeoff.
7. **Do not flatten editable UI into images.**
8. **Preserve human authority.** Suggest and compose; do not silently redefine
   Skrewww foundations or resolve ambiguous design decisions without asking.
9. **Stop on unknown.** If something is unconfirmed, say so. Do not hallucinate.

## Step 0 — Inspect context

Before any create/edit:

1. Detect whether **Skrewww components** are available (library, local
   components, published assets, Make-accessible assets).
2. Detect whether **Skrewww variables/tokens** are available.
3. Inspect nearby established usage for naming, Shape, Surface, spacing, and
   density.
4. Identify the product workflow (settings, data table, form, overlay, etc.).
5. Confirm the mode: Build / Audit / Refine.

### If Skrewww is not available

Do **not** silently recreate a fake Skrewww system.

Tell the user clearly that the canonical Skrewww library/context is missing.

Then offer only:

- **A.** Connect/open/use the Skrewww Figma library or file, or
- **B.** If the user explicitly wants a concept anyway, create a clearly
  labeled **Skrewww-inspired draft** and state that it is **not** using
  canonical Skrewww components/variables.

In Figma Make, never claim a real library component was used unless it
actually was. Prefer: “Skrewww-inspired composition” vs “actual Skrewww
component.”

## Architecture to respect

Skrewww layers (conceptual):

1. **Foundation** — color, type, spacing, elevation, motion, accessibility intent
2. **Components** — Actions, Forms, Navigation, Feedback, Containers & Overlays, Content & Data
3. **Style systems** — Shape and Surface applied through tokens/properties, not forks
4. **Industry** — optional industry patterns built on the same foundation

Visual styles are **not** separate component libraries.

## Shape

Canonical Shape concepts:

- Sharp
- Rounded
- Pill
- Squircle

Rules:

- Shape is systematic — do not hand-fake Shape per instance when the system
  provides Shape properties/variables.
- **Not every component supports every Shape.** Inspect the actual component
  before applying Shape.
- If Shape support is uncertain, do not invent it. Report the gap.

## Surface

Canonical Surface concepts:

- Flat
- Gradient
- Glass

Rules:

- Surface is layered onto semantic components — not a reason to fork
  components.
- **Not every component supports every Surface.** Example: basic Table is
  commonly Flat-only in Skrewww; do not force Glass/Gradient onto Flat-only
  surfaces.
- Prefer existing Skrewww surface treatments over arbitrary blur/effect
  approximations of Glass.
- If Surface support is uncertain, inspect or stop — do not invent support.

## Tokens / variables

Prefer Skrewww semantic variables for:

- color / semantic roles
- typography
- radius / Shape where represented
- surfaces
- states
- spacing where represented

Avoid one-off raw values when an appropriate Skrewww token exists.

Do **not** claim every numeric property must be tokenized.

Do **not** invent tokens or casually rename collections.

## Component vs composition

### Design-system components

Use real Skrewww components when present. Representative families (inspect the
file for what is actually available — do not treat this as an exhaustive live
inventory):

- **Actions:** Button, Button Group, Link, Split Button, Toggle Group
- **Forms:** Form Field, Text Input, Textarea, Checkbox, Radio / Radio Group,
  Switch, Select, Combobox, Search Field, Date Picker, Number Input, Slider,
  File Upload, Validation Message, and other form primitives present in the
  file
- **Overlays / containers:** Dialog, Drawer, Popover, Menu, Card, Accordion,
  Tooltip
- **Feedback:** Alert, Badge, Toast, Skeleton, Spinner, Progress Bar
- **Navigation:** Tabs, Breadcrumb, Pagination, Stepper, Menu
- **Content & data:** Table / Data Table patterns, Tag, List Item, Avatar,
  Empty State, charts/timeline/tree where present

### Application compositions (not automatic DS components)

Build from primitives unless the current library already ships them as
components:

- App Shell / product chrome
- Advanced Filters
- Notification Center
- Feature-specific forms and page headers
- Searchable Command Palette (do **not** claim a canonical searchable Command
  Palette exists; Menu/Popover primitives may exist — searchable palette
  semantics remain unresolved)
- Searchable Multi Select (prefer Checkbox + Tag composition unless a real
  Multi Select component is present in the file)

If a request seems to need a missing primitive:

1. Check whether an existing component solves it
2. Check whether composition is sufficient
3. Name the gap
4. Tell the user a DS addition may be required

Do **not** invent a new canonical Skrewww component unless the user
explicitly asks.

## Build workflow

1. Complete **Step 0 — Inspect context**.
2. State briefly what you found and intend to use.
3. Compose with Auto Layout, clear hierarchy, and component **instances**.
4. Bind semantic variables where available.
5. Apply Shape/Surface only when the target component supports them.
6. Use realistic product content (not “Lorem ipsum / Item 1 / Card title”)
   unless the user asks for placeholders.
7. For forms: keep label → control → helper/error hierarchy; use Form Field /
   Validation Message patterns when available; show requested states
   realistically.
8. For overlays: use Dialog / Drawer / Menu / Popover / Select / Combobox /
   Date Picker primitives when available. Consider trigger relationship, close
   affordance, stacking, and mobile reachability. Do not invent unsupported
   nested overlay patterns.
9. After work, summarize: what changed, which Skrewww systems were used, any
   unresolved DS gaps, any design-level a11y issues needing human review.

## Audit workflow

Inspect the selected frame/page for:

1. Skrewww instance usage vs detached/rebuilt lookalikes
2. Inconsistent variants/properties
3. Raw colors/type where semantic variables exist
4. Inconsistent Shape usage
5. Inconsistent Surface usage
6. Spacing/layout drift
7. State inconsistencies (hover/focus/disabled/error/selected)
8. Design-level accessibility concerns

Return findings in three groups only:

- **FIX NOW** — clear, safe consistency/accessibility-intent issues
- **REVIEW** — judgment calls needing human decision
- **INFORMATION** — notes, limits, non-blocking observations

Do not invent numerical scores.

In Audit mode, do **not** silently redesign foundations or restyle the whole
product unless asked.

## Refine workflow

Improve alignment with existing Skrewww usage nearby:

- replace lookalikes with real instances when available
- bind variables instead of raw values when tokens exist
- normalize Shape/Surface only within confirmed support
- tighten hierarchy and spacing without changing product meaning

Preserve the user’s design intent.

## Accessibility (design-level)

Skrewww targets a **WCAG 2.2 AA** baseline as design intent.

When designing or reviewing, check:

- visible labels and accessible names
- meaningful control text
- state communication beyond color alone
- focus and disabled appearance
- contrast intent
- target sizes
- error messaging and form relationships
- keyboard-friendly interaction intent for overlays/menus

**Critical limit:** Figma cannot prove runtime accessibility. Phrase results as
**design-level checks**, never as certified WCAG compliance.

## Figma structure quality

Prefer:

- Auto Layout where structurally appropriate
- sensible frame hierarchy
- reusable components and instances
- variables over arbitrary styling when available
- clear layer names where useful
- resizing behavior appropriate to the layout

Avoid:

- detached clones for convenience
- absolute positioning for ordinary product UI
- inventing unsupported Figma features

## Communication style

**Before work:** 2–4 short lines — what you found, mode, intended assets.

**After work:** short summary —

- created/changed
- Skrewww components / Shape / Surface / tokens used
- unresolved gaps
- human review needed

Do not dump long design-system essays unless the user asks.

## Anti-hallucination checklist

Before finishing, verify you did **not**:

- claim a component that was not found in context
- claim every component supports every Shape or Surface
- claim runtime WCAG compliance from Figma alone
- claim Make used a real library component when it did not
- invent tokens, properties, variants, or nested overlay patterns
- detach components without explicit user approval
- depend on private local repo files
- redefine Skrewww architecture silently
