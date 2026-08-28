# React Hooks lint debt

**Status: closed (2026-08-29)**

The Next.js 16 / `eslint-plugin-react-hooks@7` Compiler safety rules
(`react-hooks/refs`, `react-hooks/immutability`, `react-hooks/set-state-in-effect`)
previously flagged 26 intentional React 18 overlay/hook patterns. Those call
sites are now rewritten to React 19-safe equivalents. ESLint is gated at
`--max-warnings 0`, and the three Compiler rules use the plugin defaults
(errors) rather than a grandfathered warn downgrade.

## Patterns used

| Pattern | Where | Why |
|---|---|---|
| `useLatestRef` (layout-effect write) | Overlay escape, outside pointer, focus trap, floating position, background inert | Keep the latest callback/value for event/observer handlers without reading or writing refs during render, and without retriggering subscriptions. |
| `assignRef` / `mergeRefs` | Dialog, Drawer, Popover, Tooltip triggers; CalendarGrid `dayButtonRef` | Merge consumer refs with internal trigger refs in a commit-phase callback, not by mutating props during render. |
| `useIsClient` via `useSyncExternalStore` | Portal, Tooltip | Client-only portal mount without a `setState` in `useEffect`. Server snapshot is `false`; client snapshot is `true`. |
| Defer background inert until `excludeElement` exists | `useBackgroundInert` | Same-frame portal mount would otherwise inert the overlay itself. |
| `useSyncExternalStore` for `document.visibilityState` | Toast auto-dismiss | Subscribe to an external browser store instead of seeding state from an effect. |
| Adjust state during render when props change | DatePicker controlled value, Combobox active option, Combobox list status | Replace effect-driven `setState` that only mirrored props/open/result transitions. |
| Read DOM nodes inside effects | `useFloatingPosition` `triggerRef` | Avoid `triggerRef.current` during render; the effect still re-runs when `open` / floating node identity changes. |

## Contracts preserved

- Overlay Escape still closes the topmost registered overlay first.
- Popover remains non-modal (no focus trap, background stays interactive).
- Dialog/Drawer remain modal: focus trap, inert background, body scroll lock, focus restore.
- Tooltip hover/focus and `aria-describedby` wiring is unchanged.
- `useControllableState` was not modified.
- Public component APIs were not changed.

## Regression coverage

Existing overlay, Combobox, DatePicker, Portal, and Toast tests remain the
behavioral contract. Added focused tests for `assignRef`/`mergeRefs`,
`useLatestRef`, and DatePicker controlled-value text sync.

If a future Compiler rule flags a genuine latest-value or portal-hydration
pattern, prefer one of the patterns above over a rule downgrade.
