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

/** Figma source metadata for Table — React-first foundation; node IDs updated when MCP succeeds. */
export const TABLE_FIGMA_SOURCE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365";

/** Component-set node ID — unresolved until Figma MCP confirms a Table set. */
export const TABLE_FIGMA_COMPONENT_SET_NODE_ID: string | null = null;

export const TABLE_FIGMA_VERIFICATION = "pending" as const;

export const TABLE_IMPLEMENTATION_ORIGIN = "react-first" as const;

export const TABLE_FIGMA_AUDIT_STATUS = "unresolved-mcp" as const;

/** Usability / a11y / composition audit completed; Figma parity still pending. */
export const TABLE_USABILITY_AUDIT_STATUS = "completed-2026-07-13" as const;
