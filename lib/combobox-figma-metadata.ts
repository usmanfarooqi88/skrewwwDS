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
 * Confirmed present (2026-07-15) — corrects the 2026-07-13 "not specified"
 * finding. A new demo frame (COMBOBOX_FIGMA_OPEN_EXAMPLE_NODE_ID) now shows
 * option-list/listbox anatomy directly, matching combobox.module.css's real
 * CSS: .option (transparent, semantic/text/primary), .optionActive
 * (semantic/surface/elevated background + 2px inset outline using
 * semantic/focus-ring), .optionSelected (font-weight 500 — see
 * COMBOBOX_FIGMA_SELECTED_SURFACE_TOKEN_GAP below for the background),
 * .optionDisabled (semantic/text/disabled). The clear-all control remains
 * absent from the trigger anatomy — that finding is unchanged.
 */
export const COMBOBOX_FIGMA_OPTION_LIST_ANATOMY_STATUS = "confirmed-present" as const;

/**
 * Gap found 2026-07-15, not fixed — a separate decision for later, not part
 * of this sync. Code's .optionSelected rule references
 * --combobox-option-selected-surface: var(--semantic-surface-subtle), but
 * semantic/surface/subtle does not exist in Figma's variable set (confirmed
 * via full search — only semantic/surface/default, /elevated, /glass exist
 * there). The open-example demo's "selected" row therefore has no
 * background fill; the font-weight-500 distinction (which does exist in
 * code) is the only visual signal in the Figma reference. Resolve later by
 * either adding the missing Figma variable or renaming the CSS custom
 * property to an existing token — do not silently pick one here.
 */
export const COMBOBOX_FIGMA_SELECTED_SURFACE_TOKEN_GAP =
  "semantic/surface/subtle (used by --combobox-option-selected-surface in combobox.module.css) has no corresponding Figma variable — confirmed via full search 2026-07-15.";

export const COMBOBOX_FIGMA_AUDIT_STATUS = "verified-2026-07-15" as const;
