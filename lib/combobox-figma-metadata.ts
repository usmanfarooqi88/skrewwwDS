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

/**
 * Component properties. `multiSelect` was removed from the Figma component
 * on 2026-07-15 (see COMBOBOX_FIGMA_OPTION_LIST_ANATOMY_STATUS below) —
 * confirmed no corresponding capability ever existed in Combobox.tsx (single
 * string `value`, no array, no `multiple` prop). The Figma property was
 * documenting a capability that was never built; this brings Figma in line
 * with the registry, which already describes Combobox as single-select.
 */
export const COMBOBOX_FIGMA_COMPONENT_PROPERTIES = {
  value: { type: "TEXT", default: "Select options" },
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
 * Demo frame "Combobox (example — open)", confirmed via direct Figma
 * property inspection on 2026-07-15: a trigger (Focused state) + listbox
 * panel (COMBOBOX_FIGMA_LISTBOX_NODE_ID) with 5 option rows demonstrating
 * default / active-hover / selected / default / disabled states.
 */
export const COMBOBOX_FIGMA_OPEN_EXAMPLE_NODE_ID = "2113:2";

/** Listbox panel inside the open-example demo frame, confirmed 2026-07-15. */
export const COMBOBOX_FIGMA_LISTBOX_NODE_ID = "2113:10";

/**
 * The 5 option rows inside the listbox panel, confirmed 2026-07-15, in
 * order: default, active-hover, selected, default, disabled. Anatomy is
 * genuinely minimal — plain label text only, no icon, no description —
 * matching ComboboxOption's real type ({ value, label, disabled? }) exactly.
 */
export const COMBOBOX_FIGMA_OPTION_ROW_NODE_IDS = [
  "2113:1149",
  "2113:1151",
  "2113:1153",
  "2113:1155",
  "2113:1157",
] as const;

/**
 * Option master (2026-08-30). Canonical selectable-row contract:
 * Forms/Combobox Option 2740:554. Variants: Default 2740:544, Hover 2740:546,
 * Active 2740:548, Selected 2740:550, Disabled 2740:552. Rows use
 * component/menu/item-hover (VariableID:2142:210); the panel owns Glass blur.
 */
export const COMBOBOX_FIGMA_OPTION_MASTER_NODE_ID = "2740:554";
export const COMBOBOX_FIGMA_LISTBOX_PANEL_MASTER_NODE_ID = "2181:1173";

/**
 * Confirmed present (2026-07-15) — option-list anatomy exists. 2026-08-30
 * closed the selected-surface mapping: Hover/Active/Selected reuse
 * component/menu/item-hover via --menu-item-hover-surface. Selected keeps
 * Medium 500 + shared Gradient overlay. Active keeps semantic/focus-ring.
 * No checkmark. Panel owns Glass blur 16. See COMBOBOX_FIGMA_SELECTED_SURFACE_TOKEN_GAP.
 */
export const COMBOBOX_FIGMA_OPTION_LIST_ANATOMY_STATUS = "confirmed-present" as const;

/**
 * Closed 2026-08-30. React no longer maps selected/active option fills through
 * semantic/surface/subtle or /elevated. Both aliases now target
 * --menu-item-hover-surface (Figma component/menu/item-hover).
 * semantic/surface/subtle was not added to Figma.
 */
export const COMBOBOX_FIGMA_SELECTED_SURFACE_TOKEN_GAP =
  "CLOSED 2026-08-30 — --combobox-option-selected-surface and --combobox-option-active-surface alias --menu-item-hover-surface (component/menu/item-hover). semantic/surface/subtle was not added to Figma.";

export const COMBOBOX_FIGMA_AUDIT_STATUS = "verified-2026-08-30" as const;
