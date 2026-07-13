# Calendar foundation

Architecture note for the Calendar implementation batch shipped 2026-07-11.

## Implementation status

| Component | Route | Status |
|-----------|-------|--------|
| Calendar Day | `/components/calendar-day` | Beta React implementation |
| Calendar Grid | `/components/calendar-grid` | Beta React implementation |
| Date Picker | `/components/date-picker` | Beta React implementation |

Internal utilities (not public exports):

- `components/ui/internal/calendar-date.ts`
- `components/ui/internal/calendar-math.ts`
- `components/ui/internal/useCalendarKeyboard.ts` — day-grid roving tabindex/arrow keys (date arithmetic)
- `components/ui/internal/useCalendarCellGridKeyboard.ts` — shared roving tabindex/arrow keys for the flat 12-cell month and year drill-up grids (index arithmetic; added 2026-07-12)

Building-block cells not exposed as top-level registry entries:

- `components/ui/CalendarMonthCell.tsx` — month drill-up grid cell, same construction pattern as Calendar Day (added 2026-07-12)
- `components/ui/CalendarYearCell.tsx` — year drill-up grid cell, same construction pattern as Calendar Day (added 2026-07-12)

## Sources reviewed (2026-07-11)

| Source | Status |
|--------|--------|
| `content/forms.ts` — Date Picker | Documented + Beta React implementation |
| `content/content-data.ts` — Calendar Day | Documented building block only |
| Figma Month Grid | **Not present** in current content exports |
| Figma Calendar composite | **Not present** as a standalone documented page |

## Existing Figma-derived pieces

### Date Picker (Forms)

- **Purpose:** Text-input-style date entry intended to trigger a calendar popover.
- **Variants:** State × Size (5 variants documented).
- **Properties:** Value (formatted date string).
- **Accessibility (documented):** Calendar icon and input must both open the same popover; both keyboard operable.
- **Known gap:** Does **not** include the calendar grid — must pair with Calendar Day composition.

### Calendar Day (Content & Data building block)

- **Purpose:** Single day cell inside a month grid for Date Picker popover composition.
- **States (confirmed):** Default, Today, Selected, Disabled, Outside.
- **Properties:** Number (text).
- **Accessibility (documented):** Parent `role="grid"` with `role="gridcell"`; full arrow-key navigation; disabled dates use `aria-disabled`.
- **Distinction:** Outside (adjacent month, may remain clickable) ≠ Disabled (never selectable).

## Relationship map

```text
Date Input (not documented separately)
    └── Date Picker (Forms) — text field + trigger
            └── Calendar Popover (not documented as composite)
                    └── Month Grid (not documented)
                            └── Calendar Day × (7×6)
```

Public documentation URLs:

- `/components/date-picker` — Beta React implementation
- `/components/calendar-day` — Beta React building block
- `/components/calendar-grid` — Beta React month surface

## Confirmed vs unresolved behavior

| Topic | Status |
|-------|--------|
| Single-date selection | Implemented in DatePicker + CalendarGrid |
| Editable text entry | Implemented — D MMM YYYY (`en-GB` only); see **Text entry** below |
| Date-range selection | Implemented in CalendarGrid via `mode="range"` — see **Range selection** below. No composed range-picker input yet (judged non-trivial, see that section) |
| Disabled dates | Confirmed on Calendar Day; enforced in CalendarGrid and DatePicker, and in range mode (start/end/disabled-in-middle — see **Range selection**) |
| Today state | Confirmed on Calendar Day |
| Outside-month dates | Confirmed on Calendar Day |
| Month/year navigation | Prev/next month buttons, plus drill-up month and year grids (see **Drill-up subviews** below) |
| Week start / localization | Configurable — see **Locale & week start** below |
| Min/max dates | Enforced in CalendarGrid and DatePicker (typed + picked), and in range mode |
| Time zone assumptions | Date-only (`YYYY-MM-DD`); local calendar arithmetic, no UTC shift |
| Keyboard model (grid) | Arrow keys + roving tabindex in CalendarGrid |
| Date-range highlight preview | Implemented — live hover/keyboard provisional preview before the end is committed (see **Range selection**) |

## Text entry (DatePicker)

Shipped in the editable DatePicker batch. Display and parse format are paired:

| Concern | Behavior |
|---------|----------|
| Display format | `formatDisplayDate` → locale-aware **D MMM YYYY** (e.g. `11 Jul 2026` in en-GB) via `Intl` |
| Parse format | `parseDisplayDate` in `calendar-date.ts` — accepts the same locale-aware display pattern |
| Locale | Configurable via `locale` prop — defaults to `en-GB` (`CALENDAR_DEFAULT_LOCALE`) |
| Numeric regional formats | **Rejected** — no `DD/MM/YYYY`, `MM/DD/YYYY`, or ISO typing in the text field |
| Commit triggers | Blur and Enter on the text input |
| Valid commit | Updates `value`, hidden `name` input, CalendarGrid selection, and visible month |
| Invalid format | Visible `ValidationMessage` — `"Enter a date like …"` using the active locale or formatter |
| Out of range (`minDate`/`maxDate`) | Visible error — `"Choose a date within the allowed range."` |
| `isDateDisabled` match | Visible error — `"This date is not available."` |
| Clear field | Clears selection; required fields show `"This field is required."` |
| Calendar icon | Opens popover for visual picking; selection syncs back to the text field |
| Popover width | Does **not** use `matchTriggerWidth` — grid natural width exceeds the input trigger |

Internal API (not public exports):

- `parseDisplayDate(text, locale?)` → `CalendarDateString | null`
- `formatDisplayDate(date, locale?)` → display string (round-trip pair)
- `resolveCalendarLocale(locale?)` → validated locale with en-GB fallback

## Locale & week start

Shipped configuration surface on **CalendarGrid**, **DatePicker**, and **CalendarDay** (`locale` only):

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `locale` | `string` | `"en-GB"` | Passed to all `Intl.DateTimeFormat` calls in `calendar-date.ts` |
| `weekStartsOn` | `0 \| 1` | `1` (Monday) | Reorders weekday headers and month grid in CalendarGrid / DatePicker |

**Invalid locale fallback:** if `Intl` rejects the requested locale, components fall back to `CALENDAR_DEFAULT_LOCALE` and emit a **dev-mode `console.warn`** — never crash.

**Formatter overrides** (optional, all components that format dates):

| Prop | Purpose |
|------|---------|
| `formatMonth` | Override month caption in CalendarGrid |
| `formatWeekday` | Override weekday column headers (`dayIndex` 0–6 from week start) |
| `formatDate` | Override DatePicker text-field display (and parse pair) |
| `parseDate` | Required counterpart when `formatDate` is set — dev warning if only one is provided |

When formatter callbacks are omitted, locale-derived `Intl` formatting applies. Callbacks take precedence over `locale` for their specific output.

**Parse map consistency:** `parseDisplayDate` rebuilds its month-abbreviation map from the same resolved locale as `formatDisplayDate`, so typed dates round-trip under non-default locales.

## Semantic model (target, pending Figma confirmation)

1. **Date Picker field** — combobox or text input + calendar trigger (match final Figma interaction spec).
2. **Calendar grid** — `role="grid"` with labelled month caption.
3. **Calendar Day cells** — `role="gridcell"` with `aria-selected`, `aria-disabled`, and `tabindex` roving managed at grid level.
4. **Popover shell** — reuse non-modal Popover positioning infrastructure where appropriate; do not trap focus unless Figma confirms modal date picking.

## Recommended first implementation batch

Smallest useful slice aligned with current documentation:

1. **CalendarDay** (internal or documented subcomponent) — render confirmed states only.
2. **CalendarGrid** (internal) — static 7×6 month layout with roving tabindex and arrow-key navigation.
3. **DatePicker** (public) — compose Text Input + icon trigger + Popover + CalendarGrid for **single-date selection only**.
4. **Tests** — keyboard navigation, disabled/outside/today/selected states, popover open/close focus return.

Explicitly **defer** until Figma confirms:

- Inline (non-popover) calendar panel
- Time selection

Shipped 2026-07-12 (moved out of deferred): **Month/year drill-up subviews** — see below.
Shipped 2026-07-12 (moved out of deferred): **Date-range selection** — see below. The composed range-picker input (two text fields + shared calendar, analogous to DatePicker) remains unbuilt — judged non-trivial, not just a small addition (see **Range selection** for the reasoning).

## Drill-up subviews (shipped 2026-07-12)

`CalendarGrid` has three internal drill levels — **day** (default), **month**, and **year**. Which one is showing is internal UI state (`useState`), not part of the public `value`/`visibleMonth` contract: consumers never see or control it directly, and it always resets to `"day"` on remount (e.g. every time a `DatePicker` popover reopens, since `PopoverContent` unmounts its children on close).

### Interaction model

| From | Trigger | Goes to | Effect |
|------|---------|---------|--------|
| Day | Click the month/year header (e.g. "July 2026") | Month grid (12 cells, Jan–Dec, for the visible year) | — |
| Month | Click a month cell | Day grid | `visibleMonth` updates to that month; day focus restored via `resolveInitialFocusDate` |
| Month | Click the year label (e.g. "2026") | Year grid (12-year page, anchored around the visible year) | — |
| Year | Click a year cell | Month grid, for that year | `visibleMonth`'s year updates; month kept from before drilling up |

The day view's Prev/Next month buttons are unchanged. The month view has no Prev/Next controls — moving to a different year goes through the year grid. The year view has **Previous/Next 12 years** page buttons instead.

### Components and keyboard model

- `CalendarMonthCell` / `CalendarYearCell` (`components/ui/CalendarMonthCell.tsx`, `CalendarYearCell.tsx`) follow the exact same construction pattern as `CalendarDay`: native `<button type="button">`, roving tabindex, `aria-disabled`/`disabled` when out of range.
- Both grids are flat 12-cell, 4-column layouts and share **one** keyboard hook, `useCalendarCellGridKeyboard` (index-based: arrow keys, Home/End move to the first/last cell in the current row, Enter/Space selects) — the day grid keeps its own `useCalendarKeyboard` since it needs calendar-date arithmetic (week/month boundaries), not plain index math.
- Each grid container uses `role="grid"` the same way the day grid does, with its own accessible label: `aria-label="Choose month, {year}"` for the month grid, `aria-label="Choose year"` for the year grid (day grid keeps its existing `aria-labelledby`).
- Focus restoration on drill transitions: a single effect compares the previous and current subview and imperatively focuses the relevant cell (the cell that triggered the transition unmounts, so focus can't just follow it). Landing back on the day grid reuses `resolveInitialFocusDate` — previously selected date if it falls in the newly-visible month, else today, else the 1st of the month (probed forward if disabled).

### Range enforcement

- `minDate`/`maxDate`/`isDateDisabled` propagate into both grids: a month is disabled when **every** day inside it is disabled (`isMonthFullyDisabled`); a year is disabled when every month inside it is (`isYearFullyDisabled`). Both live in `components/ui/internal/calendar-math.ts`.
- The year grid pages 12 years at a time, anchored so the initial page always contains the currently visible year (`getYearPageStart`). The further Prev/Next 12-years button disables itself once the adjacent page has zero selectable years (`pageHasSelectableYear`), so paging can never land on a dead page.

### Known gap

- `resolveInitialFocusDate`'s `value`/`initialFocusDate` candidates are only honored when they fall within the target `visibleMonth` (checked via `isSameCalendarMonth`) — without that guard, drilling into a month different from the one holding the current selection would silently steal focus back to the selected date instead of the newly-visible month. Worth keeping in mind if this function grows more call sites.

## Range selection (shipped 2026-07-12)

`CalendarGrid` supports date-range selection via an opt-in `mode?: "single" | "range"` prop (default `"single"`). Single-date mode's props (`value`/`defaultValue`/`onValueChange`) are completely unchanged and untouched by this — every pre-existing test still passes unmodified. Range mode uses its own, separate set of props instead.

### Value shape and API

```ts
type CalendarDateRange = { start: CalendarDateString | undefined; end: CalendarDateString | undefined };

mode?: "single" | "range";              // default "single"
rangeValue?: CalendarDateRange;          // controlled
defaultRangeValue?: CalendarDateRange;   // uncontrolled
onRangeValueChange?: (range: CalendarDateRange) => void;
```

Decided as **separate props** rather than widening `value`'s type to `CalendarDateString | CalendarDateRange` — that would have made single-date mode's own type signature a union even though its runtime behavior never changes, which is exactly the kind of API leakage the task asked to avoid. Dedicated `rangeValue`/`defaultRangeValue`/`onRangeValueChange` keep the two modes fully independent at the type level too.

### Selection flow

1. **First click/Enter** (no range in progress, or a complete range already exists) always starts fresh: `{ start: date, end: undefined }`.
2. **Second click/Enter** (start set, end not yet) commits the end. **Decision: if the chosen date is before the current start, swap them** so the stored range is always chronological (`start <= end`), rather than discarding the first click and restarting from the second one. Reasoning: both dates the user actually clicked survive this way — a restart-based rule would make a backwards second click feel like nothing happened, and would silently throw away input the user may have intended to keep. This matches the convention most mature range pickers use (e.g. Airbnb, Google Flights). Implemented in `handleRangeSelect` in `CalendarGrid.tsx`.
3. **Clicking within an already-complete range** starts a new range from that click (case 1 above) — it does not extend or replace just one end of the old range.

### Disabled dates and ranges

- A range's start or end **can never land on a disabled date** — `handleRangeSelect` guards on `isDisabled(date)` first, exactly like single-date mode.
- A range **can visually pass through a disabled date in the middle** without that date becoming selectable — this is normal for real booking calendars (e.g. a maintenance-blocked day that doesn't prevent a longer stay from spanning over it). A disabled day inside `[start, end]` still renders with `disabled`/`aria-disabled` and a non-interactive button, while *also* carrying the `rangeMiddle` visual/label state, so the connecting highlight reads as continuous. Range membership reuses the existing `isDateWithinRange` helper — no new range-math utility was needed.

### Visual states and hover/keyboard preview

`CalendarDay` gained five new opt-in boolean props, only ever set when the parent is in range mode: `rangeStart`, `rangeEnd`, `rangeMiddle` (committed states — `rangeStart` and `rangeEnd` can both be `true` on the same cell for a single-day range, which composes automatically in CSS into a full pill rather than needing special-case styling), and `rangePreviewEnd`/`rangePreviewMiddle` (the provisional, uncommitted hover/keyboard preview, styled as a lighter/dashed variant so it reads as distinct from a committed selection).

The live preview — "hovering a later date shows what you're about to select" — is driven by `hoveredDate ?? focusedDate`, computed once per render as `rangePreviewSpan`. Real DOM focus changes (arrow-key nav or a click) clear `hoveredDate`, so keyboard navigation always takes over as the preview anchor instead of a stale mouse position — this is what gives keyboard users the identical live preview the task asked for, with no separate keyboard-specific preview logic. The preview honors the same swap-for-chronological-order behavior as an actual commit would (hovering an earlier date previews the range as it would actually end up, not a naive "start to hover" span that could run backwards).

### Accessibility

- Each cell's accessible name changes with its role, layered in priority order: `"Start and end of range, {date}"` (single-day range) → `"Start of range, {date}"` → `"End of range, {date}"` → `"{date}, in range"` (committed middle) → `"{date}, provisional end of range. Press Enter to confirm."` (preview anchor) → `"{date}, previewing range"` (preview middle) → the plain single-date label otherwise. This is the primary channel for start/middle/end/preview — color/highlight is never the only signal.
- The `role="gridcell"` wrapper's `aria-selected` is `true` for committed start/middle/end cells, matching single-date mode's existing pattern; preview-only cells are **not** marked `aria-selected` (nothing has actually been selected yet — the label already communicates the provisional state).
- A visually-hidden (`.sr-only`) `aria-live="polite"` region announces state transitions: `"Start date selected, {date}. Choose an end date."` once a start is set, then `"Date range selected: {start} to {end}."` once complete.

### Composed range-picker input — explicitly out of scope

The task allowed building a two-field range-picker input (analogous to `DatePicker`) if it turned out to be genuinely trivial given what already exists. It isn't: `DatePicker` itself is ~380 lines covering locale-aware parsing/formatting, blur/Enter commit, per-error-case validation messages, hidden-input form submission, and popover/focus wiring — a range version needs all of that *twice* (independently-typable start/end fields), plus new cross-field validation (end before start on typed input, not just picked input), a decision about which field a calendar click updates, and its own error-message set and test suite. That's comparable in scope to building `DatePicker` again, not a small follow-up, so it was left unbuilt. `CalendarGrid`'s `mode="range"` is built to be dropped into such an input exactly the way single-date `CalendarGrid` already drops into `DatePicker` today.

## Open questions for design parity

- Is Month Grid a separate Figma component or only an auto-layout composition of Calendar Day instances?
- Should Date Picker use `role="combobox"` or remain a text input with `aria-haspopup="grid"`? (Current: text input + `aria-haspopup="grid"` on the field, calendar grid labelled inside a semantic-neutral Popover shell.)
- Are Outside-month cells focusable and selectable, or focus-skipped?
- What is the exact arrow-key map (including Home/End/PageUp/PageDown)? (Partially implemented — see Calendar Grid registry.)

**Resolved in implementation:**

- Selecting a date closes the popover and returns focus to the calendar trigger button.

## Registry / routing guidance (future)

- Public route: `/components/date-picker` when implemented.
- `/components/calendar-day` should redirect or remain a noindex building-block reference — **do not compete** with the public Date Picker page for indexable SEO.
- Do not expose Calendar Grid or Calendar Day as duplicate top-level registry entries unless they become independently consumable APIs.
