# Combobox Figma parity

Last updated: 2026-07-13

## Figma source

- **File:** [Skrewww — Design System](https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365)
- **Starting node:** `2002:2365`
- **Component-set node ID:** `2024:2480` — **"Forms/Combobox"**, in section `2024:2501`. Confirmed via Figma MCP on 2026-07-13 (see `lib/combobox-figma-metadata.ts`).
- **State property variants (confirmed):** Default, Hover, Focused, Error, Disabled
- **Component properties (confirmed):** `Value` (TEXT, default `"Select options"`), `Multi-select` (BOOLEAN, default `false`)

## MCP connection result

**Resolved 2026-07-13.** The prior timeout was caused by a competing Desktop Bridge instance on port 9224; with that resolved, the Figma MCP check succeeded against the live file. The trigger control's variants, properties, and Default-variant token bindings below are now confirmed directly from Figma, not carried over from the original task brief.

This pass **only** confirms the five closed-trigger states. It does **not** confirm the open/expanded option-list anatomy — see **Option anatomy** below. Do not read "MCP succeeded" as covering the listbox panel.

## Parity table

| Area | Figma | React | Status | Action |
|---|---|---|---|---|
| Canonical name | Combobox (Forms) | `Combobox` | Matched | Keep slug `combobox` |
| Component-set node | Confirmed — `2024:2480` ("Forms/Combobox", section `2024:2501`) | Metadata stores `2024:2480` | Matched | — |
| Single-select | Confirmed (`Value` TEXT property, default `"Select options"`) | `value` + hidden input | Matched | — |
| Multi-select chips | Confirmed (`Multi-select` BOOLEAN property) — Figma's own description flags a known limitation, see **Multi-select known limitation** below | Not implemented | Deferred | Future batch — plan around the Figma-side Value-text limitation, not just the chips UI |
| Editable input | Implied hybrid Select/search | Native `<input type="text">` | Matched | — |
| Filter while typing | Implied | `prefix` / `substring` local filter | React extension | Document filter modes |
| Free-form values | Not confirmed | Blur reverts unmatched text | React extension | Document blur policy |
| State variants | Confirmed — Default, Hover, Focused, Error, Disabled | default, error, disabled via FormField; hover/focus via shared Text Input `:hover`/`:focus-visible` rules | Matched (mechanism); exact token values not yet diffed | Diff each Figma state's token values against `text-input.module.css` |
| Size variants | Referenced in content | sm / md / lg via Text Input tokens | Temporary | Verify Figma size set |
| Required | Likely in Form Field composition | `required` + `setCustomValidity` on visible input | Matched | — |
| Error | State variant | FormField `error` + `aria-invalid` | Matched | — |
| Disabled | State variant | Native `disabled` | Matched | — |
| Focus ring | Design tokens | `--semantic-focus-ring` on active option | Temporary | Verify Figma variable |
| Open state | Prototype / list visible | Popover listbox | Matched | — |
| Selected state | Value text + option highlight | `aria-selected` + selected surface token | Temporary | Verify selected indicator in Figma |
| Active option | Unresolved | `aria-activedescendant` + active surface | React extension | ARIA editable combobox pattern |
| No-results row | Unresolved | Non-option row, visually hidden from AT on row itself | Matched | Status region announces |
| No-results announcement | Unresolved | Polite `role="status"` region | React extension | See announcement policy |
| Clear control | **Confirmed absent** — no "clear all" control anywhere in the trigger anatomy; chips use `Icon/XCircle` for per-chip removal only | Not implemented | Deferred | No longer a Figma gap to "confirm" — it's confirmed not to exist; a clear-all control would be a net-new design addition, not a parity fix |
| Leading field icon | Unresolved | CaretDown only (decorative) | Temporary | MCP audit |
| Option leading icon | **Confirmed no Figma reference** — no open/expanded frame exists (see **Option anatomy**) | Label text only | React-first | Do not invent from this pass — needs a Figma reference frame first |
| Option description | **Confirmed no Figma reference** — no open/expanded frame exists (see **Option anatomy**) | Not implemented | React-first | Do not invent from this pass — needs a Figma reference frame first |
| Selected indicator (in list) | **Confirmed no Figma reference** — no open/expanded frame exists (see **Option anatomy**) | Font-weight + selected surface | React-first | Do not invent from this pass — needs a Figma reference frame first |
| Popup width | **Confirmed no Figma reference** (see **Option anatomy**) | `matchTriggerWidth` (min = field width) | React-first | Needs a Figma reference frame first |
| Popup max height | **Confirmed no Figma reference** (see **Option anatomy**) | `--combobox-popup-max-height` | React-first | Needs a Figma reference frame first |
| Option height / padding | **Confirmed no Figma reference** (see **Option anatomy**) | `--combobox-option-*` tokens | React-first | Needs a Figma reference frame first |
| Field height / padding | Text Input component; trigger's own cornerRadius/padding/fill/stroke/itemSpacing confirmed bound to Figma variables 2026-07-13 (no hardcoded values) — see `lib/combobox-figma-metadata.ts` | Reuses Text Input module | Alias | Map specific variable IDs to React token aliases in a follow-up pass |
| Popup offset | Popover tokens | `--popover-offset` via Popover | Alias | — |
| Elevation | Unresolved | `--combobox-popup-elevation` → Popover | Alias | — |
| Border radius | `component/radius/control`; trigger's `cornerRadius` confirmed bound to `VariableID:2012:9573` | Shared control radius | Alias | Confirm this is the same variable as `component/radius/control` |
| Motion | Unresolved | Popover open without extra combobox motion | Temporary | MCP audit |
| Async / remote search | Not in scope | Not implemented | Deferred | — |
| Fuzzy search | Not in scope | Not implemented | Deferred | — |

## No-results announcement policy

1. A visually hidden `role="status"` region with `aria-live="polite"` and `aria-atomic="true"` is associated with the combobox input through `aria-describedby` while the listbox is open.
2. Announce **once** when the listbox opens: either `"No results found."` or `"N results available."`
3. Announce when filtered results **transition to empty** while open.
4. Announce when results **return after being empty** while open.
5. Do **not** announce on every intermediate count change while typing.
6. Stay silent when the listbox is closed or the field is disabled.
7. The visual no-results row remains `aria-hidden="true"` and is **not** `role="option"`.
8. FormField validation messages remain separate — the status region does not duplicate error text.

## Blur and exact-match policy

- **Unmatched text:** Reverts to the last committed option label (closed-list policy).
- **Exact label match:** Case-insensitive, trimmed, locale-aware lowercase comparison.
- **Unique match required:** Duplicate labels never commit on blur.
- **Disabled options:** Never commit on blur.
- **Pointer selection:** `mousedown` prevents input blur race; deferred blur reconcile skips while selection is pending.

## Filtering policy

- Modes: `prefix` (default), `substring`
- Query trimmed for comparison only; visible input preserves user spacing
- Case: `toLocaleLowerCase()` on query and labels
- Diacritics: **not normalized** — documented limitation
- Source array never mutated; order preserved
- Filtering alone never commits a value

## Multi-select known limitation

**Source: Figma's own component description** (confirmed 2026-07-13, not a code defect). Enabling the `Multi-select` boolean property shows the Chips row but does **not** automatically hide the plain `Value` text underneath it — Figma's boolean-property model requires a manual instance override to hide the Value text when Multi-select is on. This is a constraint of how the Figma component itself is built, not a gap in the React implementation to "fix." Any future Multi-select build in React needs to replicate the *intended* result (Chips row replacing the Value text) rather than mirroring Figma's raw default-toggle behavior, and design should be aware the Figma component needs the same manual override applied per instance.

## Clear action

**Confirmed absent (2026-07-13).** There is no "clear all" control anywhere in the Combobox trigger anatomy. The only removal affordance is per-chip, using `Icon/XCircle` on each chip in the Multi-select anatomy. A clear-all control is not a parity gap to close — it doesn't exist in Figma today — so building one would be a new design addition, not a fix to match an existing spec.

## Option anatomy

**Confirmed gap (2026-07-13) — not merely deferred.** No open/expanded example frame exists anywhere in the Figma file showing option-list/listbox anatomy: no option icons, no option descriptions, no selected-indicator treatment, no clear-all control. Figma specifies only the five closed-trigger states (Default, Hover, Focused, Error, Disabled) documented above — it never specifies the dropdown panel's contents.

React's current option-list behavior (label text only, `aria-selected` + selected-surface token, no icons/descriptions) is therefore **React-first with Figma parity pending**, not Figma-confirmed. Do not infer or invent option-list anatomy from the Figma file as it stands — there is nothing there to infer from. A Figma reference frame for the open state needs to exist before this row of the parity table can move past "React-first."

## Pointer active-option sync

- Pointer hover/move over enabled options updates `aria-activedescendant`.
- DOM focus remains in the input.
- One animation frame after open before pointer sync activates (avoids stationary-pointer false activation).
- Keyboard arrow navigation sets keyboard modality; pointer move clears it.
- Hover does not commit selection.

## PopoverAnchor

Public export for composition (Combobox positioning). Not a registry component. Combobox owns `aria-controls` and listbox semantics.

## Token verification summary

| Token | Classification |
|---|---|
| `--combobox-icon` | Alias → `--semantic-icon-muted` |
| `--combobox-popup-surface` | Alias → `--popover-surface` |
| `--combobox-popup-border` | Alias → `--popover-border` |
| `--combobox-popup-elevation` | Alias → `--popover-elevation` |
| `--combobox-popup-radius` | Alias → `--popover-radius` |
| `--combobox-popup-padding` | Temporary implementation |
| `--combobox-popup-max-height` | Temporary implementation |
| `--combobox-option-height` | Temporary implementation |
| `--combobox-option-padding` | Temporary implementation |
| `--combobox-option-radius` | Alias → `--shape-radius-control` |
| `--combobox-option-text` | Alias → `--semantic-text-primary` |
| `--combobox-option-active-surface` | Alias → `--semantic-surface-elevated` |
| `--combobox-option-selected-surface` | Alias → `--semantic-surface-subtle` |
| `--combobox-option-disabled-text` | Alias → `--semantic-text-disabled` |
| `--combobox-empty-*` | Temporary implementation |
| Field chrome | Alias → Text Input tokens |

## React-only extensions

- `filterMode` prop
- `inputValue` / `open` controlled dimensions
- Polite filter status region
- Pointer hover active sync with keyboard modality guard
- `PopoverAnchor` positioning shell

## Recommended next batch

1. Ask design for a Figma reference frame covering the open/expanded option-list anatomy — nothing further can be confirmed there without one
2. Diff each confirmed State variant's (Default/Hover/Focused/Error/Disabled) token values against `text-input.module.css` and map the trigger's confirmed variable IDs (`lib/combobox-figma-metadata.ts`) to their React token aliases
3. Diacritic-normalized filtering (if confirmed)
4. If Multi-select is built: replicate the *intended* Chips-replaces-Value-text result, not Figma's raw toggle default (see **Multi-select known limitation**)
