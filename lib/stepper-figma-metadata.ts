/**
 * Figma source for Stepper (CE-2K) — verified live via the Desktop Bridge
 * plugin (CE-2J, 2026-09-14), not the REST API and not the docs-only
 * content alone.
 */
export const STEPPER_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2944";

/** Component-set node ID — Navigation/Step Item. There is no separate "Stepper" component; only Step Item is a real Figma component. */
export const STEPPER_FIGMA_COMPONENT_SET_NODE_ID = "2024:2944";

/** "Navigation/Stepper" section grouping Step Item and its composed example. */
export const STEPPER_FIGMA_SECTION_NODE_ID = "2024:2973";

/** Composed "Stepper Trail (example)" demo frame — the only live evidence of multi-step layout/connector treatment. */
export const STEPPER_FIGMA_EXAMPLE_NODE_ID = "2024:2949";

/**
 * Verified contract (2026-09-14, live Desktop Bridge inspection):
 * - Exactly 3 variants: State = Completed / Current / Upcoming — no other
 *   state exists (no Error/Disabled/Optional/Skipped/Hover/Focus/Pressed).
 * - No orientation property or axis exists at all — not unspecified,
 *   structurally absent.
 * - No `description` property or layer exists anywhere.
 * - Zero prototype reactions anywhere — interaction intent is normative
 *   text only ("verify whether skipping ahead is actually intended before
 *   making steps clickable"), not a positive clickability confirmation.
 * - Anatomy: 24x24px Circle (cornerRadius 9999, bound to primitive
 *   `radius/full` — NOT a Shape-driven component token, confirming no
 *   Shape-system participation) + Label (TEXT), 8px gap between them.
 *   Completed's Circle contains a real `Icon/Check` instance (not a text
 *   glyph); Current/Upcoming contain a `Number` TEXT node instead.
 * - Composed "Stepper Trail (example)": HORIZONTAL layout, itemSpacing 8
 *   throughout (governs both circle-to-label and step-to-connector gaps);
 *   Connector = a plain RECTANGLE, 32x1.5px, fill `semantic/border/default`
 *   (matches its own author annotation: "connectors remain plain
 *   rectangles"); steps are content-sized, not equal-width
 *   (layoutGrow: 0 on every instance).
 * - No Surface-related tokens (gradient-overlay, glass-backdrop) bound
 *   anywhere; no Shape or Surface component property exists.
 *
 * Exact token bindings per state:
 * - Completed: circle fill `semantic/action/primary`, no stroke; label
 *   fill `semantic/text/primary`, weight 400.
 * - Current: circle fill `semantic/surface/default`, stroke (1.5px)
 *   `semantic/action/primary`; label fill `semantic/text/primary`,
 *   weight 700 (bold) — a real, additional non-color state signal not
 *   previously documented anywhere.
 * - Upcoming: circle fill `semantic/surface/default`, stroke (1.5px)
 *   `semantic/border/default`; label fill
 *   `component/surface/content-muted`, weight 400.
 * - All labels: `font-family/sans`, 16px.
 *
 * Not in the set / not resolvable from Figma: orientation, description,
 * icon-swap slot, narrow-viewport/many-step overflow behavior, whether
 * Completed/Current should be clickable by default (only that Upcoming
 * must never allow skipping ahead).
 */
export const STEPPER_FIGMA_STATES = ["Completed", "Current", "Upcoming"] as const;

export const STEPPER_FIGMA_VARIANT_COUNT = STEPPER_FIGMA_STATES.length;

export const STEPPER_FIGMA_AUDIT_STATUS = "verified-2026-09-14" as const;
