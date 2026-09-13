/**
 * Figma source for Split Button (CE-1C).
 * Pro Actions page component set — verified read-only via Figma MCP.
 */
export const SPLIT_BUTTON_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2022-1086";

/** Component-set node ID — Actions/Split Button. */
export const SPLIT_BUTTON_FIGMA_COMPONENT_SET_NODE_ID = "2022:1086";

/** Actions page containing the set. */
export const SPLIT_BUTTON_FIGMA_PAGE_NODE_ID = "2002:2367";

/**
 * Verified axes (2026-09-14):
 * Style (Primary/Secondary/Danger) × Size (Small/Medium/Large) = 9 variants.
 * Label TEXT property applies to the main action only.
 * Chevron dropdown menu is a separate composition (Navigation/Dropdown Menu /
 * React Menu) — not part of this Figma component set.
 *
 * Chrome matches Button Group technique:
 * - shared outer border semantic/border/default
 * - spacing/2 (2px) divider gap
 * - component/radius/control outer corners
 * - gap fill: Primary → color/brand/700; Secondary → semantic/border/default;
 *   Danger → color/danger/700
 *
 * Not in the set (UNKNOWN / deferred to Button + Menu):
 * State, Shape, Surface, menu-open chrome, disabled/loading axes.
 */
export const SPLIT_BUTTON_FIGMA_STYLES = ["Primary", "Secondary", "Danger"] as const;
export const SPLIT_BUTTON_FIGMA_SIZES = ["Small", "Medium", "Large"] as const;
export const SPLIT_BUTTON_FIGMA_VARIANT_COUNT =
  SPLIT_BUTTON_FIGMA_STYLES.length * SPLIT_BUTTON_FIGMA_SIZES.length;

export const SPLIT_BUTTON_FIGMA_GAP_PX = 2;
export const SPLIT_BUTTON_FIGMA_AUDIT_STATUS = "verified-2026-09-14" as const;

/** Chevron affordance in Figma is Icon/CaretDown — consumers supply CaretDown. */
export const SPLIT_BUTTON_FIGMA_CHEVRON = "Icon/CaretDown" as const;
