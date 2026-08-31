# Browser interaction testing

Skrewww validates components with Vitest, Testing Library, Playwright, and static route generators. Vitest covers semantics, state, and local keyboard behavior. Playwright covers browser-only behavior that JSDOM cannot reliably simulate.

## Playwright setup

- **Package:** `@playwright/test` (Chromium only for now)
- **Config:** `playwright.config.ts`
- **Build output:** `.next-playwright` via `NEXT_DIST_DIR` (does not touch dev `.next`)
- **Web server:** `npm run build:e2e && npm run start:e2e -- -p 3100` (default port `3100`)
- **Reuse policy:** opt-in with `PLAYWRIGHT_REUSE_SERVER=true` (local only; never in CI)
- **Scripts:**
  - `npm run test:browser` — Playwright specs in `e2e/`
  - `npm run test:all` — verify scripts, lint, typecheck, Vitest, browser tests, and production build

Vitest excludes `e2e/**` so Playwright specs are not collected twice.

## Current browser coverage

Specs under `e2e/` include smoke, overlay, form, and component-specific flows (Dialog, Popover, Menu, Combobox, Date Picker, and others). Representative checks:

- Homepage and component documentation pages load without critical console errors
- Tooltip opens on focus and closes with Escape
- Keyboard focus remains visible
- Dialog opens, traps Tab focus, closes with Escape/close button, and locks body scroll
- Popover collision and dismissal behavior
- Menu keyboard navigation and typeahead
- Combobox filtering, keyboard selection, and form integration
- Date Picker calendar interaction

## Why browser-level testing is required

Browser automation verifies behavior unit tests cannot reliably simulate:

- **Portal rendering** — Tooltip, Popover, Menu, Dialog, and Drawer content often mounts outside the React tree root.
- **Real layout measurements** — Collision detection, viewport clipping, and scroll-container overflow require actual layout boxes.
- **Scrolling containers** — Sticky headers, nested scroll areas, and clipped popups need a real scroll model.
- **Focus trapping** — Dialog and Drawer must retain focus and restore focus on close.
- **Escape handling** — Global Escape dismissal must coexist with nested overlays.
- **Outside-click behavior** — Menus and Popovers must distinguish intentional dismissal from portaled content.
- **Viewport collision** — Floating layers should flip or shift using live viewport dimensions.
- **Mobile/touch behavior** — Tap, long-press, and virtual keyboard interactions.

## Components that still need expanded browser coverage

- Multi-select Combobox (deferred)
- Command Menu / Context Menu (deferred)
- Data Table (Table foundation shipped; Data Table sorting MVP implemented 2026-07-15 — expanded sort-header browser coverage remains a gap; see `docs/architecture/data-table-discovery.md`)

Dialog, Popover, Menu, Drawer, Combobox, Date Picker, File Upload, Table, Tree View, Bar Chart, Line Chart, and Timeline ship with Vitest and Playwright coverage (Tree View: `e2e/tree-view.spec.ts`, 2026-07-18 — default preview state, chevron-click expand, and ArrowUp/Down/Left/Right/Enter keyboard navigation; Bar Chart / Line Chart: `e2e/bar-chart.spec.ts` + `e2e/line-chart.spec.ts`, 2026-07-18 — proportional rendering, the hidden accessible-data-table alternative, and no console errors from recharts; Timeline: `e2e/timeline.spec.ts`, 2026-07-19 — positional connector suppression independent of state, and the highlighted item's larger marker with its long wrapping description rendered in full). Extend browser specs when new overlay-heavy or interactive tabular components enter implementation.
