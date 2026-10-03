/**
 * The capture-input boundary for AG-1B: the RAW shape produced by the
 * read-only transport (scripts/figma-snapshot/capture-in-figma.js, run inside
 * the Figma plugin runtime). Nothing here is sorted, grouped or derived —
 * that is normalize.ts's job — so any future transport (a Figma plugin, the
 * REST API) only has to produce this shape.
 */

export type RawVariableValue =
  | { alias: string | null; aliasId: string }
  | { r: number; g: number; b: number; a: number }
  | number
  | string
  | boolean
  | null;

export type RawVariable = {
  name: string;
  resolvedType: string;
  collectionId: string;
  collectionName: string | null;
  /** Keyed by mode NAME. An alias is a reference (name + id); the capture script also records each alias target as its own `variables` entry. */
  valuesByMode: Record<string, RawVariableValue>;
};

export type RawCollection = {
  name: string;
  modes: Array<{ modeId: string; name: string }>;
};

export type RawBinding = {
  /** Sibling-disambiguated layer path from the analysed root; "" is the root itself. */
  path: string;
  /** e.g. "topLeftRadius", "fills[0].color", "fills[1].gradientStops[0].color", "effects[0].radius". */
  property: string;
  variableId: string;
  /** Path of the enclosing instance when the bound node lives inside one; null otherwise. */
  withinInstance: string | null;
};

export type RawTextStyleUse = {
  path: string;
  withinInstance: string | null;
  styleName: string | null;
  mixed: boolean;
};

export type RawInstance = {
  path: string;
  withinInstance: string | null;
  visible: boolean;
  mainComponentId: string | null;
  mainComponentName: string | null;
  componentSetId: string | null;
  componentSetName: string | null;
  remote: boolean | null;
  variantProperties: Record<string, string> | null;
};

export type RawLayout = {
  layoutMode: string | null;
  itemSpacing: number | null;
  padding: number[] | null;
  primaryAxisSizingMode: string | null;
  counterAxisSizingMode: string | null;
  primaryAxisAlignItems: string | null;
  counterAxisAlignItems: string | null;
  cornerRadius: number | number[];
  strokeWeight: number | null;
  strokeAlign: string | null;
  clipsContent: boolean | null;
  width: number;
  height: number;
  fillTypes: string[];
  strokeTypes: string[];
  effectTypes: string[];
};

/** One analysed root: a variant of a component set, or the component itself. */
export type RawRoot = {
  id: string;
  name: string;
  variantProperties: Record<string, string> | null;
  /** Collection ID → mode ID, as set on the root itself. */
  explicitVariableModes: Record<string, string>;
  layout: RawLayout;
  children: Array<{ name: string; type: string; visible: boolean }>;
  bindings: RawBinding[];
  textStyles: RawTextStyleUse[];
  instances: RawInstance[];
};

export type RawComponentPropertyDefinition = {
  type: string;
  defaultValue: unknown;
  variantOptions: string[] | null;
};

export type RawTarget = {
  target: { slug: string; fileKey: string; nodeId: string };
  fileKey: string;
  error?: "file-key-mismatch" | "node-not-found";
  node: null | {
    id: string;
    type: string;
    name: string;
    description: string;
    pageName: string | null;
    parent: { id: string; type: string; name: string } | null;
    /** Keyed by Figma's property key (e.g. "Label#2012:38"). */
    componentPropertyDefinitions: Record<string, RawComponentPropertyDefinition>;
    roots: RawRoot[];
  };
};

export type RawFigmaCapture = {
  captureVersion: string;
  fileKey: string;
  fileName: string;
  targets: RawTarget[];
  variables: Record<string, RawVariable | null>;
  collections: Record<string, RawCollection | null>;
};
