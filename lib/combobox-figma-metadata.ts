/** Figma source for Combobox parity audits — node IDs updated when MCP inspection succeeds. */
export const COMBOBOX_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365";

/** Starting node from the parity pass brief. */
export const COMBOBOX_FIGMA_START_NODE_ID = "2002:2365";

/** Component-set node ID — confirmed via Figma MCP on 2026-07-13 ("Forms/Combobox"). */
export const COMBOBOX_FIGMA_COMPONENT_SET_NODE_ID: string | null = "2024:2480";

/** Section containing the Combobox component set, confirmed 2026-07-13. */
export const COMBOBOX_FIGMA_SECTION_NODE_ID = "2024:2501";

/** State property variants, confirmed via Figma MCP on 2026-07-13. */
export const COMBOBOX_FIGMA_VARIANTS = [
  "Default",
  "Hover",
  "Focused",
  "Error",
  "Disabled",
] as const;

/** Component properties, confirmed via Figma MCP on 2026-07-13. */
export const COMBOBOX_FIGMA_COMPONENT_PROPERTIES = {
  value: { type: "TEXT", default: "Select options" },
  multiSelect: { type: "BOOLEAN", default: false },
} as const;

/**
 * Token bindings on the Default variant (node 2024:2475), confirmed via Figma
 * MCP on 2026-07-13 — all bound to variables, no hardcoded values. Top and
 * Bottom padding are the symmetric pair (both 6px, same variable); Left and
 * Right are each distinct (8px vs. 12px — extra right-side room for the
 * Chevron). paddingLeft happens to share its variable with itemSpacing —
 * noted as its own fact, not folded into a Left/Right pair.
 */
export const COMBOBOX_FIGMA_TOKEN_BINDINGS = {
  cornerRadius: "VariableID:2012:9573",
  paddingLeft: "VariableID:2002:2412",
  paddingRight: "VariableID:2002:2413",
  paddingTop: "VariableID:2002:2411",
  paddingBottom: "VariableID:2002:2411",
  itemSpacing: "VariableID:2002:2412",
  fill: "VariableID:2002:2459",
  stroke: "VariableID:2002:2465",
} as const;

/**
 * Known Figma-side limitation, sourced from the component's own description
 * (not a code defect): enabling the Multi-select boolean shows the Chips row
 * but does not automatically hide the plain Value text underneath. Figma's
 * boolean-property model requires a manual per-instance override for this —
 * both design and code need to work around it, not "fix" it in React.
 */
export const COMBOBOX_FIGMA_MULTISELECT_KNOWN_LIMITATION =
  "Enabling Multi-select does not auto-hide the Value text underneath; requires a manual per-instance override (Figma boolean-property constraint, not a code bug).";

/** Icon component used for per-chip removal in the Multi-select anatomy. No "clear all" control exists anywhere in the trigger anatomy. */
export const COMBOBOX_FIGMA_CHIP_REMOVE_ICON = "Icon/XCircle" as const;

/**
 * Confirmed gap (2026-07-13): no open/expanded example frame exists anywhere
 * in the Figma file showing option-list/listbox anatomy (option icons,
 * descriptions, selected indicator, clear-all control). Figma specs only the
 * five closed-trigger states above — never the dropdown panel content. Do
 * not infer or invent option-list anatomy from this file; it does not exist
 * in Figma yet.
 */
export const COMBOBOX_FIGMA_OPTION_LIST_ANATOMY_STATUS = "not-specified-in-figma" as const;

export const COMBOBOX_FIGMA_AUDIT_STATUS = "verified-2026-07-13" as const;
