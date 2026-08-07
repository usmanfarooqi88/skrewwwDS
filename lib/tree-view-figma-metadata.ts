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

/**
 * Figma metadata for Tree View / Content-Tree Item — node IDs confirmed via
 * direct Figma inspection on 2026-07-18. The component structure, properties,
 * tokens, and depth * 20px indentation convention were already accurately
 * described and implemented against when Tree View shipped (2026-07-18);
 * only the node IDs themselves were missing from the record at that time.
 */

export const TREE_VIEW_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2058-1988";

/** Parent section, confirmed 2026-07-18. */
export const TREE_VIEW_FIGMA_SECTION_NODE_ID = "2058:2071";

/** Component-set node ID for "Content/Tree Item", confirmed 2026-07-18. */
export const TREE_VIEW_FIGMA_COMPONENT_SET_NODE_ID = "2058:1988";

/** State variants on the Content/Tree Item component set, confirmed 2026-07-18. */
export const TREE_VIEW_FIGMA_STATE_VARIANT_NODE_IDS = {
  default: "2058:1985",
  hover: "2058:1986",
  selected: "2058:1987",
} as const;

/** Composed "Tree View (example)" demo frame, confirmed 2026-07-18 — the source for the verified 20px-per-depth indentation. */
export const TREE_VIEW_FIGMA_EXAMPLE_NODE_ID = "2058:1998";

export const TREE_VIEW_FIGMA_AUDIT_STATUS = "verified-2026-07-18" as const;
