/** Figma source for Date Picker parity audits. */
export const DATE_PICKER_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2596";

/** Component-set node ID — confirmed via Figma MCP on 2026-09-13 ("Forms/Date Picker"). */
export const DATE_PICKER_FIGMA_COMPONENT_SET_NODE_ID = "2024:2596";

/** State variants confirmed 2026-09-13. */
export const DATE_PICKER_FIGMA_VARIANTS = [
  "Default",
  "Hover",
  "Focused",
  "Error",
  "Disabled",
] as const;

/**
 * React popover shell intentionally keeps the prior simple Popover lock
 * (border + elevation + Glass md mix) and does not inherit Menu Panel's
 * rich rim. Recorded so shell unification is not attempted without approval.
 */
export const DATE_PICKER_FIGMA_POPOVER_SHELL_NOTE =
  "Trigger master is Forms/Date Picker 2024:2596. Calendar popup composition remains React-first relative to Menu Panel 2181:216.";

export const DATE_PICKER_FIGMA_AUDIT_STATUS = "verified-2026-09-13" as const;
