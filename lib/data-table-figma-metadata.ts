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

/** Figma / gate metadata for Data Table (formerly tracked as "Data Grid"). */
export const DATA_TABLE_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365";

/** Starting node from the discovery pass brief. */
export const DATA_TABLE_FIGMA_START_NODE_ID = "2002:2365";

/**
 * There is no Content/Data Table component master. Keep this null so
 * registry/docs cannot treat a shell node as canonical.
 */
export const DATA_TABLE_FIGMA_COMPONENT_SET_NODE_ID: string | null = null;

/** Canonical sortable header primitive — maps to DataTableSortHeader. */
export const DATA_TABLE_COLUMN_HEADER_FIGMA_NAME =
  "Content/Data Table Column Header" as const;
export const DATA_TABLE_COLUMN_HEADER_FIGMA_NODE_ID = "2805:859";
export const DATA_TABLE_COLUMN_HEADER_FIGMA_SOURCE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2805-859";

/**
 * Customer-facing composition examples. This is a presentation FRAME, not
 * a component master — do not use it as figmaNodeId.
 */
export const DATA_TABLE_PRESENTATION_FRAME_NAME =
  "Content/Presentation/Data Table" as const;
export const DATA_TABLE_PRESENTATION_FRAME_NODE_ID = "2491:932";

/** Related building-block node IDs. `dataTable` stays null (no shell master). */
export const DATA_TABLE_FIGMA_RELATED_NODE_IDS = {
  table: "2321:1964",
  dataTable: null as string | null,
  headerCell: "2321:1872",
  row: null as string | null,
  cell: "2321:1872",
  sortableHeader: DATA_TABLE_COLUMN_HEADER_FIGMA_NODE_ID,
  selectionColumn: null as string | null,
} as const;

export const DATA_TABLE_FIGMA_AUDIT_STATUS = "verified-2026-08-31" as const;

/**
 * Implementation gate for the Data Table pattern.
 * approved-narrow-mvp (2026-07-13) approved naming, MVP interactive pillar
 * (sorting only), and pagination approach (external Pagination composition).
 * implemented-react-first (2026-07-15) — the approved MVP is now built:
 * DataTableSortHeader + useDataTableSort compose Table.
 * Figma (2026-08-31): Column Header primitive mapped; no Data Table master.
 */
export const DATA_TABLE_IMPLEMENTATION_GATE = "implemented-react-first" as const;

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
