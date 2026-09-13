/**
 * Canonical record of Semantic Icon Size tokens and the 2026-09-13
 * dual-bind repair. React does not yet expose these as CSS custom
 * properties — icon dimensions remain component-local in CSS. This file
 * documents the live Figma contract only.
 */

export const ICON_SIZE_FIGMA_PRO_FILE_KEY = "U6KUuNf7DF4CP9QBOkLSUx";
export const ICON_SIZE_FIGMA_FREE_FILE_KEY = "KrQIUWznpBdP0ZuWjOu2e3";

/** Semantic collection FLOAT tokens — scopes WIDTH_HEIGHT. */
export const ICON_SIZE_FIGMA_TOKENS = {
  sm: {
    id: "VariableID:2003:3546",
    name: "semantic/icon-size/sm",
    aliasesTo: { id: "VariableID:2002:2414", name: "spacing/16", value: 16 },
  },
  md: {
    id: "VariableID:2003:3547",
    name: "semantic/icon-size/md",
    aliasesTo: { id: "VariableID:2002:2415", name: "spacing/20", value: 20 },
  },
  lg: {
    id: "VariableID:2003:3548",
    name: "semantic/icon-size/lg",
    aliasesTo: { id: "VariableID:2002:2416", name: "spacing/24", value: 24 },
  },
} as const;

/**
 * Figma Plugin API limitation on INSTANCE nodes: `setBoundVariable('width')`
 * and `setBoundVariable('height')` are mutually exclusive — binding one
 * clears the other. Frames and Components accept true dual width+height.
 *
 * Approved structural equivalent for Icon INSTANCE consumers:
 * - `height` → semantic/icon-size/{sm|md|lg}
 * - `minWidth` + `maxWidth` → the same variable
 *
 * Visual contract stays square (16 / 20 / 24). Instances were previously
 * height-only (structurally incomplete, visually already square).
 */
export const ICON_SIZE_INSTANCE_BIND_STRATEGY =
  "height + minWidth + maxWidth to the same semantic/icon-size/* token" as const;

export const ICON_SIZE_REPAIR_STATUS = "repaired-2026-09-13" as const;

export const ICON_SIZE_REPAIR_SCOPE = [
  "Actions (Button, Icon Button, Link, Split Button)",
  "Forms",
  "Navigation",
  "Feedback",
  "Containers & Overlays",
  "Content & Data",
] as const;
