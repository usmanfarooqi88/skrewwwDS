/**
 * Figma metadata for the Layer 4 Banking pilot (Banking Transaction Row,
 * Banking Account Card, Banking Balance Summary).
 *
 * Confirmed via a full Figma file search on 2026-07-25 (every page
 * checked) that no Industry Systems page and no Banking-related frame or
 * component exists anywhere in the design file. This is a genuinely
 * greenfield pilot with a confirmed *absence* of a Figma reference — not
 * a pending/inconclusive MCP check. Do not conflate this status with
 * Table/Data Table's "unresolved-mcp" (which means the check hasn't
 * succeeded yet, not that nothing exists), and do not invent a Figma
 * reference for any of these three components.
 */
export const BANKING_FIGMA_COMPONENT_SET_NODE_ID: string | null = null;

export const BANKING_FIGMA_AUDIT_STATUS = "confirmed-no-reference-2026-07-25" as const;
