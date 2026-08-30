# Combobox Figma parity

Last updated: 2026-08-30

## Figma source

- **File:** [Skrewww — Design System](https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365)
- **Starting node:** `2002:2365`
- **Component-set node ID:** `2024:2480` — **"Forms/Combobox"**, in section `2024:2501`. Confirmed via Figma MCP on 2026-07-13 (see `lib/combobox-figma-metadata.ts`).
- **State property variants (confirmed):** Default, Hover, Focused, Error, Disabled
- **Component properties (confirmed):** `Value` (TEXT, default `"Select options"`)
- **`Multi-select` (BOOLEAN) property removed 2026-07-15** — see **Multi-select removed** below; it no longer exists on the component set.

## MCP connection result

**Resolved 2026-07-13.** The prior timeout was caused by a competing Desktop Bridge instance on port 9224; with that resolved, the Figma MCP check succeeded against the live file. The trigger control's variants, properties, and Default-variant token bindings below are confirmed directly from Figma, not carried over from the original task brief.

The 2026-07-13 pass confirmed only the five closed-trigger states — it did not confirm the open/expanded option-list anatomy, because no such reference frame existed yet. **That changed 2026-07-15**: a new demo frame now shows the listbox panel directly — see **Option anatomy** below, which supersedes the prior "not specified" finding.

## Parity table

| Area | Figma | React | Status | Action |
|---|---|---|---|---|
| Canonical name | Combobox (Forms) | `Combobox` | Matched | Keep slug `combobox` |
| Component-set node | Confirmed — `2024:2480` ("Forms/Combobox", section `2024:2501`) | Metadata stores `2024:2480` | Matched | — |
| Single-select | Confirmed (`Value` TEXT property, default `"Select options"`) | `value` + hidden input | Matched | — |
| Multi-select chips | **Removed 2026-07-15** — the boolean property and Chips frame were deleted from all 5 state variants; see **Multi-select removed** below | Not implemented | Matched (both sides now single-select only) | None — no corresponding code capability ever existed; the Figma property was documenting a capability that was never built |
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
| Clear control | **Confirmed absent** — no "clear all" control anywhere in the trigger anatomy. (Chips/`Icon/XCircle` no longer apply — Multi-select was removed 2026-07-15, see below) | Not implemented | Deferred | No longer a Figma gap to "confirm" — it's confirmed not to exist; a clear-all control would be a net-new design addition, not a parity fix |
| Leading field icon | Unresolved | CaretDown only (decorative) | Temporary | MCP audit |
| Option leading icon | **Confirmed absent from Figma** — the open-example reference frame (`2113:2`, see **Option anatomy**) shows label-text-only rows, no icon | Label text only | Matched | — |
| Option description | **Confirmed absent from Figma** — the open-example reference frame shows no description slot (see **Option anatomy**) | Not implemented | Matched | — |
| Selected indicator (in list) | Option master `2740:554` / Selected `2740:550` — `component/menu/item-hover` + Gradient overlay + Medium 500; no checkmark | `aria-selected` + `--combobox-option-selected-surface` → `--menu-item-hover-surface` + overlay + font-weight 500 | Matched | Closed 2026-08-30 — see **Selected-surface token mapping** |
| Popup width | Reference frame (`2113:2`) now exists, but exact popup width/sizing was not itemized in this pass | `matchTriggerWidth` (min = field width) | React-first (dimension undiffed) | Diff exact popup width against the reference frame in a follow-up pass |
| Popup max height | Reference frame now exists, but exact max-height was not itemized in this pass | `--combobox-popup-max-height` | React-first (dimension undiffed) | Diff against the reference frame in a follow-up pass |
| Option height / padding | Reference frame now exists, but exact row height/padding was not itemized in this pass | `--combobox-option-*` tokens | React-first (dimension undiffed) | Diff against the reference frame in a follow-up pass |
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

## Multi-select removed

**Removed 2026-07-15 (corrects the 2026-07-13 "known limitation" finding below).** The `Multi-select` boolean property and its Chips frame (with hardcoded example chips) were deleted from all 5 state variants in Figma. Confirmed: no multi-select/chip capability exists anywhere in `Combobox.tsx` (single string `value`, no array, no `multiple` prop) — the Figma property was documenting a capability that was never built in React. The registry already correctly describes Combobox as single-select; this brings Figma in line with that, rather than the other way around.

This is no longer "a known limitation to design around" — there is nothing left to design around. The property, the Chips row, and the auto-hide-Value-text quirk it used to have are all gone from Figma. If Multi-select is ever built in React in the future, it will need a fresh Figma spec — the removed variant is not a reference to revive.

## Clear action

**Confirmed absent (2026-07-13, unchanged 2026-07-15).** There is no "clear all" control anywhere in the Combobox trigger anatomy. (The prior per-chip `Icon/XCircle` removal affordance no longer applies — Multi-select and its chips were removed, see **Multi-select removed** above.) A clear-all control is not a parity gap to close — it doesn't exist in Figma today — so building one would be a new design addition, not a fix to match an existing spec.

## Option anatomy

**Confirmed present (2026-07-15) — corrects the 2026-07-13 "confirmed gap" finding below.** A new demo frame, **"Combobox (example — open)"** (node `2113:2`), now shows the listbox panel directly: a trigger (Focused state) plus a listbox panel (node `2113:10`) containing 5 option rows (nodes `2113:1149`, `2113:1151`, `2113:1153`, `2113:1155`, `2113:1157`) demonstrating default / active-hover / selected / default / disabled states.

Confirmed against this reference frame:

- **Anatomy is genuinely minimal** — plain label text only, no icon, no description — matching `ComboboxOption`'s real type (`{ value, label, disabled? }`) exactly. No invention needed; React already matches.
- **State styling matches `combobox.module.css`'s real CSS exactly**: `.option` (transparent background, `semantic/text/primary`), `.optionActive` (`semantic/surface/elevated` background + 2px inset outline using `semantic/focus-ring`), `.optionSelected` (font-weight 500 — background token has no Figma equivalent, see **Selected-surface token gap**), `.optionDisabled` (`semantic/text/disabled`).
- **No clear-all control** appears in the listbox panel either — consistent with **Clear action** above.

Historical note (2026-07-13): this section previously read "no open/expanded example frame exists anywhere in the Figma file... do not infer or invent option-list anatomy from the Figma file as it stands." That was accurate at the time — the reference frame above did not yet exist. It has since been added, and the facts in this section reflect the current state.

## Selected-surface token mapping

**Closed 2026-08-30.** Figma option master `2740:554` uses `component/menu/item-hover` (`VariableID:2142:210`) for Hover, Active, and Selected. React `--combobox-option-selected-surface` and `--combobox-option-active-surface` now alias `--menu-item-hover-surface` (Flat/Gradient `#F7F7F8`, Glass white @ 20%). Selected keeps the shared Gradient overlay and Medium 500. Active keeps `semantic/focus-ring`. `semantic/surface/subtle` was not added to Figma. Historical gap note: `COMBOBOX_FIGMA_SELECTED_SURFACE_TOKEN_GAP`.

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
| `--combobox-option-active-surface` | Alias → `--menu-item-hover-surface` (Figma `component/menu/item-hover`) |
| `--combobox-option-selected-surface` | Alias → `--menu-item-hover-surface` — same row-highlight contract; Selected adds overlay + 500 |
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

1. Diff the option-list reference frame's (`2113:2`) exact popup width, max-height, and option height/padding against the current Temporary token values
2. Diff each confirmed State variant's (Default/Hover/Focused/Error/Disabled) token values against `text-input.module.css` and map the trigger's confirmed variable IDs (`lib/combobox-figma-metadata.ts`) to their React token aliases
3. Diacritic-normalized filtering (if confirmed)
