/**
 * Archival evidence from the locked Skrewww Figma source. This file records
 * facts that the component registry intentionally does not: exact master and
 * variable IDs, mode-resolved values, verified scope, and absent evidence.
 * It is not a claim of full Layer 3 or full design-system parity.
 */

export const FIGMA_SOURCE = {
  fileName: "Skrewww - Design System",
  fileKey: "U6KUuNf7DF4CP9QBOkLSUx",
  fileUrl: "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System",
  lockedSourceOfTruth: true,
  auditDate: "2026-08-14",
} as const;

export const SHARED_SURFACE_VARIABLES = {
  collectionId: "2057:10",
  content: {
    name: "component/surface/content",
    id: "VariableID:2057:1529",
    resolved: { flat: "#FFFFFF", gradient: "#FFFFFF", glass: "#17181B" },
  },
  blur: {
    name: "component/surface/blur",
    id: "VariableID:2057:13",
    resolved: { flat: "0px", gradient: "0px", glass: "16px" },
  },
  disabledOpacity: {
    name: "opacity/disabled",
    id: "VariableID:2012:7105",
    resolved: "40%",
  },
} as const;

export const GRADIENT_FOUNDATION_EVIDENCE = {
  verifiedAt: "2026-08-14",
  variables: {
    start: {
      name: "component/surface/gradient-overlay-start",
      id: "VariableID:2329:2914",
      resolved: { flat: "transparent", gradient: "#FFFFFF14", glass: "transparent" },
    },
    end: {
      name: "component/surface/gradient-overlay-end",
      id: "VariableID:2329:2915",
      resolved: { flat: "transparent", gradient: "#0000000A", glass: "transparent" },
    },
  },
  geometry: {
    css: "linear-gradient(90deg, start 0%, end 100%)",
    figmaTransform: [[1, 0, 0], [0, 1, 0]],
    direction: "left-to-right",
  },
  architecture: {
    composition: "existing semantic/base background-color plus one additive lightness overlay",
    baseFillPreserved: true,
    bordersUnchanged: true,
    focusIndependent: true,
    shapeIndependent: true,
    directionalApi: false,
    animation: false,
  },
  participation: {
    yes: [
      "resting surfaces",
      "persistent Selected",
      "persistent Current",
      "persistent Active",
      "File Upload Empty/Filled/Error",
    ],
    no: [
      "transient list/navigation Hover",
      "File Upload Dragging/Disabled",
      "Flat-only Table",
    ],
  },
  surfaceVariableClassificationDeferred: [
    "component/surface/fill (VariableID:2057:11): Flat aliases semantic/surface/default, Gradient aliases VariableID:2002:2391, and Glass is raw #FFFFFF1F",
    "component/surface/fill-secondary (VariableID:2057:12): Flat aliases semantic/surface/default, Gradient aliases VariableID:2002:2393, and Glass is raw #FFFFFF1F",
  ],
  deferred: [
    "directional or angle API",
    "radial Gradient",
    "animated Gradient",
    "component-specific arbitrary Gradient recipes",
  ],
} as const;

export const GLASS_PARITY_BATCH_1_EVIDENCE = {
  verifiedAt: "2026-08-14",
  architecture: {
    rule: "Glass translucency and blur follow component role; not every Glass surface uses blur",
    inputAndControlSurfaces: "translucent component surface plus 16px blur",
    navigationHighlights: "20% white translucent highlight with no blur",
    foundationTokensChanged: false,
    gradientFoundationChanged: false,
  },
  creditCardField: {
    nodeIds: ["2024:2710", "2024:2711", "2024:2712", "2024:2713"],
    surface: {
      name: "component/text-input/surface",
      id: "VariableID:2128:1862",
      resolved: { flat: "#FFFFFF", gradient: "#FFFFFF", glass: "rgba(255,255,255,0.12)" },
    },
    blur: { name: "component/surface/blur", id: "VariableID:2057:13" },
    reactEquivalent: "No distinct public React Credit Card Field",
  },
  dropdownTrigger: {
    nodeIds: ["2025:3339", "2025:3340", "2025:3341", "2025:3342"],
    surface: {
      name: "component/button/secondary/background",
      id: "VariableID:2127:571",
      resolved: { flat: "#FFFFFF", gradient: "#FFFFFF", glass: "rgba(255,255,255,0.12)" },
    },
    blur: { name: "component/surface/blur", id: "VariableID:2057:13" },
    reactEquivalent: "MenuTrigger composition using the existing Secondary Button contract",
  },
  sidebarNavItem: {
    nodeIds: { hover: "2025:3512", active: "2025:3513" },
    reactEquivalent: "Direct: components/SidebarNavLink.tsx",
    surface: {
      name: "component/menu/item-hover",
      id: "VariableID:2142:210",
      resolved: { flat: "#F7F7F8", gradient: "#F7F7F8", glass: "#FFFFFF33" },
    },
    blur: "none",
    gradient: { hover: false, active: true },
    shape: {
      contract: "participates in the shared control Shape architecture",
      radius: "component/radius/control",
      representativeResolved: { sharp: "0px", rounded: "6px", squircle: "8px" },
    },
  },
} as const;

export const BUTTON_FIGMA_EVIDENCE = {
  componentSetId: "2012:7752",
  representativeMasters: {
    primaryMediumDefault: "2012:7712",
    dangerMediumDefault: "2012:7742",
  },
  /** Medium-size per-state masters, confirmed 2026-08-11. */
  stateMasters: {
    primaryMediumHover: "2012:7713",
    primaryMediumPressed: "2012:7714",
    primaryMediumFocused: "2012:7715",
    dangerMediumHover: "2012:7743",
    dangerMediumPressed: "2012:7744",
    dangerMediumFocused: "2012:7745",
    dangerMediumDisabled: "2012:7746",
  },
  repairedFocusContract: {
    repairedAcrossAllVariants: 45,
    representativeFocusedNodeIds: {
      primaryMedium: "2012:7715",
      dangerMedium: "2012:7745",
    },
    token: {
      name: "semantic/focus-ring",
      id: "VariableID:2002:2472",
      resolved: { light: "#6C4CF2", dark: "#8770F6" },
    },
    stroke: { width: "2px", alignment: "OUTSIDE", offset: "0px", surfaceDependent: false },
    glassRim: { width: "1px", alignment: "INSIDE", independentFromFocus: true },
  },
  verifiedSizes: ["Small", "Medium", "Large"],
  primary: {
    verifiedStates: ["Default", "Hover", "Pressed", "Focused", "Disabled"],
    background: {
      default: {
        name: "component/button/primary/background",
        id: "VariableID:2127:569",
        resolved: { flat: "#6C4CF2", gradient: "#6C4CF2", glass: "#6C4CF2 / 18%" },
      },
      hover: {
        name: "component/button/primary/background-hover",
        id: "VariableID:2127:1381",
        resolved: { flat: "#5638D6", gradient: "#5638D6", glass: "#5638D63D (24%)" },
      },
      pressed: {
        name: "component/button/primary/background-pressed",
        id: "VariableID:2127:1382",
        resolved: { flat: "#4229AD", gradient: "#4229AD", glass: "#4229AD4D (30%)" },
      },
    },
    content: SHARED_SURFACE_VARIABLES.content,
  },
  secondary: {
    verifiedScope: "Glass surface treatment across Default, Hover, Pressed, Focused, and Disabled masters",
    background: {
      name: "component/button/secondary/background",
      id: "VariableID:2127:571",
      resolved: {
        glassDefaultFocusedDisabledBase: "#FFFFFF / 12%",
        glassHoverPressed: "#FFFFFF / 20%",
      },
    },
    content: "semantic/text/primary",
    blur: SHARED_SURFACE_VARIABLES.blur,
    disabled: "Normal master bindings with 40% whole-component opacity; no alternate disabled surface/content substitution",
  },
  danger: {
    verifiedStates: ["Default", "Hover", "Pressed", "Focused", "Disabled"],
    background: {
      default: {
        name: "component/button/danger/background",
        id: "VariableID:2127:570",
        resolved: { flat: "#E5484D", gradient: "#E5484D", glass: "#E5484D / 58%" },
      },
      hover: {
        name: "component/button/danger/background-hover",
        id: "VariableID:2127:1383",
        resolved: { flat: "#CC3B37", gradient: "#CC3B37", glass: "#CC3B37A3 (64%)" },
      },
      pressed: {
        name: "component/button/danger/background-pressed",
        id: "VariableID:2127:1384",
        resolved: { flat: "#B3261E", gradient: "#B3261E", glass: "#B3261EB2 (70%)" },
      },
    },
    content: SHARED_SURFACE_VARIABLES.content,
  },
  /**
   * These three-stop gradient families drive only the always-on Glass rim,
   * drawn strokeAlign INSIDE. The repaired Focused masters independently
   * use the solid semantic/focus-ring contract recorded above.
   */
  borderGradient: {
    width: "1px",
    strokeAlignNonFocused: "INSIDE",
    stopPositions: [0, 0.231, 0.462],
    /**
     * Raw Figma handles at full precision, normalized PER-AXIS to the node
     * bounding box (x / width, y / height) as [start, end, width].
     */
    gradientHandlePositions: [
      [0, 0],
      [0.3022670192495956, 0.9571788442445038],
      [-0.4785894221222519, 0.1511335096247978],
    ],
    /**
     * Shipped CSS is a PRACTICAL APPROXIMATION, not exact parity. Per-axis
     * normalization makes the true angle aspect-ratio dependent, and Button
     * is hug-content, so its width tracks its label — the real Figma angle
     * drifts ~29 degrees between a 113px and a 400px Medium button.
     * Reproducing that needs width-dependent runtime geometry, which is not
     * justified for a decorative 1px rim. One fixed angle is shipped,
     * derived for the Medium master box (113x36):
     *   dx = 0.3022670192495956 * 113 = 34.156
     *   dy = 0.9571788442445038 * 36  = 34.458
     *   atan2(dx, -dy) = 180 - atan(34.156/34.458) = 135.25deg
     * Practical CSS stops are 0% / 23.1% / 46.2%, with the end colour
     * repeated at 100% so it holds after 46.2%.
     */
    shippedCss: {
      angleDegrees: 135.25,
      stopPercentages: [0, 23.1, 46.2, 100],
      basis: "Medium master box 113x36",
      classification: "practical approximation — NOT exact mathematical parity",
    },
    surfaceResolution: {
      flat: ["transparent", "transparent", "transparent"],
      gradient: ["transparent", "transparent", "transparent"],
    },
    primary: [
      { name: "component/button/primary/border", id: "VariableID:2270:487", glass: "#FFFFFF / 80%" },
      { name: "component/button/primary/border-mid", id: "VariableID:2270:488", glass: "#6C4CF2 / 60%" },
      { name: "component/button/primary/border-end", id: "VariableID:2270:489", glass: "#6C4CF2 / 15%" },
    ],
    danger: [
      { name: "component/button/danger/border", id: "VariableID:2264:459", glass: "#FFFFFF / 80%" },
      { name: "component/button/danger/border-mid", id: "VariableID:2271:487", glass: "#E5484D / 60%" },
      { name: "component/button/danger/border-end", id: "VariableID:2271:488", glass: "#E5484D / 15%" },
    ],
  },
  shape: {
    rounded: "4px",
    squircleRadius: "8px",
    figmaSquircleCornerSmoothing: 0.6000000238,
  },
  disabled: "Verified masters retain their base bindings and use 40% whole-component opacity",
  unverified: ["Exact React Squircle polygon equivalence to Figma corner smoothing 0.6000000238"],
  designReviewItems: [
    "Primary Glass Hover dark #17181B content can appear muddy over complex backgrounds. Current behavior matches Figma and is not a React parity defect.",
  ],
  closingCommit: "e0969f8f42a489a3d8c7624d00d795ba0c8cf166",
} as const;

export const AVATAR_FIGMA_EVIDENCE = {
  componentSetId: "2044:26027",
  masters: { small: "2044:26024", medium: "2044:26025", large: "2044:26026" },
  bindings: {
    background: { name: "component/button/primary/background", id: "VariableID:2127:569" },
    content: SHARED_SURFACE_VARIABLES.content,
    blur: SHARED_SURFACE_VARIABLES.blur,
    radius: { name: "radius/full", id: "VariableID:2002:2432", resolved: "9999px" },
    typography: {
      small: { id: "VariableID:2002:2436", resolved: "12px" },
      medium: { id: "VariableID:2002:2437", resolved: "14px" },
      large: { id: "VariableID:2002:2438", resolved: "16px" },
    },
  },
  verified: {
    small: "24x24 / 12px",
    medium: "32x32 / 14px",
    large: "48x48 / 16px",
    stroke: "none",
    shape: "9999px and circular under every global Shape mode",
    background: { flat: "#6C4CF2", gradient: "#6C4CF2", glass: "#6C4CF2 / 18%" },
    content: { flat: "#FFFFFF", gradient: "#FFFFFF", glass: "#17181B" },
    blur: { flat: "0px", gradient: "0px", glass: "16px" },
  },
  unverified: ["Image fallback visual parity", "Icon fallback visual parity", "Hover", "Pressed", "Focused", "Disabled"],
  closingCommit: "61b18bc9eab2428e8e2807daf884625dc6d915b1",
} as const;

export const CALENDAR_DAY_FIGMA_EVIDENCE = {
  componentSetId: "2058:2146",
  masters: {
    default: "2058:2141",
    today: "2058:2142",
    selected: "2058:2143",
    disabled: "2058:2144",
    outside: "2058:2145",
  },
  sharedGeometry: { size: "32x32", fontSize: "14px", radius: "9999px (radius/full)" },
  states: {
    default: { fill: "none", stroke: "none", content: "semantic/text/primary (VariableID:2002:2462) -> #17181B" },
    today: {
      fill: "none",
      content: "#17181B",
      stroke: "semantic/action/primary (VariableID:2002:2467) -> #6C4CF2, 1.5px INSIDE",
      separateIndicatorDot: false,
    },
    selected: {
      background: { name: "component/button/primary/background", id: "VariableID:2127:569", resolved: { flat: "#6C4CF2", gradient: "#6C4CF2", glass: "#6C4CF2 / 18%" } },
      content: SHARED_SURFACE_VARIABLES.content,
      blur: SHARED_SURFACE_VARIABLES.blur,
      stroke: "none",
    },
    disabled: {
      content: "semantic/text/disabled (VariableID:2002:2464) -> #A0A3AC",
      opacity: "opacity/disabled (VariableID:2012:7105) -> 40% whole-component",
      fill: "none",
      stroke: "none",
    },
    outside: { content: "semantic/text/disabled (VariableID:2002:2464) -> #A0A3AC", opacity: "100%", fill: "none", stroke: "none" },
  },
  codeOnlyUnverified: ["Range Start", "Range End", "Range Middle", "Range preview"],
  unverified: ["Hover", "Selected Hover", "Pressed", "Focused"],
  closingCommit: "68ca733af663d819e3d9a556713ce13f1eabd352",
} as const;

export const PAGINATION_PAGE_ITEM_FIGMA_EVIDENCE = {
  componentSetId: "2024:2894",
  masters: { default: "2024:2890", hover: "2024:2891", current: "2024:2892", disabled: "2024:2893" },
  ellipsis: { frame: "2024:2913", text: "2024:2914" },
  geometry: { size: "32x32", horizontalPadding: "0px", fontSize: "16px", currentWeight: 700, otherWeight: 400, representedTrailGap: "4px" },
  states: {
    default: { fill: "none", stroke: "none", blur: "none", content: SHARED_SURFACE_VARIABLES.content },
    hover: {
      background: { name: "component/menu/item-hover", id: "VariableID:2142:210", resolved: { flat: "#F7F7F8", gradient: "#F7F7F8", glass: "#FFFFFF / 20%" } },
      content: { name: "semantic/text/primary", id: "VariableID:2002:2462", resolved: "#17181B" },
      blur: SHARED_SURFACE_VARIABLES.blur,
      stroke: "none",
    },
    current: {
      background: { name: "component/button/primary/background", id: "VariableID:2127:569", resolved: { flat: "#6C4CF2", gradient: "#6C4CF2", glass: "#6C4CF2 / 18%" } },
      content: SHARED_SURFACE_VARIABLES.content,
      blur: SHARED_SURFACE_VARIABLES.blur,
      stroke: "none",
    },
    disabled: {
      content: "semantic/text/disabled (VariableID:2002:2464) -> #A0A3AC",
      opacity: "opacity/disabled (VariableID:2012:7105) -> 40%",
      fill: "none",
      stroke: "none",
    },
    ellipsis: {
      content: { name: "component/surface/content-muted", id: "VariableID:2259:2", resolved: { flat: "#A0A3AC", gradient: "#A0A3AC", glass: "#17181B" } },
    },
  },
  shape: {
    name: "component/radius/control",
    id: "VariableID:2012:9573",
    resolved: { sharp: "0px", rounded: "4px", pill: "9999px", squircle: "8px" },
  },
  unverified: ["Pressed Page Item", "Focused Page Item", "Responsive/compact composition", "First/Last controls", "Exact React Squircle polygon equivalence to Figma corner smoothing 0.6000000238"],
  closingCommit: "5cfb4e6",
} as const;

export const MENU_PANEL_FIGMA_EVIDENCE = {
  sectionId: "2024:3057",
  panelComponentId: "2181:216",
  menuItemComponentSetId: "2024:3015",
  status: "private Figma building block; not automatically a public React component",
  surface: { name: "component/menu/panel-surface", id: "VariableID:2142:208" },
  border: { name: "component/menu/panel-border", id: "VariableID:2142:209", width: "1px", alignment: "INSIDE" },
  blur: { name: "component/surface/blur", id: "VariableID:2057:13", resolved: { flat: "0px", gradient: "0px", glass: "16px" } },
  futureCleanup: [
    "Dropdown Menu panel adoption/consolidation",
    "Combobox Listbox Panel token-family consolidation",
    "Command Menu private floating-panel alignment",
  ],
} as const;

export const LAYER3_SURFACE_BATCH_A_EVIDENCE = {
  verifiedAt: "2026-08-13",
  masters: {
    dialog: "2044:25869",
    drawer: "2044:25965",
    accordionSet: "2044:25807",
    accordionCollapsed: "2044:25805",
    accordionExpanded: "2044:25806",
    emptyState: "2044:26158",
  },
  sharedContract: {
    surface: {
      name: "component/card/surface",
      id: "VariableID:2128:1499",
      resolved: { flat: "#FFFFFF", gradient: "#FFFFFF", glass: "#FFFFFF1F (12%)" },
    },
    border: {
      name: "component/card/border",
      id: "VariableID:2128:1500",
      resolved: { flat: "#DFE0E4", gradient: "#DFE0E4", glass: "#FFFFFF3D (24%)" },
    },
    dialogBorderHighlights: [
      { name: "component/card/border-highlight-1", id: "VariableID:2268:218", glass: "#FFFFFFCC (80%)" },
      { name: "component/card/border-highlight-2", id: "VariableID:2268:219", glass: "#DFE0E480 (50%)" },
      { name: "component/card/border-highlight-3", id: "VariableID:2268:220", glass: "#DFE0E426 (15%)" },
    ],
    borderGeometry: "1px INSIDE; Dialog linear stops 0% / 50% / 100%",
    blur: SHARED_SURFACE_VARIABLES.blur,
    contentPrimary: "semantic/text/primary (VariableID:2002:2462)",
    contentMuted: {
      name: "component/surface/content-muted",
      id: "VariableID:2259:2",
      resolved: { flat: "#A0A3AC", gradient: "#A0A3AC", glass: "#17181B" },
    },
  },
  componentContracts: {
    dialog: "Card surface + three-stop Card highlight border + blur; no live drop shadow",
    drawer: "Card surface + blur; no bound border and no live drop shadow",
    accordion: "Card surface + Card border + blur in both variants; no elevation",
    emptyState: "Card surface + blur; no border and no elevation",
  },
  reactParity: {
    status: "Batch A implementation closed by focused browser verification",
    scope: ["Dialog", "Drawer", "Accordion", "Empty State"],
    explicitExclusion: "Does not claim full Layer 3 Surface completion",
    // React semantic/icon/muted and semantic/border/strong both now resolve
    // #A0A3AC, matching live Figma Light — no remaining drift to report.
    broaderTokenDrift: [],
  },
} as const;

export const LAYER3_SURFACE_BATCH_B_EVIDENCE = {
  verifiedAt: "2026-08-13",
  componentSets: { toast: "2034:25468", alert: "2034:25402" },
  masters: {
    toast: { info: "2034:25464", success: "2034:25465", warning: "2034:25466", error: "2034:25467" },
    alert: { info: "2034:25398", success: "2034:25399", warning: "2034:25400", error: "2034:25401" },
  },
  shared: {
    blur: SHARED_SURFACE_VARIABLES.blur,
    contentPrimary: "semantic/text/primary (VariableID:2002:2462)",
    contentMuted: {
      name: "component/surface/content-muted",
      id: "VariableID:2259:2",
      resolved: { flat: "#A0A3AC", gradient: "#A0A3AC", glass: "#17181B" },
    },
    opacity: "100% on every master; no Disabled or alternate-opacity variants",
    elevation: "No live drop shadow on any Toast or Alert master",
  },
  toast: {
    contract: "Card surface + Card border + 16px Glass blur; status changes icon semantics only",
    surface: { name: "component/card/surface", id: "VariableID:2128:1499", resolved: { flat: "#FFFFFF", gradient: "#FFFFFF", glass: "#FFFFFF1F (12%)" } },
    border: { name: "component/card/border", id: "VariableID:2128:1500", geometry: "1px INSIDE", resolved: { flat: "#DFE0E4", gradient: "#DFE0E4", glass: "#FFFFFF3D (24%)" } },
    message: "semantic/text/primary",
    close: "component/surface/content-muted",
  },
  alert: {
    contract: "Feedback-specific tinted surface + 16px Glass blur; no border",
    surfaces: {
      info: { name: "component/feedback/info/surface", id: "VariableID:2140:2", resolved: { flat: "#DCEEFE", gradient: "#DCEEFE", glass: "#DCEEFE73 (45%)" } },
      success: { name: "component/feedback/success/surface", id: "VariableID:2140:3", resolved: { flat: "#DFF5E6", gradient: "#DFF5E6", glass: "#DFF5E673 (45%)" } },
      warning: { name: "component/feedback/warning/surface", id: "VariableID:2140:4", resolved: { flat: "#FEF3D6", gradient: "#FEF3D6", glass: "#FEF3D673 (45%)" } },
      danger: { name: "component/feedback/danger/surface", id: "VariableID:2140:5", resolved: { flat: "#FDE2E1", gradient: "#FDE2E1", glass: "#FDE2E173 (45%)" } },
    },
    title: "semantic/text/primary",
    descriptionAndClose: "component/surface/content-muted",
    icons: {
      info: "semantic/feedback/info #3B82F6",
      success: "semantic/feedback/success #30A46C",
      warning: "semantic/feedback/warning #F5A524",
      error: "semantic/action/danger #E5484D",
    },
  },
  reactParity: {
    status: "Batch B implementation closed by focused browser verification",
    architecture: "Shared FeedbackSurface structure with distinct internal Alert and Toast surface roles",
    explicitExclusion: "Does not claim full Layer 3 Surface completion",
  },
} as const;

export const LAYER3_SURFACE_BATCH_C_EVIDENCE = {
  verifiedAt: "2026-08-13",
  fileUpload: {
    componentSet: "2024:2649",
    masters: {
      empty: "2024:2644",
      dragging: "2024:2645",
      error: "2024:2646",
      disabled: "2024:2647",
      filled: "2024:2648",
    },
    normalSurface: {
      name: "component/card/surface",
      id: "VariableID:2128:1499",
      resolved: { flat: "#FFFFFF", gradient: "#FFFFFF", glass: "#FFFFFF1F (12%)" },
      states: ["Empty", "Error", "Disabled", "Filled"],
    },
    normalBorder: {
      name: "component/card/border",
      id: "VariableID:2128:1500",
      resolved: { flat: "#DFE0E4", gradient: "#DFE0E4", glass: "#FFFFFF3D (24%)" },
      geometry: "1.5px INSIDE dashed on Empty/Disabled; 1px INSIDE solid on Filled",
    },
    dragging: {
      surface: { name: "component/file-upload/dragging-surface", id: "VariableID:2145:1371", resolved: { flat: "#F7F7F8", gradient: "#F7F7F8", glass: "#FFFFFF33 (20%)" } },
      border: "semantic/action/primary (VariableID:2002:2467), 1.5px INSIDE dashed",
      content: "semantic/text/primary + semantic/action/primary icon",
    },
    error: {
      master: "2024:2646",
      surface: { name: "component/card/surface", id: "VariableID:2128:1499" },
      border: { name: "semantic/action/danger", id: "VariableID:2002:2468" },
      blur: SHARED_SURFACE_VARIABLES.blur,
      content: "Danger icon/content remains independent from the neutral Card-family base",
      gradient: "Participates through the shared fixed 90deg overlay in Gradient only",
    },
    gradientParticipation: {
      yes: ["Empty", "Filled", "Error"],
      no: ["Dragging", "Disabled"],
    },
    disabled: "Card bindings remain intact; opacity/disabled (VariableID:2012:7105) applies 40% to the component root",
    filled: "Card container with File Row bottom dividers bound to semantic/border/default",
    shared: { blur: SHARED_SURFACE_VARIABLES.blur, contentMuted: "component/surface/content-muted (VariableID:2259:2)" },
    elevation: "No shadow on any master",
    reactFirstBehavior: "React keeps the replacement dropzone visible above the selected-file Card list; file selection/removal semantics are unchanged",
  },
  listItem: {
    componentSet: "2044:26095",
    masters: { default: "2044:26093", hover: "2044:26094" },
    default: "Transparent; no fill, border, blur, or elevation",
    hover: {
      surface: { name: "component/menu/item-hover", id: "VariableID:2142:210", resolved: { flat: "#F7F7F8", gradient: "#F7F7F8", glass: "#FFFFFF33 (20%)" } },
      blur: SHARED_SURFACE_VARIABLES.blur,
      borderAndElevation: "None",
    },
    content: {
      title: "semantic/text/primary (VariableID:2002:2462)",
      subtitleAndMeta: "component/surface/content-muted (VariableID:2259:2)",
      leading: "Nested Avatar retains its own Surface-aware component bindings; no generic leading/trailing icon property exists on these masters",
    },
    radius: "component/radius/control (VariableID:2012:9573)",
  },
  sharedMenuHoverBlastRadius: {
    token: { name: "component/menu/item-hover", id: "VariableID:2142:210", resolved: { flat: "#F7F7F8", gradient: "#F7F7F8", glass: "#FFFFFF33 (20%)" } },
    liveMenuMasters: { hover: "2024:3012", selected: "2024:3013" },
    reactConsumers: ["Menu Item Hover", "List Item Hover", "Tree Item Hover", "Tree Item Selected"],
    verification: "Batch C rendered checks 9/9 PASS; focused Menu behavioral Playwright 14/14 PASS; no deterministic Menu or Tree regression",
  },
  reactParity: {
    status: "Batch C implementation closed by focused browser verification",
    gradientDecision: "Superseded by the Stable-v1 additive fixed-90deg Gradient foundation; transient shared Menu/List hover remains excluded",
    explicitExclusion: "Does not claim full Layer 3 Surface completion",
  },
} as const;

export const TABLE_FIGMA_EVIDENCE = {
  verifiedAt: "2026-08-14",
  canonicalNodes: {
    table: "2321:1964",
    headerRow: "2321:1903",
    bodyRow: "2321:1920",
    cell: "2321:1872",
  },
  historicalExample: {
    nodeId: "2044:26192",
    canonical: false,
  },
  shell: {
    surface: { name: "component/card/surface", id: "VariableID:2128:1499" },
    border: {
      name: "component/card/border",
      id: "VariableID:2128:1500",
      geometry: "1px INSIDE",
    },
    blur: SHARED_SURFACE_VARIABLES.blur,
    radius: { name: "radius/lg", id: "VariableID:2002:2428", resolved: "12px" },
    cornerSmoothing: 0,
    clipping: true,
    padding: "0px",
    gap: "0px",
    elevation: "none",
  },
  rows: {
    geometry: "12px block / 16px inline padding; 16px composition gap",
    header: {
      surface: "semantic/surface/elevated (VariableID:2002:2460)",
      content: "component/surface/content-muted (VariableID:2259:2)",
      typography: "Inter 14px / 700 / 120%",
    },
    body: {
      surface: "semantic/surface/default (VariableID:2002:2459)",
      content: "semantic/text/primary (VariableID:2002:2462)",
      typography: "Inter 14px / 400 / 120%",
    },
    divider: "semantic/border/default (VariableID:2002:2465); omitted after the final body row",
  },
  stableV1: {
    surface: "Flat-only; explicit local Surface mode 2057:0 on shell and row/cell anatomy; no Surface component property",
    shape: "Rounded-only at radius/lg 12px with cornerSmoothing=0; no Shape component property",
    excluded: ["Gradient", "Glass", "Sharp", "Pill", "Squircle", "Brand Shape", "Dark mode"],
  },
  reactMapping:
    "Figma Table / Row / Cell describe visual composition; React preserves native Table, caption, thead/tbody/tfoot, row, th/td, and scroll-area semantics rather than forcing one-to-one exports.",
  pending: [
    "Canonical Caption visual treatment",
    "Canonical Footer visual treatment",
    "Controlled Table Shape mapping",
  ],
} as const;

export const COMPOSITION_ONLY_EVIDENCE = {
  paginationTrail: {
    trail: "2024:2897",
    previous: "2024:2898",
    next: "2024:2917",
    figmaPresentation: "Icon-only Secondary Small Button instances",
    approvedReactDecision: "Preserve textual Previous and Next controls for clarity, accessibility, and existing consumer expectations",
    classification: "Intentional composition divergence; not a parity defect and not canonical Previous/Next Figma parity",
    unverified: ["Previous/Next disabled presentation; no canonical Figma state exists"],
  },
} as const;

export const UNVERIFIED_AREAS = {
  button: BUTTON_FIGMA_EVIDENCE.unverified,
  avatar: AVATAR_FIGMA_EVIDENCE.unverified,
  calendarDay: [...CALENDAR_DAY_FIGMA_EVIDENCE.codeOnlyUnverified, ...CALENDAR_DAY_FIGMA_EVIDENCE.unverified],
  paginationPageItem: PAGINATION_PAGE_ITEM_FIGMA_EVIDENCE.unverified,
  paginationComposition: COMPOSITION_ONLY_EVIDENCE.paginationTrail.unverified,
  table: TABLE_FIGMA_EVIDENCE.pending,
  gradient: GRADIENT_FOUNDATION_EVIDENCE.deferred,
} as const;

export const AUDIT_STATUS = {
  auditDate: "2026-08-14",
  fullLayer3ParityClaimed: false,
  fullDesignSystemParityClaimed: false,
  button: { verifiedScopeClosed: true, closingCommit: BUTTON_FIGMA_EVIDENCE.closingCommit },
  avatar: { verifiedScopeClosed: true, closingCommit: AVATAR_FIGMA_EVIDENCE.closingCommit },
  calendarDay: { verifiedScopeClosed: true, closingCommit: CALENDAR_DAY_FIGMA_EVIDENCE.closingCommit },
  paginationPageItem: { verifiedScopeClosed: true, closingCommit: PAGINATION_PAGE_ITEM_FIGMA_EVIDENCE.closingCommit },
  table: { verifiedStableV1ScopeClosed: true, closingCommit: null },
  gradientFoundation: { implementationCandidate: true, focusedParityValidationPending: true },
  glassParityBatch1: { figmaScopeClosed: true, reactParityCandidate: true, closingCommit: null },
} as const;
