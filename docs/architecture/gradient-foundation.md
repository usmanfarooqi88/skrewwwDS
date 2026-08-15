# Stable-v1 Gradient foundation

Last updated: **2026-08-14**

Stable-v1 Gradient is one fixed additive lightness overlay. Participating components retain their existing semantic/base `background-color` and add:

```css
linear-gradient(90deg, #ffffff14 0%, #0000000a 100%)
```

The Figma variables are `component/surface/gradient-overlay-start` (`2329:2914`) and `component/surface/gradient-overlay-end` (`2329:2915`). Their Flat and Glass values are transparent; Gradient resolves to exact 8-bit alphas `20/255` and `10/255`. React exposes the shared composed image as `--component-surface-gradient-overlay` rather than duplicating stop values per component.

## Stable-v1 boundaries

- Direction is fixed left-to-right (`90deg`). There is no direction, angle, radial, animation, or per-component arbitrary-gradient API.
- The overlay changes lightness only. Primary, Danger, neutral, and feedback hues keep their existing base fills.
- Borders are unchanged. Existing Glass rim gradients remain Glass-only and independent.
- Focus and Shape behavior are independent from Gradient.

Gradient participates on resting surfaces and persistent Selected, Current, and Active surfaces. Transient Menu/List/Tree/Sidebar/Page hover highlights do not participate. File Upload Empty, Filled, and Error participate; Dragging and Disabled do not. Error retains the neutral Card-family base while its danger border and content remain independent from the overlay. Basic Table remains Flat-only.

React has no distinct public Credit Card Field or Dropdown Trigger implementation, and `MenuItem` has no persistent Selected API. Those Figma consumers are not invented in React by this foundation pass.

## Deferred and intentionally unresolved

- Advanced directional Gradient behavior
- Foundation primary/secondary and neutral/400 sync are complete (`#17181B` / `#5B5F68` / `#A0A3AC`); semantic/border-strong now also syncs to Figma `neutral/400` (`#A0A3AC`) — no longer a separate React/Figma alias-parity follow-up
- `component/surface/fill` (`2057:11`) and `component/surface/fill-secondary` (`2057:12`) require a separate consumer/classification review. Current live modes no longer match the earlier purple-value report, so that report is not canonical Gradient evidence; cleanup remains deferred.
