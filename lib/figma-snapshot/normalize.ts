/**
 * AG-1B normalization: RawFigmaCapture → FigmaSnapshot. Pure and
 * deterministic: no I/O, no clock (the caller passes `capturedAt`), stable
 * sort order, no React facts, no parity. Identical input (in any array
 * order) yields byte-identical output.
 */
import type { FigmaIdentity } from "@/lib/figma-identity";
import { computeAliasClosure } from "@/lib/figma-snapshot/alias-closure";
import type { RawFigmaCapture, RawRoot } from "@/lib/figma-snapshot/raw-capture";
import {
  FIGMA_SNAPSHOT_SCHEMA_VERSION,
  type FigmaSnapshot,
  type SnapshotScope,
} from "@/lib/figma-snapshot/schema";

export class FigmaSnapshotError extends Error {}

/** Locale-independent string order, so output never depends on the machine. */
function byString(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function stableKey(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Groups a per-root fact across all roots: "all" when every analysed root
 * has it, otherwise the sorted names of the roots that do.
 */
function groupAcrossRoots<T>(roots: RawRoot[], factsOf: (root: RawRoot) => T[]): Array<{ fact: T; scope: SnapshotScope }> {
  const grouped = new Map<string, { fact: T; roots: Set<string> }>();
  for (const root of roots) {
    for (const fact of factsOf(root)) {
      const key = stableKey(fact);
      const entry = grouped.get(key) ?? { fact, roots: new Set<string>() };
      entry.roots.add(root.name);
      grouped.set(key, entry);
    }
  }
  return Array.from(grouped.entries())
    .sort(([a], [b]) => byString(a, b))
    .map(([, { fact, roots: present }]) => ({
      fact,
      scope: present.size === roots.length ? "all" : Array.from(present).sort(byString),
    }));
}

const DESCRIPTION_SECTION = /^([A-Z][A-Z ]+[A-Z]):/gm;

const STANDARD_UNKNOWNS: FigmaSnapshot["unknowns"] = [
  { fact: "reactMapping", reason: "Snapshots never map Figma names to React props, CSS variables or registry fields; that is comparison work (AG-1D)." },
  { fact: "parity", reason: "A snapshot records what Figma contains; it is not a verdict on whether any other source matches it." },
  { fact: "renderedValues", reason: "Variable bindings and their alias closure are captured, not rendered output; mode selection, fallbacks and rendered values are not evaluated." },
  { fact: "modeSupport", reason: "Collections and explicit modes are recorded as observed; which Light/Dark, Shape or Surface modes the component is designed for is not inferred." },
  { fact: "nestedInstanceOverrides", reason: "Nested instances record their variant selections only; text, boolean and instance-swap override values are not captured." },
  { fact: "nestedInstanceRole", reason: "Whether a nested component is public, an internal helper or decorative is not determinable from Figma beyond the Icon/ naming convention." },
  { fact: "documentationLinks", reason: "Component documentation links are not captured." },
  { fact: "otherFiles", reason: "Only the file named by the identity was read; other files (e.g. Free) and their gating are not captured." },
];

export function normalizeFigmaSnapshot(
  capture: RawFigmaCapture,
  slug: string,
  identity: FigmaIdentity,
  capturedAt: string,
): FigmaSnapshot {
  const target = capture.targets.find((t) => t.target.slug === slug);
  if (!target) throw new FigmaSnapshotError(`${slug}: not present in the capture`);
  if (target.error) throw new FigmaSnapshotError(`${slug}: capture reported ${target.error}`);
  if (capture.fileKey !== identity.fileKey || target.fileKey !== identity.fileKey) {
    throw new FigmaSnapshotError(`${slug}: captured from file ${target.fileKey}, identity names ${identity.fileKey}`);
  }
  const node = target.node;
  if (!node) throw new FigmaSnapshotError(`${slug}: no node captured`);
  if (node.id !== identity.nodeId) throw new FigmaSnapshotError(`${slug}: captured node ${node.id}, identity names ${identity.nodeId}`);
  if (node.type !== identity.nodeType) throw new FigmaSnapshotError(`${slug}: captured ${node.type}, identity names ${identity.nodeType}`);

  const roots = [...node.roots].sort((a, b) => byString(a.name, b.name));

  const componentProperties = Object.entries(node.componentPropertyDefinitions)
    .map(([key, def]) => ({
      key,
      name: key.split("#")[0],
      type: def.type,
      defaultValue:
        typeof def.defaultValue === "string" || typeof def.defaultValue === "boolean" ? def.defaultValue : null,
      ...(def.variantOptions ? { variantOptions: [...def.variantOptions] } : {}),
    }))
    .sort((a, b) => byString(a.name, b.name) || byString(a.key, b.key));

  const variants =
    node.type === "COMPONENT_SET"
      ? roots.map((r) => ({ nodeId: r.id, name: r.name, values: { ...(r.variantProperties ?? {}) } }))
      : [];

  const referencedIds = new Set(roots.flatMap((r) => r.bindings.map((b) => b.variableId)));
  const variables = Array.from(referencedIds)
    .map((id) => ({ id, raw: capture.variables[id] ?? null }))
    .filter((v): v is { id: string; raw: NonNullable<typeof v.raw> } => v.raw !== null)
    .map(({ id, raw }) => ({
      id,
      name: raw.name,
      resolvedType: raw.resolvedType,
      collection: raw.collectionName,
      valuesByMode: raw.valuesByMode,
    }))
    .sort((a, b) => byString(a.name, b.name) || byString(a.id, b.id));

  const aliasClosure = computeAliasClosure(variables, (id) => {
    const raw = capture.variables[id];
    return raw ? { name: raw.name, resolvedType: raw.resolvedType, collection: raw.collectionName, valuesByMode: raw.valuesByMode } : null;
  });

  const collectionIds = new Set([
    ...variables.map((v) => capture.variables[v.id]!.collectionId),
    ...roots.flatMap((r) => Object.keys(r.explicitVariableModes)),
  ]);
  const collections = Array.from(collectionIds)
    .map((id) => capture.collections[id])
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ name: c.name, modes: c.modes.map((m) => m.name) }))
    .sort((a, b) => byString(a.name, b.name));

  const modeName = (collectionId: string, modeId: string) => {
    const c = capture.collections[collectionId];
    return { collection: c?.name ?? null, mode: c?.modes.find((m) => m.modeId === modeId)?.name ?? null };
  };

  const observed: FigmaSnapshot["observed"] = {
    node: {
      id: node.id,
      name: node.name,
      type: node.type,
      pageName: node.pageName,
      parent: node.parent,
      description: node.description,
    },
    componentProperties,
    variants,
    layouts: groupAcrossRoots(roots, (r) => [r.layout]).map(({ fact, scope }) => ({ scope, layout: fact })),
    children: groupAcrossRoots(roots, (r) => [r.children]).map(({ fact, scope }) => ({ scope, children: fact })),
    variableBindings: groupAcrossRoots(roots, (r) =>
      r.bindings.map((b) => ({ path: b.path, property: b.property, variableId: b.variableId, withinInstance: b.withinInstance })),
    ).map(({ fact, scope }) => ({ scope, ...fact })),
    textStyles: groupAcrossRoots(roots, (r) => r.textStyles).map(({ fact, scope }) => ({ scope, ...fact })),
    nestedInstances: groupAcrossRoots(roots, (r) => r.instances).map(({ fact, scope }) => ({ scope, ...fact })),
    explicitVariableModes: groupAcrossRoots(roots, (r) =>
      Object.entries(r.explicitVariableModes).map(([cid, mid]) => modeName(cid, mid)),
    ).map(({ fact, scope }) => ({ scope, ...fact })),
    variables,
    collections,
    aliasClosure,
  };

  const variantAxes = componentProperties.filter((p) => p.type === "VARIANT" && p.variantOptions);
  const expectedCombinations = variantAxes.reduce((n, p) => n * (p.variantOptions?.length ?? 1), 1);
  const propertyCounts: Record<string, number> = {};
  for (const p of componentProperties) propertyCounts[p.type] = (propertyCounts[p.type] ?? 0) + 1;

  const nestedByMain = new Map<string, FigmaSnapshot["derived"]["nestedComponents"][number]>();
  for (const inst of observed.nestedInstances) {
    const key = inst.componentSetId ?? inst.mainComponentId ?? "unknown";
    const label = inst.componentSetName ?? inst.mainComponentName ?? "";
    nestedByMain.set(key, {
      mainComponentName: inst.componentSetName ? null : inst.mainComponentName,
      componentSetName: inst.componentSetName,
      kind: label.startsWith("Icon/") ? "icon" : "component",
    });
  }

  const derived: FigmaSnapshot["derived"] = {
    descriptionSections: Array.from(node.description.matchAll(DESCRIPTION_SECTION), (m) => m[1]),
    propertyCounts: Object.fromEntries(Object.entries(propertyCounts).sort(([a], [b]) => byString(a, b))),
    variantCount: variants.length,
    variantCombinationsComplete: variantAxes.length ? expectedCombinations === variants.length : null,
    aliasClosureComplete: aliasClosure.unresolvedIds.length === 0,
    boundCollections: Array.from(new Set(variables.map((v) => v.collection).filter((c): c is string => Boolean(c)))).sort(byString),
    nestedComponents: Array.from(nestedByMain.values()).sort((a, b) =>
      byString(a.componentSetName ?? a.mainComponentName ?? "", b.componentSetName ?? b.mainComponentName ?? ""),
    ),
  };

  const unknowns = [...STANDARD_UNKNOWNS];
  if (componentProperties.length === 0) {
    unknowns.push({
      fact: "componentProperties",
      reason: "This master exposes no component properties of its own; nested instances are recorded only by their variant selections.",
    });
  }
  const unresolved = Array.from(referencedIds).filter((id) => !capture.variables[id]);
  if (unresolved.length) {
    unknowns.push({ fact: "variables", reason: `${unresolved.length} bound variable(s) could not be resolved by the capture.` });
  }

  return {
    schemaVersion: FIGMA_SNAPSHOT_SCHEMA_VERSION,
    capturedAt,
    capture: { method: "figma-plugin-api", captureVersion: capture.captureVersion, fileName: capture.fileName },
    identity: { ...identity },
    observed,
    derived,
    unknowns: unknowns.sort((a, b) => byString(a.fact, b.fact)),
  };
}
