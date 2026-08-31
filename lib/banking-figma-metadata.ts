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
 * Figma metadata for the Layer 4 Banking pilot (Banking Transaction Row,
 * Banking Account Card, Banking Balance Summary).
 *
 * Confirmed via a full Figma file search on 2026-07-25 (every page
 * checked) that no Industry Systems page and no Banking-related frame or
 * component exists anywhere in the design file. This is a genuinely
 * greenfield pilot with a confirmed *absence* of a Figma reference — not
 * a pending/inconclusive MCP check. Do not conflate this confirmed
 * absence with Data Table, which now has a mapped Column Header primitive
 * (`2805:859`) but still no shell master. Do not invent a Figma
 * reference for any of these three components.
 */
export const BANKING_FIGMA_COMPONENT_SET_NODE_ID: string | null = null;

export const BANKING_FIGMA_AUDIT_STATUS = "confirmed-no-reference-2026-07-25" as const;
