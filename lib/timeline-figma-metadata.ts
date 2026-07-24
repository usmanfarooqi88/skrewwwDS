/**
 * Figma metadata for Timeline / Content-Timeline Item — node IDs unresolved.
 * Unlike Tree View/Charts, no numeric Figma node ID has been given or
 * verified for Timeline yet. What IS confirmed (from direct discussion,
 * not MCP inspection): State (Default outlined ring / Highlighted larger
 * solid dot) as the only variant axis; Title/Timestamp/Description text
 * fields; connector-line suppression is purely positional (last item
 * only, independent of state); the description wraps at 220px width in
 * the Figma reference rather than truncating.
 */
export const TIMELINE_FIGMA_COMPONENT_SET_NODE_ID: string | null = null;

export const TIMELINE_FIGMA_AUDIT_STATUS = "unresolved-mcp" as const;
