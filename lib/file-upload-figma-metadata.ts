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
 * Filled-variant anatomy, confirmed via Figma MCP on 2026-07-15: exactly one
 * row — File Icon + File Name text + Remove Icon. No list container, no
 * repeated-row structure, no way to represent more than one attached file
 * anywhere in the Filled variant.
 */
export const FILE_UPLOAD_FIGMA_FILLED_ANATOMY = [
  "File Icon",
  "File Name (text property)",
  "Remove Icon",
] as const;

/** Related building-block node IDs — unresolved beyond the confirmed component set. */
export const FILE_UPLOAD_FIGMA_RELATED_NODE_IDS = {
  dropzone: null as string | null,
  fileItem: null as string | null,
  fileList: null as string | null,
  uploadProgress: null as string | null,
  browseTrigger: null as string | null,
} as const;

/**
 * Confirmed gap (2026-07-15) — not merely unaudited. The Filled variant's
 * anatomy is a single row (File Icon + File Name + Remove Icon); there is no
 * list structure anywhere in the Figma file that could represent more than
 * one attached file. React's `multiple` / `maxFiles` / independently-
 * removable file list is therefore React-first with Figma parity pending for
 * that specific capability — the single-file trigger/state anatomy above is
 * fully confirmed; only the multi-file list has no Figma reference to match.
 */
export const FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS = "confirmed-absent" as const;

export const FILE_UPLOAD_FIGMA_AUDIT_STATUS = "verified-2026-07-15" as const;

export const FILE_UPLOAD_IMPLEMENTATION_GATE = "approved-react-first" as const;
