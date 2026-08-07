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

/** Figma source for File Upload parity audits — node IDs updated when MCP inspection succeeds. */
export const FILE_UPLOAD_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365";

/** Starting node from the discovery pass brief. */
export const FILE_UPLOAD_FIGMA_START_NODE_ID = "2002:2365";

/** Component-set node ID — confirmed via Figma MCP on 2026-07-15 ("Forms/File Upload"). */
export const FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID: string | null = "2024:2649";

/** State property variants, confirmed via Figma MCP on 2026-07-15. */
export const FILE_UPLOAD_FIGMA_VARIANTS = [
  "Empty",
  "Dragging",
  "Error",
  "Disabled",
  "Filled",
] as const;

/** Component properties, confirmed via Figma MCP on 2026-07-15. */
export const FILE_UPLOAD_FIGMA_COMPONENT_PROPERTIES = {
  fileName: { type: "TEXT", meaningfulOn: "Filled" },
} as const;

/**
 * Filled variant (node 2024:2648), confirmed via direct Figma property
 * inspection on 2026-07-15 (later same-day correction — see
 * FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS below). Restructured from a single
 * hardcoded row into a vertical list container: layoutMode VERTICAL, hugs
 * height, fixed 320px width, clips content to its existing 12px radius,
 * retains its original white fill + border token. It contains one or more
 * File Row frames — the base Filled variant shows exactly one, representing
 * the single-file case AS a list of one rather than a separate layout.
 */
export const FILE_UPLOAD_FIGMA_FILLED_VARIANT_NODE_ID = "2024:2648";

export const FILE_UPLOAD_FIGMA_FILLED_CONTAINER_ANATOMY = {
  layoutMode: "VERTICAL",
  sizing: "hugs height, fixed 320px width",
  clipsContent: true,
  cornerRadius: "12px (original)",
  fill: "white (original)",
  border: "original border token",
} as const;

/**
 * First File Row frame (node 2107:10), confirmed via direct Figma property
 * inspection on 2026-07-15. Each File Row: HORIZONTAL, FILL width / HUG
 * height, containing File Icon (instance) + File Name (text) + Remove Icon
 * (instance), with a bottom-only divider stroke bound to
 * semantic/border/default.
 */
export const FILE_UPLOAD_FIGMA_FILE_ROW_NODE_ID = "2107:10";

export const FILE_UPLOAD_FIGMA_FILE_ROW_ANATOMY = [
  "File Icon (instance)",
  "File Name (text)",
  "Remove Icon (instance)",
] as const;

/**
 * Multi-file example frame "File Upload (example — multiple files)" (node
 * 2108:21), 320x132px, confirmed via direct Figma property inspection on
 * 2026-07-15. Built by instancing the Filled variant, detaching it, and
 * duplicating File Row twice more with distinct filenames
 * (design-tokens.pdf, brand-guidelines.docx, logo-export.svg) — three rows
 * stacked with zero gap/overlap. The component set's own Figma description
 * was rewritten to state this architecture explicitly.
 */
export const FILE_UPLOAD_FIGMA_MULTI_FILE_EXAMPLE_NODE_ID = "2108:21";

/** Related building-block node IDs — unresolved beyond the confirmed component set. */
export const FILE_UPLOAD_FIGMA_RELATED_NODE_IDS = {
  dropzone: null as string | null,
  fileItem: null as string | null,
  fileList: null as string | null,
  uploadProgress: null as string | null,
  browseTrigger: null as string | null,
} as const;

/**
 * Corrected 2026-07-15 (same-day, later pass) — this was recorded as
 * "confirmed-absent" earlier the same day, which was accurate for the
 * anatomy that existed at that time but went stale within the session: the
 * multi-file list anatomy was designed and built in Figma immediately after,
 * per an explicit decision that single-file and multi-file share identical
 * File-Row-list anatomy rather than separate layouts (see
 * FILE_UPLOAD_FIGMA_FILLED_VARIANT_NODE_ID and
 * FILE_UPLOAD_FIGMA_MULTI_FILE_EXAMPLE_NODE_ID above). Multi-file list
 * anatomy is now Figma-confirmed, same as the single-file case — both are
 * the same File-Row-list structure, just with a different row count.
 */
export const FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS = "confirmed-present" as const;

export const FILE_UPLOAD_FIGMA_AUDIT_STATUS = "verified-2026-07-15" as const;

export const FILE_UPLOAD_IMPLEMENTATION_GATE = "approved-react-first" as const;
