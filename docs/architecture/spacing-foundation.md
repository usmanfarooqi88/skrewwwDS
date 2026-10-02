# Spacing foundation

> **Skrewww uses a 4px base spacing grid with an 8px-preferred macro rhythm.**

Decision date 2026-10-02. This is the canonical statement of the spacing standard and of
the status of the two Primitive values that sit off the 4px grid. It is a policy document:
it changes no token. Skrewww is **not** described as a strict 8pt system.

## The standard

| Level | Rule | Typical values (px) | Use for |
|---|---|---|---|
| **Micro / component** | 4px increments where component-level precision is needed | 4, 8, 12, 16, 20, 24, 28, 32 | component padding, icon/text gaps, control internals, compact layouts, fine alignment |
| **Macro / layout** | prefer 8px multiples where practical | 16, 24, 32, 40, 48, 64, 80, 96 | section spacing, card groups, page margins, large layout gaps, major content rhythm |

**Token priority** (for people, AI and agents): (1) an existing Skrewww `spacing/<n>` token;
(2) a valid 4px-grid value where no token exists; (3) an arbitrary value only with a documented
exception. Do not create one-off spacing tokens for isolated tweaks.

## Scale separation

- The **Primitive** spacing scale lives in Figma (Pro and Free carry the identical 16 variables):
  `spacing/0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`. It is the token source of
  truth for spacing; the grid above is the rule for *choosing* values.
- **React does not define `--primitive-spacing-*` custom properties.** Component CSS and
  `styles/tokens.css` express spacing as `rem` literals and component-tier tokens
  (`--control-gap`, `--badge-padding-x-sm`, `--control-height-sm`, …) with `spacing/<n>` named only in
  comments. Figma names and React values therefore line up by value, not by alias.
- Layout/grid margins (`grid-margin/*`) are separate Primitive variables, not part of this scale.

## Off-grid values: `spacing/2` and `spacing/6`

Only these two Primitive values do not follow the 4px grid. **Status: documented legacy
exceptions — retained for now, no token changed.**

- `spacing/2` is allowed only to reproduce an existing anatomy: a joined-segment seam (Button
  Group, Split Button, Toggle Group), an inset such as the Switch thumb offset, a badge's vertical
  padding, or a micro text gap. It must not be chosen for new layout spacing.
- `spacing/6` is **deprecated for new use**: it appears as height-derived vertical padding on Small
  controls and as an inline gap. New work uses `spacing/4` or `spacing/8`. Existing uses stay until
  a controlled migration (see below).
- AI/agents: never select either for new layouts; use them only when matching an existing
  component's recorded anatomy.

## SP-2 audit (2026-10-02) — evidence, no migration

**Method.** Repository: tracked-file search for `2px`, `6px`, `0.125rem`, `0.375rem`, `spacing/2`,
`spacing/6`, each hit classified by CSS property. Figma: read-only Desktop Bridge reads of both files
(variable definitions, aliases, node bindings across every page, and a raw-value census). Generated
surfaces measured from a fresh build. Figma bindings can be counted per node property; they are not
proof of visual intent, and unbound raw values are only counted.

**Figma (Pro and Free).**

- Both variables exist in Primitive with the same IDs and values in both files, no description, scopes
  `[]` (as the API returns them). **No Semantic or Component variable aliases either one** — there
  are no alias chains.
- Pro component masters: 238 bound node-properties use `spacing/2` and 164 use `spacing/6` (about 28%
  of all bound spacing properties in masters). Free uses the same bindings on its subset of masters.
- Masters bound to **spacing/2**: Link (padding on all sides, every size), Switch (track left/right inset),
  Badge (vertical padding, Small and Medium), Button Group and Split Button (joined seam), List Item (text gap).
- Masters bound to **spacing/6**: Button Small (vertical padding and content gap), Text Input, Select,
  Search Field and Combobox (vertical padding), Split Button Small (padding), Tabs (label-to-indicator gap, all sizes), Badge
  Small (horizontal padding), Validation Message (gap), Tooltip (vertical padding), Link M/L (content gap).
- Pro-only masters: Button Group, Split Button, Validation Message, Search Field, Combobox, Tooltip. All
  other bindings are identical in Free. The remaining bindings are documentation/presentation frames
  (Presentation V2 is frozen and was not touched).

**React / generated surfaces.**

| | `spacing/2` (2px) | `spacing/6` (6px) |
|---|---|---|
| Equivalent declarations in component/token CSS | 20 (8 padding/gap, 12 margin/offset) in 15 files | 17 (14 padding/gap, 3 margin/offset) in 10 files |
| Defined as component tokens in `styles/tokens.css` | `--control-switch-thumb-offset`, `--badge-padding-y-sm`, `--menu-item-gap`, `--calendar-grid-day-gap` | `--badge-padding-x-sm`, `--tooltip-padding-y`, `--breadcrumb-gap`, `--tag-gap`, `--calendar-grid-week-gap`, `--menu-label-padding` (partly) |
| `@skrewww/react` public `styles.css` | **PUBLIC_CONTRACT** (public custom properties above, plus pilot CSS) | **PUBLIC_CONTRACT** (same; pilot `form-field`/`validation-message` use 6) |
| shadcn `/r/*` | **PUBLIC_CONTRACT** — 15 manifests carry one or both values (Foundation + 14 components) | same manifests |
| Agent contracts, Make guidelines, Guard facts | NOT_EXPOSED (no value or token name) | NOT_EXPOSED |
| Docs shell (Tailwind `0.5` / `1.5` utilities, 66 uses) | INTERNAL_ONLY | INTERNAL_ONLY |

**Not spacing — do not migrate under this policy.** Of 129 CSS hits for these literals, 57 are 2px focus
outlines/offsets and 15 are borders/strokes/box-shadow rings; 9 are radii; the rest include stroke
widths (tab indicator, line chart, timeline), a 2px checkmark height and a 2px tooltip entrance
translation. None of these is a spacing token use.

### Classification

| Usage | Class |
|---|---|
| Small control vertical padding 6 (Figma); React uses `--control-height-sm: 2rem` with no vertical padding | STRUCTURAL_SPACING (height-derived; note Figma Button Small is 29px tall — 17px line + 2×6 — against React's 32px, an existing height difference) |
| Inline/label/icon gaps of 6 (Form Field, Validation Message, Link, Button, tags, calendar) | STRUCTURAL_SPACING |
| Tabs: the 6 between a tab's label and its indicator (vertical layout inside each tab) | **UNRESOLVED anatomy case** — not tab-to-tab spacing; see "Corrections" |
| Badge padding 2 / 6; Tooltip padding 6; List Item gap 2; Menu/Tree/Calendar gaps 2 | STRUCTURAL_SPACING |
| Switch thumb inset 2; required-asterisk offset 2; icon/checkbox/radio `margin-top` 2; Link padding 2 | OPTICAL_ALIGNMENT |
| Button/Split/Toggle Group seam 2 | BORDER_OR_STROKE (a seam, not layout rhythm) |
| Focus outlines, borders, rings, radii, stroke widths | BORDER_OR_STROKE / not spacing |
| Checkmark height 2px | ICON_GEOMETRY |
| None found as unused | LEGACY_UNUSED: no |

### Replacement assessment (nothing changed)

- **2 → 0 or 4.** For a seam, 0 removes the divider and 4 doubles it; for badge padding 4 adds 4px to
  Small/Medium height; for the Switch inset it changes the thumb travel (a public token). No compliant
  value preserves the anatomy.
- **6 → 4 or 8.** Not interchangeable. Two Figma-only 6s already differed from compliant React values: Button
  content gap (Figma Small 6, React `--control-gap` 8) and Link content gap (Figma M/L 6, React `--link-icon-gap` 4).
  Aligning Figma to React there improves parity (done in SP-3 Stage 1). The Small control vertical padding is
  different: 6→4/8 changes Small control height unless the control is rebuilt height-driven (fixed min-height,
  centered content), which is what React already does.
- Touch targets: control heights are the touch-target driver; any change must preserve the intended Small height.

### Decisions

| Token | Decision | Reason |
|---|---|---|
| `spacing/2` | **RETAIN_AS_EXCEPTION** | Used for seams, insets and micro gaps that have no compliant equivalent; ~20 React declarations, four public tokens, 15 shadcn manifests, 238 Figma bindings. Scope it (above) rather than migrate. Link's 2px padding exists only in Figma; confirm intent separately. |
| `spacing/6` | **DEPRECATE** (no new uses; staged migration later) | Real structural use, but compliant replacements exist for the gaps and React already differs from Figma in several; the Small-control padding needs a height-driven rebuild. |

### Proposed migration order (not executed)

1. Policy and guidance first: this document, then Agent/Make guidance so new work never picks either value.
2. **Done in SP-3 Stage 1:** Figma-only gaps where React is already compliant — Button Small content gap → 8 and
   Link M/L content gap → 4 (Pro and Free). No React or package change. (Tabs was removed from this stage; see below.)
3. Small-control vertical padding (Button, Text Input, Select, Search Field, Combobox, Split Button, Tooltip):
   rebuild height-driven in Figma to match React. Needs a visual check at every Small variant.
4. Public React tokens that equal 6 (`--badge-padding-x-sm`, `--tooltip-padding-y`, `--breadcrumb-gap`,
   `--tag-gap`, `--calendar-grid-week-gap`, form-field and validation-message gaps): a visible change that
   ships in `@skrewww/react` and `/r/*`; decide per component, release as a coordinated minor/major.
5. Only after zero uses remain, remove the variable from both Figma files (a separate Free/Pro/Gumroad release).

### Scale observations (no change proposed)

- **`spacing/28` has no real use**: no 28px in component CSS and no 28 in Figma master padding/gaps.
- Raw on-grid values with no token: **36** (5 CSS uses, text-input/select/combobox/textarea leading-icon
  inset) and **44** (1). Figma masters also contain unbound raw 4/8/12/16 values that *do* have tokens.
- Off-grid values other than 2/6 exist and are outside SP-2: **10px** (17 uses), 14 (2), 18 (1), 1 and 3
  (mostly border-width compensation), and Figma raw 7 and 10. Evaluate in a later, separate audit.
- Values bound in Pro component masters: 2, 4, 6, 8, 12, 16, 24 and 32. `spacing/20` and 40–128 are not bound in
  masters (they may serve layout/documentation frames or macro layout); redundancy was not evaluated and no
  removal is proposed.

## Corrections to SP-2 (found during SP-3 Stage 1, 2026-10-02)

- **Tabs.** SP-2 treated the Figma Tabs gap of 6 as comparable to React's `--tab-gap` (4px). Live Figma shows the
  6 is the vertical gap between a tab's label and its indicator (each tab is a vertical layout of `Label` + a 2px
  `Indicator`, 15 variants in Pro and in Free). React's `--tab-gap` is the spacing *between* tab triggers, and
  React has no label-to-indicator gap (the indicator is positioned from the trigger). There is no React counterpart,
  so changing it would **not** be a parity fix, and it would shrink every tab by 2px. Tabs is therefore a
  **separate unresolved spacing/anatomy case** that needs its own audit before any migration. It is not assumed to
  be a height-derived control case.
- **Small control height.** SP-2 said Small controls derive 32px from a 20px line plus 2×6. Figma Button Small is
  29px (17px line + 2×6); React's `--control-height-sm` is 32px. That height difference pre-dates the spacing
  work and is recorded for Stage 2.

## SP-3 Stage 1 — Figma-only parity migration (completed 2026-10-02)

Changed in **both** Pro and Free (the same component sets and variants exist in both; node IDs are identical),
rebinding the existing `Content` auto-layout gap to existing variables — no new variable, no raw values:

| Family | Variants changed (each file) | Before | After | React authority |
|---|---|---|---|---|
| Button — Small (Primary/Secondary/Danger × 5 states) | 15 | gap `spacing/6` (6) | `spacing/8` (8) | `.content { gap: var(--control-gap) }` = 0.5rem, all sizes |
| Link — Medium (Primary/Secondary/Danger × 5 states) | 15 | gap `spacing/6` (6) | `spacing/4` (4) | `--link-icon-gap` = 0.25rem |
| Link — Large | 15 | gap `spacing/6` (6) | `spacing/4` (4) | `--link-icon-gap` = 0.25rem |

Link Small already used `spacing/4`, so all three Link sizes now agree. Button Small now matches Medium and Large
(8). Verified after the change, in both files: every changed node reads the new variable; component heights are
unchanged (Button Small is 95×29, previously 93×29 — only the width of the visible icon+label content grows);
Link outer padding (`spacing/2`), all vertical padding, Tabs and every other `spacing/6` binding are untouched.
Master-level `spacing/6` bindings fell by exactly 45 per file (Pro 164 → 119, Free 122 → 77); `spacing/2` is
unchanged (Pro 238, Free 222). `spacing/6` still exists and still has other uses. React, `@skrewww/react` and
`/r/*` were not touched. The Figma libraries were **not published**; the changes live in the working files only.
Instance-level overrides in documentation frames were not scanned.

Remaining `spacing/6` uses: Small-control vertical padding (Button, Text Input, Select, Search Field, Combobox,
Split Button, Tooltip), Tabs label-to-indicator gap, Badge Small horizontal padding, Validation Message gap, and the
public React tokens listed above. Next: SP-3 Stage 2 (height-driven Small-control rebuild), plus a separate Tabs audit.

## Status

Both exceptions remain in the Primitive scale in Pro and Free. SP-2 itself changed nothing; SP-3 Stage 1 moved
the 45 Button/Link gap bindings per file described above and nothing else.
