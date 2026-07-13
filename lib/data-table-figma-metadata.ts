/** Figma / gate metadata for Data Table (formerly tracked as "Data Grid") discovery — node IDs updated when MCP succeeds. */
export const DATA_TABLE_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365";

/** Starting node from the discovery pass brief. MCP inspection failed in this pass. */
export const DATA_TABLE_FIGMA_START_NODE_ID = "2002:2365";

/** Canonical component-set node ID — unresolved until Figma MCP confirms. Not blocking for the approved React-first MVP. */
export const DATA_TABLE_FIGMA_COMPONENT_SET_NODE_ID: string | null = null;

/** Related building-block node IDs — unresolved until MCP search succeeds. */
export const DATA_TABLE_FIGMA_RELATED_NODE_IDS = {
  table: null as string | null,
  dataTable: null as string | null,
  headerCell: null as string | null,
  row: null as string | null,
  cell: null as string | null,
  sortableHeader: null as string | null,
  selectionColumn: null as string | null,
} as const;

export const DATA_TABLE_FIGMA_AUDIT_STATUS = "unresolved-mcp" as const;

/**
 * Implementation gate for the Data Table component.
 * approved-narrow-mvp — naming, MVP interactive pillar (sorting only), and
 * pagination approach (external Pagination composition) approved 2026-07-13.
 * Implementation itself has not started — that is a separate, deliberate pass.
 */
export const DATA_TABLE_IMPLEMENTATION_GATE = "approved-narrow-mvp" as const;

/**
 * Canonical product naming — decided 2026-07-13 (final, not provisional).
 * Deliberately "Data Table", not "Data Grid": the approved scope excludes
 * role="grid", cell editing, and spreadsheet-style arrow-key cell navigation.
 */
export const DATA_TABLE_CANONICAL_NAME = "Data Table" as const;
export const DATA_TABLE_CANONICAL_SLUG = "data-table" as const;
export const DATA_TABLE_SEMANTICS = "native-table" as const;

/** Approved MVP interactive pillar — sorting only. Row selection is explicitly deferred to a later pass. */
export const DATA_TABLE_MVP_INTERACTIVE_PILLAR = "sorting-only" as const;

/** Approved pagination approach — external composition with the existing Pagination component, no embedded/compound API. */
export const DATA_TABLE_PAGINATION_APPROACH = "external-pagination-composition" as const;
