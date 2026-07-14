# Calendar Phase Two + Security Patch — Changed Files

Applied and fully verified against a working copy of your repo (267/267
Vitest tests passing, lint/typecheck/build all clean). These are the
**only** files that changed — copy each one to the same path in your real
repo, overwriting the existing version.

## Where each file goes

| File in this folder | Goes to |
|---|---|
| `package.json` | `/package.json` |
| `calendar-date.ts` | `/components/ui/internal/calendar-date.ts` |
| `calendar-date.test.ts` | `/components/ui/internal/calendar-date.test.ts` |
| `useCalendarKeyboard.ts` | `/components/ui/internal/useCalendarKeyboard.ts` |
| `CalendarGrid.tsx` | `/components/ui/CalendarGrid.tsx` |
| `CalendarGrid.test.tsx` | `/components/ui/CalendarGrid.test.tsx` |

After copying, run `npm install` (package.json changed) then `npm test` to
confirm 267/267 pass in your actual environment too.

---

## 1. Security fix: Next.js 14.2.5 → 14.2.35

`npm audit` found 5 vulnerabilities, **1 critical** (cache poisoning,
several DoS vectors, an auth bypass). This patch-level bump within Next
14.x (not a major version change) resolves the critical one and several
others.

**Not fully resolved**: 4 remaining (1 moderate, 3 high) require jumping
to Next 16.x, a breaking major-version change I did not apply silently.
That's a separate, bigger decision — worth scheduling deliberately, not
bundled into this patch.

**Resolved 2026-07-13**: Next.js was upgraded to 16.2.10 (React 19.2.7,
ESLint 9 flat config) on branch `upgrade/next-16`. `npm audit` now shows
only 1 moderate finding (PostCSS XSS, GHSA-qx2v-qp2m-jg93), vendored
inside Next's own bundled `postcss@8.4.31` — still unresolved upstream
even in 16.2.10, and outside our control until Next.js updates its
internal copy. All previously-tracked high-severity findings (the
Next.js CVE cluster and the `glob` command-injection pulled in via the
old `eslint-config-next`) are gone. See
[`docs/project-status.md`](../docs/project-status.md#quality-gate-status)
for current gate numbers.

## 2. Calendar phase two: min/max dates + disabled-date rules

Closes the first item on the Calendar phase-two roadmap. `CalendarGrid`
gains three new optional props:

```tsx
<CalendarGrid
  minDate="2026-07-10"           // dates before this are disabled
  maxDate="2026-07-20"           // dates after this are disabled
  isDateDisabled={(date) => …}   // arbitrary additional predicate,
                                  // combined with min/max
/>
```

Wiring notes:
- `useCalendarKeyboard` already had an `isDisabled` parameter and
  skip-disabled-date logic in its arrow-key handling — it was just never
  actually connected to `CalendarGrid`. This patch computes a combined
  `isDisabled` function (range check OR the custom predicate) and passes
  it through to both the keyboard hook and every `CalendarDay` instance's
  `disabled` prop.
- `resolveInitialFocusDate` now avoids landing initial focus on a
  disabled date — if the preferred candidate (selected value, today, or
  the 1st of the month) is disabled, it searches forward for the nearest
  enabled day instead.
- New helper: `isDateWithinRange(date, min?, max?)` in `calendar-date.ts`,
  inclusive on both bounds, either bound optional.

## 3. Real bug found and fixed: focus could land on a disabled date at a hard boundary

While tracing through the min/max logic, found that `moveIfEnabled`'s
existing fallback (try up to 42 steps, then give up and return the
original candidate) meant that at a genuine boundary — e.g. pressing
ArrowLeft when *every* earlier date is disabled by `minDate`, with no
re-entry point — it would return that disabled candidate anyway. The
caller would then set `focusedDate` to a disabled date, desyncing React
state from actual DOM focus (a `disabled` button can't receive real
keyboard focus).

**Fix**: `moveFocus` now checks whether the resolved date is still
disabled before committing the focus change — if so, it does nothing,
leaving focus exactly where it was. Covered by a new test:
`"does not move focus onto a disabled date at a hard minDate boundary"`.

## Tests added

- `calendar-date.test.ts`: 4 new tests for `isDateWithinRange` (both
  bounds, single bound, unbounded, inclusive edges).
- `CalendarGrid.test.tsx`: 5 new tests — disables outside min/max,
  disables via custom predicate, click on disabled date doesn't select,
  arrow-key navigation skips a disabled date, and the boundary-focus fix.

**9 new tests, all passing. 267/267 total (258 + 9).**

## Not yet done (still open on the Calendar phase-two roadmap)

Localization/week-start configuration, editable text entry with parse
validation, date-range selection, month/year picker subviews — none of
these were touched in this pass. Min/max + disabled-date rules was
deliberately scoped as one complete, tested unit rather than combined
with the others.
