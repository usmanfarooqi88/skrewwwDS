/**
 * Figma metadata for Timeline / Content-Timeline Item — node IDs confirmed via
 * direct Figma Plugin API inspection on 2026-07-24. The component structure,
 * properties, tokens, and positional (not state-coupled) connector suppression
 * were already accurately described and implemented against when Timeline
 * shipped (2026-07-19); only the node IDs themselves were missing from the
 * record at that time.
 *
 * Properties on "Content/Timeline Item": Title (text), Timestamp (text),
 * Description (text), State (variant: Default/Highlighted).
 *
 * Anatomy — Default state: 10x10 dot, stroke-only (1.5px,
 * semantic/action/primary, unfilled center) + a 2x48px Connector Line (fill,
 * semantic/border/default). Highlighted state: 12x12 dot, solid fill
 * (semantic/action/primary), no stroke — bigger and filled to stand out as
 * the most recent/current event. Title is always semantic/text/primary;
 * Timestamp and Description are always semantic/text/secondary in both
 * states — neither text token changes between states.
 *
 * Critical confirmed finding: the last item's connector is not merely
 * hidden — it's structurally absent. The Marker Column itself is resized to
 * just the dot's height (12px vs 62px for non-last items), with no
 * Connector Line child at all. There is no formal "Show connector" boolean
 * property on the component — this is a compositional/computed concern (is
 * this the last rendered item?), independent of State. `TimelineItemRow`
 * already reflects this correctly: `isLast` is computed positionally, never
 * coupled to `state === "highlighted"`.
 *
 * The "Timeline (example)" composed frame has no fill/border at all — not
 * Surface-mode relevant. Vertical layout, itemSpacing 0 — items stack
 * directly, each item's own height provides the vertical rhythm.
 *
 * Layer 3 Surface-cascade status (checked 2026-07-24): Timeline's
 * Highlighted dot (12x12) falls below the established ~20px threshold for
 * "too small for a background-blur effect to matter" — correctly not part
 * of the Surface/Glass token architecture, same category as
 * Checkbox/Radio/Switch.
 */

export const TIMELINE_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2058-2092";

/** Parent section "Content/Timeline", confirmed 2026-07-24. */
export const TIMELINE_FIGMA_SECTION_NODE_ID = "2058:2130";

/** Component-set node ID for "Content/Timeline Item", confirmed 2026-07-24. */
export const TIMELINE_FIGMA_COMPONENT_SET_NODE_ID = "2058:2092";

/** Composed "Timeline (example)" demo frame, confirmed 2026-07-24. */
export const TIMELINE_FIGMA_EXAMPLE_NODE_ID = "2058:2102";

export const TIMELINE_FIGMA_AUDIT_STATUS = "verified-2026-07-24" as const;
