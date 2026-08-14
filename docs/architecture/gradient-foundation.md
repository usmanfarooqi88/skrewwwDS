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

Gradient participates on resting surfaces and persistent Selected, Current, and Active surfaces. Transient Menu/List/Tree/Sidebar/Page hover highlights do not participate. File Upload Empty and Filled participate; Dragging, Disabled, and Error do not. Basic Table remains Flat-only.

React has no distinct public Credit Card Field or Dropdown Trigger implementation, and `MenuItem` has no persistent Selected API. Those Figma consumers are not invented in React by this foundation pass.

## Deferred and intentionally unresolved

- Advanced directional Gradient behavior
- File Upload Error participation reconsideration in the final Layer 3 sweep
- Canonical Foundation color drift: Figma primary `#17181B` versus React `#131316`, and Figma muted `#A0A3AC` versus React `#A0A2AC`
- `component/surface/fill` (`2057:11`) and `component/surface/fill-secondary` (`2057:12`) require a separate consumer/classification review. Current live modes no longer match the earlier purple-value report, so that report is not canonical Gradient evidence; cleanup remains deferred.
