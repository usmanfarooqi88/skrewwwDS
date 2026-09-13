/**
 * Figma source for Button Group (CE-1B).
 * Pro Actions page component set — verified read-only via Figma MCP.
 */
export const BUTTON_GROUP_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2022-1013";

/** Component-set node ID — Actions/Button Group. */
export const BUTTON_GROUP_FIGMA_COMPONENT_SET_NODE_ID = "2022:1013";

/** Actions page containing the set. */
export const BUTTON_GROUP_FIGMA_PAGE_NODE_ID = "2002:2367";

/**
 * Verified axes (2026-09-13):
 * Style (Primary/Secondary/Danger) × Count (2/3/4) = 9 variants.
 * Count is a Figma demo axis — React uses children, not a count prop.
 * Horizontal only. Joined with spacing/2 (2px) divider gap.
 * Shared outer border semantic/border/default + component/radius/control.
 * No Size / State / Orientation / equal-width axes in the set.
 */
export const BUTTON_GROUP_FIGMA_STYLES = ["Primary", "Secondary", "Danger"] as const;
export const BUTTON_GROUP_FIGMA_COUNTS = ["2", "3", "4"] as const;
export const BUTTON_GROUP_FIGMA_VARIANT_COUNT =
  BUTTON_GROUP_FIGMA_STYLES.length * BUTTON_GROUP_FIGMA_COUNTS.length;

export const BUTTON_GROUP_FIGMA_GAP_PX = 2;
export const BUTTON_GROUP_FIGMA_AUDIT_STATUS = "verified-2026-09-13" as const;

/**
 * Product decision (CE-1B): Figma description recommends role=radiogroup for
 * mutually exclusive selection. React ButtonGroup is a visual joined group of
 * independent Button actions (role=group) — not Toggle Group / Segmented Control.
 * Selection semantics are deferred to a future CE-2 candidate if approved.
 */
export const BUTTON_GROUP_SELECTION_SEMANTICS = "not-implemented-independent-actions" as const;
