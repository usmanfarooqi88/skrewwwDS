import type { FigmaPropertyMapping, FigmaPropertyMappingKind, PilotPropertyMap } from "@/lib/audit/audit-types";

/**
 * AG-1D — explicit Figma-property ↔ React-representation maps for the five
 * Audit Agent pilots. AUDIT INTERPRETATION METADATA ONLY: not canonical product
 * metadata, not compiled into Agent contracts, and never itself a parity claim.
 *
 * Every entry was verified by reading the AG-1B snapshot (property name, type,
 * options) and the current React source named in `verifiedAgainst.sources`.
 * Nothing is inferred from similar names; an entry whose representation is not
 * certain is `kind: "unknown"`. Option labels are mapped explicitly — no case
 * folding happens anywhere except through these maps.
 */

export const PILOT_PROPERTY_MAP_VERSION = "1.0.0";

const CAPTURED_AT = "2026-09-29T10:14:52Z";

export const PILOT_PROPERTY_MAPS: Record<string, PilotPropertyMap> = {
  button: {
    version: PILOT_PROPERTY_MAP_VERSION,
    componentSlug: "button",
    verifiedAgainst: { figmaCapturedAt: CAPTURED_AT, sources: ["components/ui/Button.tsx", "components/ui/button.module.css"] },
    mappings: [
      {
        figmaProperty: "Style",
        kind: "react-prop",
        reactProperty: "variant",
        registryOptionSet: "supportedVariants",
        optionMap: { Primary: "primary", Secondary: "secondary", Danger: "danger" },
        rationale: "ButtonProps.variant selects variantClass[variant]; Figma Style options are the three variant classes.",
      },
      {
        figmaProperty: "Size",
        kind: "react-prop",
        reactProperty: "size",
        registryOptionSet: "supportedSizes",
        optionMap: { Small: "sm", Medium: "md", Large: "lg" },
        rationale: "ButtonProps.size selects sizeClass (sm/md/lg).",
      },
      {
        figmaProperty: "State",
        kind: "css-state",
        states: "Hover=:hover, Pressed=:active, Focused=:focus-visible, Disabled=:disabled / [aria-disabled=true]",
        rationale: "button.module.css styles each State option with a pseudo-class or attribute selector; there is no state prop.",
      },
      { figmaProperty: "Label", kind: "children", rationale: "ButtonProps.children is the rendered label." },
      {
        figmaProperty: "Show leading icon",
        kind: "presence",
        reactProperty: "leadingIcon",
        rationale: "Button renders the leading icon slot only when leadingIcon is provided.",
      },
      {
        figmaProperty: "Leading Icon",
        kind: "react-prop",
        reactProperty: "leadingIcon",
        rationale: "The swapped icon instance corresponds to the ReactNode passed as leadingIcon.",
      },
      {
        figmaProperty: "Show trailing icon",
        kind: "presence",
        reactProperty: "trailingIcon",
        rationale: "Button renders the trailing icon slot only when trailingIcon is provided.",
      },
      {
        figmaProperty: "Trailing Icon",
        kind: "react-prop",
        reactProperty: "trailingIcon",
        rationale: "The swapped icon instance corresponds to the ReactNode passed as trailingIcon.",
      },
    ],
  },

  "text-input": {
    version: PILOT_PROPERTY_MAP_VERSION,
    componentSlug: "text-input",
    verifiedAgainst: {
      figmaCapturedAt: CAPTURED_AT,
      sources: ["components/ui/TextInput.tsx", "components/ui/TextInputControl.tsx", "components/ui/text-input.module.css"],
    },
    mappings: [
      {
        figmaProperty: "Size",
        kind: "react-prop",
        reactProperty: "size",
        registryOptionSet: "supportedSizes",
        optionMap: { Small: "sm", Medium: "md", Large: "lg" },
        rationale: "TextInputControl size selects sizeClass (sm/md/lg).",
      },
      {
        figmaProperty: "State",
        kind: "css-state",
        states: 'Hover=:hover, Focused=:focus-visible, Error=[aria-invalid="true"] (set from the error prop), Disabled=:disabled',
        rationale: "text-input.module.css styles each State option with a selector; Error is an attribute state TextInput derives from `error`, not a state prop.",
      },
      {
        figmaProperty: "Value",
        kind: "unknown",
        rationale: "Figma shows field text; React accepts native value / defaultValue / placeholder attributes. Which one Value models is not determinable.",
      },
      {
        figmaProperty: "Show leading icon",
        kind: "presence",
        reactProperty: "leadingIcon",
        rationale: "TextInputControl renders the leading slot only when leadingIcon is provided.",
      },
      {
        figmaProperty: "Leading Icon",
        kind: "react-prop",
        reactProperty: "leadingIcon",
        rationale: "The swapped icon instance corresponds to the ReactNode passed as leadingIcon.",
      },
      {
        figmaProperty: "Show trailing icon",
        kind: "presence",
        reactProperty: "trailingIcon",
        rationale: "TextInputControl renders the trailing slot only when trailingIcon (or trailingAction) is provided.",
      },
      {
        figmaProperty: "Trailing Icon",
        kind: "react-prop",
        reactProperty: "trailingIcon",
        rationale: "The swapped icon instance corresponds to the ReactNode passed as trailingIcon.",
      },
    ],
  },

  alert: {
    version: PILOT_PROPERTY_MAP_VERSION,
    componentSlug: "alert",
    verifiedAgainst: { figmaCapturedAt: CAPTURED_AT, sources: ["components/ui/Alert.tsx", "components/ui/internal/FeedbackSurface.tsx"] },
    mappings: [
      {
        figmaProperty: "Type",
        kind: "react-prop",
        reactProperty: "type",
        registryOptionSet: "supportedVariants",
        optionMap: { Info: "info", Success: "success", Warning: "warning", Error: "error" },
        rationale: "AlertProps.type is passed to FeedbackSurface as status.",
      },
      { figmaProperty: "Title", kind: "react-prop", reactProperty: "title", rationale: "AlertProps.title is rendered as the title paragraph." },
      {
        figmaProperty: "Description",
        kind: "react-prop",
        reactProperty: "description",
        rationale: "AlertProps.description is rendered as the body (FeedbackSurface children).",
      },
      {
        figmaProperty: "Show close",
        kind: "react-prop",
        reactProperty: "dismissible",
        rationale: "FeedbackSurface renders the close button only when dismissible is true (boolean ↔ boolean).",
      },
    ],
  },

  dialog: {
    version: PILOT_PROPERTY_MAP_VERSION,
    componentSlug: "dialog",
    verifiedAgainst: { figmaCapturedAt: CAPTURED_AT, sources: ["components/ui/Dialog.tsx"] },
    mappings: [
      { figmaProperty: "Title", kind: "compound-child", exportName: "DialogTitle", rationale: "The title is composed as <DialogTitle> children, not a Dialog prop." },
      { figmaProperty: "Body", kind: "compound-child", exportName: "DialogBody", rationale: "The body is composed as <DialogBody> children, not a Dialog prop." },
    ],
  },

  // Chart Card's Figma master exposes no component properties (state, title and
  // actions are owned by the nested Chart Card Content), so the map is empty.
  "chart-card": {
    version: PILOT_PROPERTY_MAP_VERSION,
    componentSlug: "chart-card",
    verifiedAgainst: { figmaCapturedAt: CAPTURED_AT, sources: ["components/ui/ChartCard.tsx"] },
    mappings: [],
  },
};

const KINDS: readonly FigmaPropertyMappingKind[] = ["react-prop", "children", "presence", "css-state", "compound-child", "unsupported", "unknown"];
const IDENTIFIER = /^[A-Za-z_$][\w$-]*$/;
const EXPORT_NAME = /^[A-Z][A-Za-z0-9]*$/;

/** Schema validation for a property map. Returns problems; empty means valid. */
export function validatePropertyMap(map: PilotPropertyMap, slug: string): string[] {
  const problems: string[] = [];
  if (map.componentSlug !== slug) problems.push(`map is for "${map.componentSlug}", not "${slug}"`);
  if (!map.version) problems.push("version is required");
  if (!map.verifiedAgainst?.figmaCapturedAt) problems.push("verifiedAgainst.figmaCapturedAt is required");
  if (!Array.isArray(map.verifiedAgainst?.sources) || map.verifiedAgainst.sources.length === 0) problems.push("verifiedAgainst.sources is required");
  const seen = new Set<string>();
  for (const mapping of map.mappings as FigmaPropertyMapping[]) {
    const label = `"${mapping.figmaProperty}"`;
    if (!mapping.figmaProperty) problems.push("figmaProperty is required");
    if (seen.has(mapping.figmaProperty)) problems.push(`duplicate figmaProperty ${label}`);
    seen.add(mapping.figmaProperty);
    if (!KINDS.includes(mapping.kind)) {
      problems.push(`${label}: unknown kind "${(mapping as { kind: string }).kind}"`);
      continue;
    }
    if (!mapping.rationale) problems.push(`${label}: rationale is required`);
    if (mapping.kind === "react-prop" || mapping.kind === "presence") {
      if (!IDENTIFIER.test(mapping.reactProperty)) problems.push(`${label}: reactProperty "${mapping.reactProperty}" is not an identifier`);
    }
    if (mapping.kind === "react-prop") {
      if (Boolean(mapping.registryOptionSet) !== Boolean(mapping.optionMap)) problems.push(`${label}: registryOptionSet and optionMap go together`);
      if (mapping.optionMap && Object.keys(mapping.optionMap).length === 0) problems.push(`${label}: optionMap is empty`);
    }
    if (mapping.kind === "compound-child" && !EXPORT_NAME.test(mapping.exportName)) problems.push(`${label}: exportName "${mapping.exportName}" is not an export name`);
    if (mapping.kind === "unsupported" && !mapping.sourceRef) problems.push(`${label}: unsupported needs a recorded sourceRef`);
    if (mapping.kind === "css-state" && !mapping.states) problems.push(`${label}: css-state needs a states description`);
  }
  return problems;
}
