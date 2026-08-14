/**
 * Intentionally unimported by TypeScript: most of these constants exist
 * only as the canonical, version-controlled record of a confirmed Figma
 * fact — cited by name in prose (docs/architecture/*.md,
 * docs/project-status.md), not consumed by any import. A dead-code tool
 * (e.g. knip) will flag several as "unused exports"; that's expected and
 * correct for its own definition of "used," not a reason to delete them.
 * Deleting one removes the single source of truth it records, leaving
 * only prose with nothing to keep it honest.
 */

/** Canonical reusable Figma architecture for the React-first Table foundation. */
export const TABLE_FIGMA_SOURCE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2321-1964";

/** Public Table shell component. The shell is a component, not a component set. */
export const TABLE_FIGMA_COMPONENT_NODE_ID = "2321:1964";

/** Canonical row/cell component sets used to compose the shell. */
export const TABLE_FIGMA_RELATED_NODE_IDS = {
  headerRow: "2321:1903",
  bodyRow: "2321:1920",
  cell: "2321:1872",
} as const;

/** Historical example 2044:26192 is retained in Figma but is not canonical. */
export const TABLE_FIGMA_HISTORICAL_EXAMPLE_NODE_ID = "2044:26192";

export const TABLE_FIGMA_VERIFICATION = "verified-2026-08-14" as const;

export const TABLE_IMPLEMENTATION_ORIGIN = "react-first" as const;

export const TABLE_FIGMA_AUDIT_STATUS = "verified-2026-08-14" as const;

export const TABLE_STABLE_V1_CONTRACT = {
  surface: "flat-only",
  surfaceProperty: false,
  shape: "rounded-only-12px",
  shapeProperty: false,
  cornerSmoothing: 0,
  captionAndFooterVisuals: "pending",
  controlledShapeMapping: "deferred",
  dataTableBehavior: "separate",
  knownFoundationDrift: [
    "Figma component/surface/content-muted resolves #A0A3AC; React semantic/icon/muted resolves #A0A2AC",
  ],
} as const;

/** Usability / a11y / composition audit completed before visual parity. */
export const TABLE_USABILITY_AUDIT_STATUS = "completed-2026-07-13" as const;
