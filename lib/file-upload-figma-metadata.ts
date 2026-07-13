/** Figma source for File Upload parity audits — node IDs updated when MCP inspection succeeds. */
export const FILE_UPLOAD_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365";

/** Starting node from the discovery pass brief. MCP inspection failed in this pass. */
export const FILE_UPLOAD_FIGMA_START_NODE_ID = "2002:2365";

/** Component-set node ID — unresolved until Figma MCP confirms the canonical set. */
export const FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID: string | null = null;

/** Related building-block node IDs — unresolved until MCP search succeeds. */
export const FILE_UPLOAD_FIGMA_RELATED_NODE_IDS = {
  dropzone: null as string | null,
  fileItem: null as string | null,
  fileList: null as string | null,
  uploadProgress: null as string | null,
  browseTrigger: null as string | null,
} as const;

export const FILE_UPLOAD_FIGMA_AUDIT_STATUS = "unresolved-mcp" as const;

export const FILE_UPLOAD_IMPLEMENTATION_GATE = "approved-react-first" as const;
