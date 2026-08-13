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
  auditDate: "2026-08-11",
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
} as const;

export const AUDIT_STATUS = {
  auditDate: "2026-08-11",
  fullLayer3ParityClaimed: false,
  fullDesignSystemParityClaimed: false,
  button: { verifiedScopeClosed: true, closingCommit: BUTTON_FIGMA_EVIDENCE.closingCommit },
  avatar: { verifiedScopeClosed: true, closingCommit: AVATAR_FIGMA_EVIDENCE.closingCommit },
  calendarDay: { verifiedScopeClosed: true, closingCommit: CALENDAR_DAY_FIGMA_EVIDENCE.closingCommit },
  paginationPageItem: { verifiedScopeClosed: true, closingCommit: PAGINATION_PAGE_ITEM_FIGMA_EVIDENCE.closingCommit },
} as const;
