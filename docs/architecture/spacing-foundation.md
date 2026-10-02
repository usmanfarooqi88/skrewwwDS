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

## Tabs anatomy audit (SP-3A, 2026-10-02) — evidence and recommendation, nothing changed

Read-only audit of the Figma `Navigation/Tabs` component set (same id in Pro and Free) and the React Tabs source.

**Figma anatomy (Pro and Free structurally identical).** 15 variants: State (Default, Hover, Selected, Focused,
Disabled) × Size (Small, Medium, Large); no Shape/Surface variants. Every variant is `Tab` → `Label` (text) +
`Indicator` (2px rectangle), vertical auto-layout, hug × hug, no min/fixed height, `itemSpacing` = 6 bound to
`spacing/6`. Vertical padding is `spacing/8` (Small, Medium) and `spacing/12` (Large); horizontal padding is
`spacing/12` (Small) and `spacing/16` (Medium, Large). The 6 is a **label-to-indicator gap** (it sits between Label
and Indicator inside one tab; it is not a tab-to-tab gap). There are no exceptions: all 15 variants carry the same
binding in both files.

**The indicator is in flow but hidden when unselected.** `Indicator.visible` is false in every non-Selected variant,
so it takes no space; in Selected it is visible. Consequence — selecting a tab changes its height:

| Size | Label | Unselected (no indicator) | Selected, gap 6 (current) | Selected, gap 4 | Selected, gap 8 |
|---|---|---|---|---|---|
| Small | 17 | 8+17+8 = **33** | 8+17+6+2+8 = **41** | 39 | 43 |
| Medium | 19 | 8+19+8 = **35** | 8+19+6+2+8 = **43** | 41 | 45 |
| Large | 22 | 12+22+12 = **46** | 12+22+6+2+12 = **54** | 52 | 56 |

Choosing 4, 6 or 8 only changes the jump (6, 8 or 10px); none removes it.
Selected is also Bold, so it is 3–4px wider than the other states.

**React anatomy.** `Tabs` → `TabsList` (`role=tablist`, `display:flex; gap: var(--tab-gap)` = 0.25rem between
triggers, `border-bottom:1px`) → `TabsTrigger` (`role=tab` button). The trigger has `min-height: var(--tab-height)`
(2.5rem = 40px), `padding: 0 var(--tab-padding-x)` (0.75rem), centers its label, and has a single size (no `size`
prop). The active indicator is `.triggerActive::after`: `position:absolute; bottom:0; left/right: padding-x;
height: var(--tab-indicator-thickness)` (2px) — **overlaid, not in flow**. Measured live: every trigger is 40px in
all states; the label-to-indicator distance falls out of centering (about 10px) and is not a token. `--tab-gap`
corresponds to nothing inside a Figma tab. No React value corresponds to the Figma 6.

**Visual comparison.** Figma tabs are 33/35/46px and become 41/43/54px when selected, with the label pinned to the
top padding; React tabs are a constant 40px with the underline anchored to the bottom edge of a full-width rule.
Selected/unselected stability is the visible difference: React is stable, Figma jumps 8px.

**Representative instances.** Pro: 15 instances, all in the frozen Presentation V2 "Matrix" frame (no auto-layout,
no nesting in other components). Free: 16 — 15 in the "Tabs V2 / State Matrix" frame (no auto-layout) and 1
Medium/Default in a hug "Tabs cell" frame in the Overview row. Medium/Default height is unaffected by any gap
choice, so the only affected Free doc content is the Selected cells of the matrices. No instance overrides.

**Accessibility.** The gap is visual spacing only. Hit area and focus outline follow the trigger box (unchanged by
the gap on unselected tabs); no accessibility requirement is invented or implied.

**Classification.** Not an intentional anatomical rule (no design reason for 6 specifically), not a historical value
with a documented rationale, and not React-derived. It is a **flow-construction artifact**: a spacer needed only
because the indicator is an in-flow child that toggles visibility, and that same construction causes the height jump.

| Option | Visual impact | Height impact | React parity | Grid compliance | Migration risk | Rationale |
|---|---|---|---|---|---|---|
| Keep 6 (RETAIN_AS_EXCEPTION) | none | selected +8 | none | off-grid, needs exception | none | no concrete anatomy reason to justify an exception |
| Use 4 | indicator 2px closer | selected +6 | none | on grid | low (≤15 variants/file) | tidies the number, keeps the height jump |
| Use 8 | indicator 2px farther | selected +10 | none | on grid, macro | low | tidies the number, worsens the height jump |
| Restructure indicator | removes the gap | selected = unselected | matches overlay model | no spacing token needed | medium (height/layout of 15 variants + doc cells) | fixes the cause and matches React |

**Recommendation: `RESTRUCTURE_TABS_ANATOMY`** (approved and implemented in SP-3B below). Keep the indicator out of flow (overlay anchored to the bottom, as
in React) or keep it always present with a transparent fill, so a tab's height no longer depends on selection and
the label-to-indicator `spacing/6` binding disappears. A separate human choice is needed at execution time: the
indicator model (absolute overlay vs always-present transparent) and whether Figma tab heights should align to
React's 40px. This audit changes nothing; it is not an approved decision and `docs/project-memory.md` is unchanged.

**Effect on `spacing/6` removal.** If Tabs is restructured, its 15 bindings per file go away and Tabs stops blocking
removal. Remaining categories: Small-control vertical padding (SP-3 Stage 2), Badge Small horizontal padding,
Validation Message gap, Tooltip vertical padding, and the public React tokens / equivalent CSS. `spacing/6` cannot be
deleted until all of those are resolved.

## SP-3 Stage 2 — Small-control height migration (completed 2026-10-02, Figma-only)

Authorised Figma write to the Pro and Free working files; React, `@skrewww/react`, `/r/*`, tokens and npm untouched;
**nothing published**. React authority (read from current source): Button, Text Input, Select, Search Field and
Combobox each use `min-height: var(--control-height-sm)` (2rem = 32px) with **zero vertical padding**; Split Button
has no `size` prop (it composes Buttons).

**Old model:** hug height = content line (17px) + `spacing/6` top + `spacing/6` bottom = 29px, so height was
an accident of an off-grid padding. **New model (existing variables only, no new variable):** `minHeight` bound to
`spacing/32`, `paddingTop`/`paddingBottom` bound to `spacing/0`, auto-layout cross-axis alignment unchanged
(`CENTER`), horizontal padding, content gaps and width behaviour unchanged. Result: Small = 32px, content centered
(Button label frame at y = 7.5 in a 32px box), matching React.

| Family | Pro | Free | Small variants changed (each file) | Before → after |
|---|---|---|---|---|
| Button (Small) | yes | yes | 15 | 29 → 32 |
| Text Input (Small) | yes | yes | 5 | 29 → 32 |
| Select (Small) | yes | yes | 5 | 29 → 32 |
| Search Field (Small) | yes | **not in Free** | 4 (Pro only) | 29 → 32 |

State heights are stable (every Small variant of a family reads 32 in Default, Hover, Pressed, Focused, Error and
Disabled); the Button Focus Ring is stretch-constrained and now reads 32px. Medium and Large were not touched
(Button 36/48, Text Input 35/46, Select 36/46, Search Field 36/46; React is 40/48 — a pre-existing difference
recorded for later). The Free Text Input differs from Pro in horizontal sizing only (hug / `MIN` vs fixed /
`SPACE_BETWEEN`); vertical anatomy was identical, so the vertical migration was applied; the horizontal difference is
pre-existing and was left alone.

**Not migrated:** Combobox (single-size Figma component, 32px derived from a 20px chevron + 2×6 with 16px text;
no Small mapping established — human decision needed), Split Button (no React Small; Main Action 29px vs Chevron
Trigger 28px), Tooltip, Badge, Validation Message, Tabs (still only the SP-3A recommendation), Icon Button, and
`spacing/2`.

**Verification.** Structural: every changed node reads `spacing/0` / `spacing/0` / `spacing/32` with
`minHeight` 32 and height 32; Shape and Surface modes do not touch vertical sizing (padding and `minHeight` bind to
the single-mode Primitive spacing scale), but the Shape/Surface modes were **not** toggled visually. Visual:
Pro Button/Text Input/Select/Search Field and Free Button/Text Input/Select screenshots — text, icons, chevrons and
focus/error borders centered, no clipping. Instances: Pro Button Small has 27 (15 in the frozen Presentation V2
"Matrix", absolutely positioned and growing 3px, plus 8 in hug vertical frames and 4 in slots), Text Input 9, Select 5,
Search Field 4; none clip or overflow. Free instances were not scanned, and the Free Actions and Navigation pages
were not re-read after the write (two reads were denied by the permission classifier), so those two Free counts below
are derived rather than re-measured.

**`spacing/6` master-level census.** Pro 119 → **61** (−58: Button 30, Text Input 10, Select 10, Search Field 8).
Free 77 → **27** (−50: Button 30, Text Input 10, Select 10). `spacing/2` unchanged (Pro 238). Remaining uses — Pro:
Tabs 15, Badge Small horizontal padding 12, Split Button 12, Combobox 10, Tooltip 8, Validation Message 4. Free:
Tabs 15, Badge 12. Plus the public React tokens / equivalent CSS. `spacing/6` still exists and cannot be deleted until
those are resolved.

## SP-3B — Tabs indicator anatomy (completed 2026-10-02, Figma-only)

Implements the approved result of the Tabs anatomy audit above. Authorised Figma write to the Pro and Free working
files; React, `@skrewww/react`, `/r/*`, tokens and npm untouched; **nothing published**.

**Before:** `Tab` (vertical auto-layout, hug) → `Label` + in-flow `Indicator` (2px), `itemSpacing` `spacing/6`;
selected tabs were 8px taller than unselected (Small 41/33, Medium 43/35, Large 54/46).

**Approved decision:** the active indicator is an out-of-flow overlay anchored to the bottom of the tab, so selection
cannot change tab size. Not approved and not done: collapsing the three Figma sizes into one, forcing React's 40px,
or changing typography or horizontal padding (React's single-size 40px model remains a separate parity decision).

**Implemented (all 15 variants in Pro and in Free — same set, same results):**
- `Indicator` set to absolute positioning (`layoutPositioning = ABSOLUTE`) in every variant, including the hidden
  ones, so all states share one anatomy; `Label` stays in normal flow.
- Constraints: horizontal `STRETCH` (left/right inset equal to the tab's horizontal padding — the same rule as React's
  `left/right: var(--tab-padding-x)`), vertical `MAX` (bottom). Indicator height stays 2px, `y = tab height − 2`.
  Resulting indicator width equals the label width in every variant, i.e. unchanged from before.
- `itemSpacing` rebound `spacing/6` → `spacing/0` (existing variable; no replacement 4 or 8 gap, no new variable).
  With one flow child it is inert. No fixed or min height was introduced.

**Heights, after (every state in a size is identical):** Small 33, Medium 35, Large 46 — equal to the previous
unselected heights. Selected tabs shrank 41→33, 43→35, 54→46; the label stays at its previous y in every variant.
Selected remains Bold (and therefore slightly wider); that was left as is.

**Verification.** Structural, per file: 15/15 variants, indicator absolute and 2px high, bottom-anchored in 15/15,
label in flow in 15/15, no Tabs variable binding on `spacing/6`. Visual (both files, Small/Medium/Large × Default,
Hover, Selected, Focused, Disabled): labels do not move, the selected underline sits at the bottom edge without
overlapping the label or clipping, focus and disabled treatments are unchanged. Instances: Pro 15, all in the frozen
Presentation V2 matrix; Free 16 (15 matrix + the Medium/Default "Tabs cell", which stays 408×103). No instance
overrides; every instance reads its variant's new height.

**`spacing/6` master-level census.** Navigation page measured 15 → 0 in both files; other pages were not
changed since the SP-3 Stage 2 measurements, so the totals are Pro 61 → **46** and Free 27 → **12**
(measured Navigation page plus unchanged earlier counts). `spacing/2` unchanged. Remaining uses — Pro: Badge Small
horizontal padding 12, Split Button 12, Combobox 10, Tooltip 8, Validation Message 4. Free: Badge Small 12. Plus the
public React tokens / equivalent CSS. `spacing/6` still exists.

## SP-3 Stage 3 — remaining `spacing/6` disposition audit (2026-10-03, read-only)

Audit and recommendations only: no Figma, React, token, package or `/r/*` change; nothing published. Figma counts
were re-measured live (Pro 46, Free 12).

**Fresh census (master level).** Pro 46: Badge Small horizontal padding 12 (6 variants × left/right), Split Button
12 (Small only: Main Action and Chevron Trigger top/bottom padding), Combobox 10 (top/bottom, 5 variants), Tooltip 8
(`Content` top/bottom, 4 variants), Validation Message 4 (icon-to-text `itemSpacing`). Free 12: Badge Small only.
Pages measured: Pro Actions, Forms, Feedback, Navigation, Containers (Content measured at Stage 2); Free all pages.

**Public exposure.** `@skrewww/react@0.1.0-beta.1` exports Button, Card, Dialog, FormField, Link, Spinner, TextInput,
ValidationMessage; its `styles.css` is the whole token sheet, so every 6px token is present as an inert custom
property, but only FormField and ValidationMessage consume a 6px value in published components. Everything else
below is exposed through `/r/*` (badge, split-button, combobox, tooltip, validation-message, form-field, breadcrumb,
tag, calendar-grid, menu, credit-card-field, phone-number-field, list-item, radio, select).

| Family | Current use | Pro | Free | React equivalent | Public exposure | Candidate | Risk | Decision |
|---|---|---:|---:|---|---|---|---|---|
| Badge Small | horizontal padding (pill inset) | 12 | 12 | `--badge-padding-x-sm` 6px (Figma = React; Md 8, Lg 10) | token in `styles.css`; `/r/badge`; not in package exports | keep 6 (4: −4px width, cramped pill; 8: = Medium inset, loses Small/Medium step) | low | RETAIN_AS_EXCEPTION |
| Split Button Small | segment vertical padding (height derivation) | 12 | — | no `size` prop, but it composes `Button` (`size="sm"` = `--control-height-sm` 32px) | `/r/split-button`; not in package | `minHeight` `spacing/32` + padding `spacing/0` on both Small segments → 32/32 | low | MIGRATE_FIGMA_ONLY |
| Combobox | vertical padding (height derivation) | 10 | — | `size` sm/md/lg = 32/40/48px, default md | `/r/combobox` | none until a mapping is chosen | medium | DEFER_FOR_PARITY_DECISION |
| Tooltip | `Content` vertical padding | 8 | — | `--tooltip-padding-y` 6px (Figma = React) | token; `/r/tooltip` | keep 6 (4: 25px tall, 8: 33px tall) | low | RETAIN_AS_EXCEPTION |
| Validation Message | icon-to-text gap | 4 | — | `gap: 0.375rem` in `validation-message.module.css` | **published beta package** + `/r/validation-message` | 4 (Link icon-gap precedent) or 8 (control icon gaps); needs a human pick | medium | MIGRATE_COORDINATED |

**Badge Small.** Figma Small is 18px high, label 12px Bold, padding `2/6`; Medium is `2/8`. React `sm` is 6px with an
11px label. 6px is about one third of the pill height; 4px shrinks Small by 4px (39 → 35 for a 27px label) and 8px
makes it identical to Medium's inset. Figma and React already agree, so a Figma-only change would create parity debt.

**Split Button.** The Figma component duplicates its anatomy (Main Action and Chevron Trigger are frames, not
`Button` instances) and is Pro-only. Segment heights are accidental: Small 29/28, Medium 35/36, Large 46/48, because
a 17px label and a 16px icon hug differently. React composes real Buttons inside `ButtonGroupContext`, so a Small
split button is two Button `sm` controls at 32px. Applying the Stage 2 model to the Small segments fixes the 29/28
mismatch and matches React; the `spacing/2` seam is untouched. Medium/Large already use compliant padding and are not
part of this decision. Instances were not scanned.

**Combobox.** Figma Combobox has no Size property and is 32px tall, but its type and icon are Select-Medium's
(16px / 20px chevron) with padding 6 (Select Medium: 8, 36px high; Select Small: 14px / 16px chevron, 32px).
So it matches neither React `sm` (14px text, 32px) nor `md` (default, 40px): a parity mismatch, not a Small control.
Smallest human decision: which size Combobox represents and whether it gains Select's Size variants.

**Tooltip.** Figma `Content` padding is `6/8` (height 29); React is `6/10` — Figma and React agree vertically and
differ horizontally (pre-existing). 6px is the compact-tooltip vertical padding (14px text): 4 gives 25px, 8 gives 33px.
A tooltip is a content container, not a Small control, so the Stage 2 height rule does not apply.

**Validation Message.** Figma gap 6, React gap 6, and both are in the published beta. Figma's Form Field Wrapper uses
`spacing/8` between label, control and helper while React `form-field.module.css` uses 6, so React is the off-grid
side there. Icon-to-text precedent: Link 4, Badge 4, Button/Select/Search 8; Alert and Toast use 12 for a different
anatomy. A coordinated change (Figma gap and React `gap`, plus `form-field` 6 → 8 to match the wrapper) needs the
number chosen first and a new beta release; do not change Figma alone.

**Other 6px values in React (no edit made).** `--breadcrumb-gap` (Figma Breadcrumb Item has no inter-item gap),
`--tag-gap` (Figma Tag gap is `spacing/4`, so React is off-grid), `--calendar-grid-week-gap` and `--menu-label-padding`
`6/10/4` (no Figma counterpart: Calendar Day and Menu Item only), `select.module.css` popup group label padding
`6/10/4`, `form-field`, `credit-card-field`, `phone-number-field` (gap and margin-bottom), `list-item` gap, `radio`
margin-top, and `banking-transaction-row` vertical padding. All are reachable through `/r/*`; only FormField and
ValidationMessage ship in the package. `--component-radius-control` and `--shape-radius-control` are 6px radii, a
different scale. Candidate replacements are 4 or 8 per component, each a visible public change.

**End-state forecast.** Pro 46 → Split Button −12 → 34 → Validation Message −4 → 30 (Badge 12, Tooltip 8,
Combobox 10); Combobox resolved later −10 → 20 (Badge 12, Tooltip 8). Free stays 12 (Badge). Badge and Tooltip block
removal of the Figma variable while retained. Figma-variable removal and React/CSS no longer using 6px are separate
milestones, and the second needs a coordinated public release.

**Should `spacing/6` ever be deleted?** Not recommended. Evidence favours end state 3: keep the variable as a
documented, scoped exception for anatomies where Figma and React both use 6 (Badge Small inset, Tooltip vertical
padding), and forbid new general use — the same shape as `spacing/2`. Migrate only the structural cases with a clear
defect or a compliant counterpart (Split Button Small, Combobox once mapped, Validation Message and Form Field).

**Next implementation slice:** Split Button Small — Figma-only, Pro-only height migration (same model as Stage 2).

## SP-3C — Split Button Small height migration (completed 2026-10-03, Figma-only, Pro-only)

Implements the Stage 3 disposition `MIGRATE_FIGMA_ONLY` for Split Button Small. Authorised Figma write to the Pro
working file only (Split Button does not exist in Free); React, `@skrewww/react`, `/r/*`, tokens and npm untouched;
**nothing published**.

**Before:** `Actions/Split Button` (9 variants: Style Primary/Secondary/Danger × Size Small/Medium/Large) is a
horizontal outer frame (hug, `spacing/2` seam gap) holding two hug frames, `Main Action` and `Chevron Trigger`. In the
three Small variants both segments had `spacing/6` top/bottom padding, so height was content-derived: Main Action 29
(17px label + 12) and Chevron Trigger 28 (16px icon + 12) — a 1px mismatch inside one control. React composes real
`Button` elements (`size="sm"`: `min-height` 32px, no vertical padding), and Figma Button Small was already on the
Stage 2 model.

**Changed (Small only, all 3 variants, both segments, 12 `spacing/6` bindings):** `paddingTop` and `paddingBottom`
`spacing/6` → `spacing/0`, `minHeight` → `spacing/32` (existing variables, no new variable). Cross-axis alignment was
already `CENTER`, so no alignment change was needed; horizontal padding, gaps, typography, icon sizes and the
`spacing/2` seam were not touched. **After:** Main Action 32, Chevron Trigger 32, outer 92×32 in every Small variant;
the label sits at y 7.5 and the chevron at y 8 inside the 32px segments (centered).

**Not changed (separate Split Button height audit):** Medium (Main Action 35, Chevron Trigger 36, outer 36) and Large
(Main Action 46, Chevron Trigger 48, outer 48) keep their content-derived heights and compliant padding (`spacing/8`
and `spacing/12`); the same 1–2px segment mismatch exists there and was deliberately left alone.

**Verification.** Structural: 3/3 Small variants, 6/6 segments read `spacing/0` / `spacing/0` / `spacing/32` with
minHeight 32; every `spacing/2` seam still reads 2 (`spacing/2`); Medium/Large unchanged. Visual: all nine variants
screenshotted — Small label and chevron centered, divider continuous, no clipping, no state or colour change.
Instances: 16 exist (3 Small in the Matrix frame, no clipping — the lowest cell bottom is 199.5 of 222; Medium/Large
instances unchanged at 36/48). Shape and Surface modes were **not** toggled visually; the existing Shape-panel
instances are Medium and are unaffected, and the change touches only vertical padding and `minHeight`.

**`spacing/6` census (Pro, master level).** Actions page measured 12 → 0. Pro total 46 → **34** (Actions measured; other
pages unchanged since the Stage 3 measurement): Badge Small 12, Combobox 10, Tooltip 8, Validation Message 4. Free
unchanged at 12 (Badge). `spacing/2` unchanged. `spacing/6` still exists.

## SP-3D — Validation Message and Form Field coordinated migration (2026-10-03)

Coordinated Figma + React change (Stage 3 disposition `MIGRATE_COORDINATED`). **Nothing is published:** the npm
package, `/r/*` consumers and both Figma libraries only change at a later, deliberate release.

**Decision (two different values, on purpose):**
- **Validation Message icon-to-text gap: 6 → 4px.** Icon and message are one tightly coupled inline unit, so it
  uses the micro rhythm (`spacing/4`; same family as Link and Badge icon gaps).
- **Form Field vertical gap between label, control and supporting/error text: 6 → 8px.** It is structural
  composition and Figma's Form Field Wrapper already uses `spacing/8`.
These are anatomy decisions, not "all icon/text gaps are 4" or "all form gaps are 8".

**Figma (Pro only — neither component exists in Free).** `Forms/Validation Message`: 4 variants (Error, Warning,
Success, Info), `itemSpacing` `spacing/6` → `spacing/4` (existing variable); each variant is now 158px wide
(was 160), 17px high, icon and text alignment unchanged, 4 Matrix instances intact. `Forms/Form Field Wrapper`:
re-verified already `spacing/8` (Label Row `spacing/4`), so no Figma change. Pro master-level `spacing/6`: 34 → **30**
(Forms page measured: Combobox 10 only; Actions, Navigation, Containers and Content measured 0; Feedback unchanged from
Stage 3 at Badge 12 + Tooltip 8). Free unchanged at 12 (Badge). `spacing/6` still exists.

**React (canonical source; the only edits).** `components/ui/validation-message.module.css` `.message`
`gap: 0.375rem` → `0.25rem`; `components/ui/form-field.module.css` `.field` `gap: 0.375rem` → `0.5rem`. The other
declarations in those files (`.icon` `margin-top`, `.required` `margin-left`, typography, colours) are different
relationships and were left alone. Two focused style-contract tests were added in the existing
`ValidationMessage.test.tsx` and `FormField.test.tsx`.

**Distribution.** Both components flow from the same canonical CSS into the docs build, the `/r/*` manifests
(generated output, gitignored; regenerated manifests now carry `0.25rem` and `0.5rem`) and the `@skrewww/react`
package build (the rebuilt local `dist/styles.css` carries `.validation_message_message` 0.25rem and
`.form_field_field` 0.5rem). `@skrewww/react@0.1.0-beta.1` on npm is unchanged (`beta` and `latest` still point to it),
so package users only receive this in the next release (expected `0.1.0-beta.2`, prepared separately); no version
bump, tag or release was made here.

**Remaining public 6px values (not touched):** `--badge-padding-x-sm` and `--tooltip-padding-y` (retained
exceptions), `--breadcrumb-gap`, `--tag-gap`, `--calendar-grid-week-gap`, `--menu-label-padding`, `select` popup group
label padding, `credit-card-field` and `phone-number-field` gap and margin-bottom, `list-item` gap, `radio`
margin-top, and `banking-transaction-row` padding. The 6px radii are a different scale.

**Pending release tracks:** (1) React package `@skrewww/react@0.1.0-beta.2`; (2) the accumulated SP-3 Figma changes in
the Pro and Free working files, which remain unpublished until a synchronized release that should also assess
Gumroad and Figma Community.

## SP-3E — Combobox size/parity decision (2026-10-03, read-only)

Audit and recommendation only: no Figma, React, token, registry, package or `/r/*` change; nothing published.

**Figma Combobox (Pro only; not in Free).** `Forms/Combobox`: 5 variants, axis State only (Default, Hover, Focused,
Error, Disabled) — it has **no Size property**. Hug × hug, horizontal auto-layout, height 32 (chevron 20 + `spacing/6`
top and bottom), padding `6/12/6/8` (left `spacing/12`, right `spacing/8`), gap `spacing/8`, label 16px/19 line,
chevron 20px, radius `component/radius/control`; fills, strokes and effects are variable-bound (Shape and Surface
panels use it). 10 `spacing/6` bindings (5 variants × top/bottom).

| Attribute | Combobox | Select Small | Select Medium | Select Large |
|---|---|---|---|---|
| Height | 32 | 32 (`minHeight` `spacing/32`) | 36 | 46 |
| Vertical padding | `spacing/6` | `spacing/0` | `spacing/8` | `spacing/12` |
| Horizontal padding | 12 / 8 | 12 / 12 | 12 / 12 | 16 / 16 |
| Label size / line | 16 / 19 | 14 / 17 | 16 / 19 | 18 / 22 |
| Chevron | 20 | 16 | 20 | 20 |
| Gap | `spacing/8` | `spacing/8` | `spacing/8` | `spacing/8` |

**Reading.** Combobox's type and chevron are exactly Select **Medium**'s; only the vertical padding was cut from 8
to 6 so the control lands on 32. Text Input follows the same S/M/L family (32 / 35 / 46; 14 / 16 / 18px). So it is a
Medium-anatomy control squeezed to a Small height, not a Small control and not a separate size model.

**React.** `ComboboxSize = "sm" | "md" | "lg"`, default `md`, public API. The input reuses `text-input.module.css`:
`min-height` 32 / 40 / 48px with zero vertical padding, font 14 / 14 / 16px, caret `CaretDown` 16px at every size.
Select uses the same classes. Registry: `status` beta, `supportedSizes` `sm md lg`, `figmaReference` "State (5
variants)", yet `content/forms.ts` still describes "State × Size — 15 variants (Figma)", which Figma does not have —
the documented intent was a size axis and the Figma component is incomplete, not a deliberate single size.

**Exposure.** `/r/combobox` and the generated Agent contract exist; the component is **not** in the
`@skrewww/react@0.1.0-beta.1` pilot (8 components, no Combobox). Interaction: native `<input role="combobox">`,
decorative non-interactive caret, no clear button, focus ring on the input; the size choice is a visual-density
question, not a hit-target one.

**Usage.** 14 Pro instances, all in the Combobox documentation section (Shape panels, Surface panels, state row, one
open example), fixed-size parents, 4 with overrides; nothing composes it into a layout where 32px was chosen for
compactness.

**Is the `spacing/6` legitimate?** No: it is a temporary height derivation (chevron 20 + 12 = 32), not anatomy. The
exact 32px could be drawn with `minHeight` `spacing/32` + padding `spacing/0`, but that would freeze a 16/20px anatomy
into a Small box that React and Select Small do not use (14/16), so it is not recommended on its own.

| Option | Figma consistency | React parity | `spacing/6` | Visual change | API impact | Risk |
|---|---|---|---|---|---|---|
| Keep as Small | needs type 14/17 and chevron 16 (Select Small) | matches `sm` only | removed | text and icon shrink | none | medium — redesign, not a spacing fix |
| Keep as Medium | matches Select Medium anatomy | React `md` is 40, Figma Medium 36 | removed | 32 → 36 | none | medium — hardens a single size against a documented size prop |
| Add sizes | mirrors Select / Text Input exactly | gains `sm md lg`, inherits the family's own parity | removed | default size changes height | none | medium — 5 → 15 variants, same as Select |
| Defer to broader parity | unchanged | unchanged | stays | none | none | low, but leaves temporary debt |

**Decision: `ADD_SIZE_VARIANTS`**, mirroring the existing Figma Select / Text Input dimensions 1:1 (no new
dimensions). The wider question — whether Figma Medium/Large (36 / 46) should eventually match React 40 / 48 — is
separate and not solved here; because Combobox would copy Select's anatomy, whatever that decision becomes applies to
both together, so this does not harden the wrong architecture. The 10 bindings are **not** an approved exception; they
are temporary debt until the migration below.

**Smallest future scope (SP-3F, Figma-only, Pro-only):** add a Size axis (Small / Medium / Large × the 5 states = 15
variants) copying Select's vertical and horizontal padding, type and chevron per size (Small: `minHeight`
`spacing/32` + padding `spacing/0`, 14/17, chevron 16; Medium: `spacing/8`, 16/19, chevron 20; Large: `spacing/12`,
18/22, chevron 20; horizontal 12 / 12 / 16 / 16 — the current right padding 8 becomes Select's). One decision remains
for implementation: which size existing documentation instances keep — Medium (React default, +4px, parents are fixed
frames and need a check) or Small (keeps 32px). Expected result: Pro `spacing/6` 30 → 20 (Badge 12 + Tooltip 8). No
React, registry, package or `/r/*` change is needed (React already has the sizes); `content/forms.ts` "15 variants" then
becomes true.

**Spacing-track closure.** After SP-3F the justified `spacing/6` uses are Badge Small and Tooltip only, so SP-3 is
architecturally complete; until then Combobox is acknowledged temporary debt. The broader Figma-vs-React Medium/Large
control height parity is a different architecture track.

**Release impact.** Combobox is not in the npm package, so it does **not** block `@skrewww/react@0.1.0-beta.2`.
It is in the Pro file only, so it does not touch the Free file or the Figma Community listing; it does not block the
Figma spacing release or a Gumroad update (it ships unchanged, still single-size), but the `content/forms.ts` "15
variants (Figma)" wording is already inaccurate for any release.

## SP-3F — Combobox Size variants and SP-3 closure (completed 2026-10-03, Figma-only, Pro-only)

Implements the SP-3E decision `ADD_SIZE_VARIANTS`. Authorised Figma write to the Pro working file; Combobox does not
exist in Free. React, the registry API (`supportedSizes` already `sm md lg`), `/r/*` and `@skrewww/react` untouched;
**nothing published.**

**Before:** `Forms/Combobox`, 5 variants (State only), 32px, padding `6/12/6/8` with `spacing/6` top and bottom,
16px/19 label, 20px chevron — Select-Medium anatomy squeezed into a 32px box. 10 `spacing/6` bindings.

**After:** 15 variants, State (Default, Hover, Focused, Error, Disabled) × Size, built in the same component set (the
existing 5 masters were renamed to `Size=Medium`, so existing instances keep their identity and resolve to Medium;
Small and Large are clones). Each size copies the live Select anatomy; no new dimension or variable:

| Size | Height | Vertical padding | Horizontal padding | Label | Chevron |
|---|---|---|---|---|---|
| Small | 32 | `spacing/0` + `minHeight` `spacing/32` | `spacing/12` | 14 / 17 | 16 (`semantic/icon-size/sm`) |
| Medium | 36 | `spacing/8` | `spacing/12` | 16 / 19 | 20 (`semantic/icon-size/md`) |
| Large | 46 | `spacing/12` | `spacing/16` | 18 / 22 | 20 (`semantic/icon-size/md`) |

The old right padding `spacing/8` became Select's `spacing/12`; gap stays `spacing/8`; fills, strokes, effects, radius
and state treatments were not touched. Heights are identical across the five states of a size. Cloning dropped the
`Value` text-property link on the 10 new variants; it was re-linked, and all 15 now expose the same properties
(`Value`, `State`, `Size`). The Size options list in the property schema reads Medium, Small, Large (Figma kept the
original order); this is cosmetic and not changed.

**Instances.** 14 instances resolve to Medium (161×36 instead of 157×32); 6 of them carry overrides — five Shape
panels keep their explicit Shape mode, and the open example had width/height overrides. Documentation fixes, all local:
the component set is now 186px high, so the documentation column below it (Options set and label, Listbox Panel
component and label, reference label, open example) moved down 154px and the Combobox section grew from 922 to
1076; in the open example the trigger is back to hug (180×36) and that example's panel was widened 176 → 180 so
"Search countries" does not wrap; in the three Surface panels (Flat, Gradient, Glass) the popup moved down 4px to keep
its 2px gap under the taller trigger. No other frame was changed.

**Verification.** Structural: 15/15 variants carry the table above, 0 `spacing/6` bindings in Combobox. Visual: the full
set (3 sizes × 5 states), the Control state row, the five Shape panels (Sharp, Rounded, Pill, Squircle, Brand Shape),
the Flat / Gradient / Glass Surface panels and the open example all render correctly with no clipping. Shape and
Surface were verified through those existing mode panels, not by toggling a new instance.

**`spacing/6` census (Pro, master level).** Forms 10 → 0 and Feedback measured Badge 12 + Tooltip 8, with Actions,
Navigation, Containers and Content at 0 from earlier measurements: Pro 30 → **20**. Free unchanged at 12 (Badge; not
re-read in this task). `spacing/2` unchanged. `spacing/6` still exists.

**Registry wording.** The only stale source line, `figmaReference` "Forms / Combobox — State (5 variants)", now reads
"State × Size (15 variants)"; `content/forms.ts` already said 15 variants and is now accurate. No API field changed.

**SP-3 closure.** The Figma spacing migration is architecturally complete: the only remaining `spacing/6` uses are the
two approved scoped exceptions, Badge Small horizontal inset and Tooltip vertical padding. Not solved here: the wider
Figma-versus-React Medium/Large control height gap (Figma 36 / 46 against React 40 / 48 for Select, Text Input and
Combobox), the remaining React 6px values (breadcrumb, tag, calendar, menu and others), and the Split Button
Medium/Large segment mismatch — separate work. Pending releases: `@skrewww/react@0.1.0-beta.2` and the synchronized
Pro/Free Figma publication (plus Gumroad and Community assessment); none was executed.

## Status

Both exceptions remain in the Primitive scale in Pro and Free. SP-2 itself changed nothing; SP-3 Stage 1 moved
the 45 Button/Link gap bindings per file described above; SP-3 Stage 2 moved the Small-control vertical padding
described above (Pro 58, Free 50 bindings); SP-3B restructured the Tabs indicator and removed the Tabs `spacing/6`
bindings (15 per file); SP-3C moved the Split Button Small vertical padding (12 Pro bindings); SP-3D changed Validation Message (Figma + React) and Form Field (React), and nothing else.
