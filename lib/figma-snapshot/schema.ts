/**
 * AG-1B — normalized Figma snapshot (docs/architecture/agent-readiness.md §21).
 *
 * A snapshot is CAPTURED EVIDENCE of what one exact Figma node contained at
 * one moment. It is not canonical product truth (live Figma is), not a
 * registry claim, and never a parity verdict. It contains no React facts.
 *
 * Facts are split into three blocks so the distinction is structural:
 * - `observed` — read directly from Figma, names preserved exactly.
 * - `derived` — deterministic functions of `observed` only (no other source).
 * - `unknowns` — facts deliberately not captured or not determinable.
 */
import type { FigmaIdentity } from "@/lib/figma-identity";
import type { RawLayout, RawVariableValue } from "@/lib/figma-snapshot/raw-capture";

/**
 * 1.1.0 adds `observed.aliasClosure` (transitive alias targets of the bound
 * variables) and `derived.aliasClosureComplete`. 1.0.0 snapshots remain
 * readable: they carry no closure, so alias chains beyond one hop stay open.
 */
export const FIGMA_SNAPSHOT_SCHEMA_VERSION = "1.1.0";
export const SUPPORTED_FIGMA_SNAPSHOT_SCHEMA_VERSIONS: readonly string[] = ["1.0.0", "1.1.0"];

/** Which variants a fact applies to: every analysed root, or the named variants. */
export type SnapshotScope = "all" | string[];

export type SnapshotComponentProperty = {
  /** Figma's full property key, e.g. "Label#2012:38" (stable property ID). */
  key: string;
  /** Property name as shown in Figma, e.g. "Label". */
  name: string;
  type: string;
  defaultValue: string | boolean | null;
  variantOptions?: string[];
};

export type SnapshotVariant = {
  nodeId: string;
  name: string;
  values: Record<string, string>;
};

export type SnapshotBinding = {
  scope: SnapshotScope;
  path: string;
  property: string;
  variableId: string;
  withinInstance: string | null;
};

export type SnapshotTextStyle = {
  scope: SnapshotScope;
  path: string;
  withinInstance: string | null;
  styleName: string | null;
  mixed: boolean;
};

export type SnapshotNestedInstance = {
  scope: SnapshotScope;
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

export type SnapshotVariable = {
  id: string;
  name: string;
  resolvedType: string;
  collection: string | null;
  /** Keyed by mode name. An alias is recorded as a reference (name + id); follow it through `aliasClosure`. */
  valuesByMode: Record<string, RawVariableValue>;
};

export type FigmaSnapshot = {
  schemaVersion: string;
  /** ISO 8601 UTC. The only field expected to differ between captures of an unchanged node. */
  capturedAt: string;
  capture: {
    method: "figma-plugin-api";
    captureVersion: string;
    fileName: string;
    /** Present only when the alias closure was read in a later read-only pass than the node (`capturedAt`). */
    aliasClosureCapturedAt?: string;
  };
  /** Copied from the registry's `figmaIdentity`; must match it exactly. */
  identity: FigmaIdentity;
  observed: {
    node: {
      id: string;
      name: string;
      type: string;
      pageName: string | null;
      parent: { id: string; type: string; name: string } | null;
      description: string;
    };
    componentProperties: SnapshotComponentProperty[];
    /** Variants of a COMPONENT_SET; empty for a standalone COMPONENT. */
    variants: SnapshotVariant[];
    layouts: Array<{ scope: SnapshotScope; layout: RawLayout }>;
    children: Array<{ scope: SnapshotScope; children: Array<{ name: string; type: string; visible: boolean }> }>;
    variableBindings: SnapshotBinding[];
    textStyles: SnapshotTextStyle[];
    nestedInstances: SnapshotNestedInstance[];
    explicitVariableModes: Array<{ scope: SnapshotScope; collection: string | null; mode: string | null }>;
    variables: SnapshotVariable[];
    collections: Array<{ name: string; modes: string[] }>;
    /**
     * Variables reachable from `variables` through alias values in any mode
     * (excluding the bound variables). Absent in 1.0.0 snapshots.
     */
    aliasClosure?: { variables: SnapshotVariable[]; unresolvedIds: string[] };
  };
  derived: {
    /** Section headings found in the description ("PURPOSE", "TOKENS USED", …), in order. */
    descriptionSections: string[];
    propertyCounts: Record<string, number>;
    variantCount: number;
    /** True when every combination of the variant axes exists as a variant. */
    variantCombinationsComplete: boolean | null;
    /** Collections of directly bound variables (not a full mode-sensitivity analysis). */
    boundCollections: string[];
    /** True when every alias target was resolved (the dependency graph is closed). Absent in 1.0.0 snapshots. */
    aliasClosureComplete?: boolean;
    /** Distinct nested masters; `kind` "icon" follows the Figma "Icon/" naming convention only. */
    nestedComponents: Array<{ mainComponentName: string | null; componentSetName: string | null; kind: "icon" | "component" }>;
  };
  unknowns: Array<{ fact: string; reason: string }>;
};
