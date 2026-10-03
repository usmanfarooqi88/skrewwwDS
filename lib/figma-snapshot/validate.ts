/**
 * AG-1B snapshot validation — deterministic, offline, checks a snapshot
 * against the registry identity it claims to describe. Missing optional data
 * (no bindings, no properties) is valid; pointing at a different node, React
 * facts, or parity claims are not.
 */
import { figmaIdentityKey, validateFigmaIdentity, type FigmaIdentity } from "@/lib/figma-identity";
import { aliasReferences, computeAliasClosure } from "@/lib/figma-snapshot/alias-closure";
import { SUPPORTED_FIGMA_SNAPSHOT_SCHEMA_VERSIONS, type FigmaSnapshot } from "@/lib/figma-snapshot/schema";

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

/** Keys that would mean a snapshot is carrying cross-source or verdict data. */
const FORBIDDEN_KEYS = new Set([
  "react",
  "reactProp",
  "reactProps",
  "apiProps",
  "properties",
  "cssTokens",
  "cssVariable",
  "tokensUsed",
  "parity",
  "matches",
  "status",
  "verdict",
]);

function findForbiddenKeys(value: unknown, path: string, out: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => findForbiddenKeys(v, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      // Figma-observed free text (names, paths, descriptions, mode names) is data, not keys.
      if (path.endsWith(".valuesByMode") || path.endsWith(".values") || path.endsWith(".variantProperties")) continue;
      if (FORBIDDEN_KEYS.has(key)) out.push(`${path}.${key}`);
      findForbiddenKeys(child, `${path}.${key}`, out);
    }
  }
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  return Array.from(new Set(values.filter((v) => (seen.has(v) ? true : (seen.add(v), false)))));
}

export function validateFigmaSnapshot(snapshot: FigmaSnapshot, expectedIdentity: FigmaIdentity): string[] {
  const problems: string[] = [];
  const o = snapshot.observed;

  if (!SUPPORTED_FIGMA_SNAPSHOT_SCHEMA_VERSIONS.includes(snapshot.schemaVersion)) {
    problems.push(`schemaVersion ${snapshot.schemaVersion} is not one of ${SUPPORTED_FIGMA_SNAPSHOT_SCHEMA_VERSIONS.join(", ")}`);
  }
  if (!ISO_DATETIME.test(snapshot.capturedAt)) problems.push(`capturedAt "${snapshot.capturedAt}" is not an ISO UTC datetime`);

  problems.push(...validateFigmaIdentity(snapshot.identity).map((p) => `identity: ${p}`));
  if (figmaIdentityKey(snapshot.identity) !== figmaIdentityKey(expectedIdentity)) {
    problems.push(`identity ${figmaIdentityKey(snapshot.identity)} is not the registry identity ${figmaIdentityKey(expectedIdentity)}`);
  }
  for (const field of ["nodeType", "role", "verifiedAt"] as const) {
    if (snapshot.identity[field] !== expectedIdentity[field]) {
      problems.push(`identity.${field} "${snapshot.identity[field]}" differs from the registry "${expectedIdentity[field]}"`);
    }
  }
  if (o.node.id !== expectedIdentity.nodeId) problems.push(`observed node ${o.node.id} is not identity node ${expectedIdentity.nodeId}`);
  if (o.node.type !== expectedIdentity.nodeType) problems.push(`observed type ${o.node.type} is not identity type ${expectedIdentity.nodeType}`);
  if (o.node.type === "COMPONENT" && o.variants.length > 0) problems.push("a standalone COMPONENT cannot have variants");

  for (const d of duplicates(o.componentProperties.map((p) => p.key))) problems.push(`duplicate component property key ${d}`);
  for (const d of duplicates(o.variants.map((v) => v.name))) problems.push(`duplicate variant name ${d}`);
  for (const d of duplicates(o.variants.map((v) => v.nodeId))) problems.push(`duplicate variant node ${d}`);
  for (const d of duplicates(o.variables.map((v) => v.id))) problems.push(`duplicate variable ${d}`);

  const variableIds = new Set(o.variables.map((v) => v.id));
  const unresolvedDeclared = snapshot.unknowns.some((u) => u.fact === "variables");
  for (const b of o.variableBindings) {
    if (!variableIds.has(b.variableId) && !unresolvedDeclared) {
      problems.push(`binding ${b.path || "(root)"} ${b.property} references undeclared variable ${b.variableId}`);
    }
  }
  const variantNames = new Set(o.variants.map((v) => v.name));
  const scoped = [...o.variableBindings, ...o.layouts, ...o.children, ...o.textStyles, ...o.nestedInstances];
  for (const item of scoped) {
    if (item.scope !== "all") {
      for (const name of item.scope) {
        if (!variantNames.has(name)) problems.push(`scope names unknown variant "${name}"`);
      }
    }
  }

  validateAliasClosure(snapshot, problems);

  const forbidden: string[] = [];
  findForbiddenKeys(snapshot, "snapshot", forbidden);
  for (const f of forbidden) problems.push(`forbidden cross-source/verdict key ${f}`);

  if (!Array.isArray(snapshot.unknowns)) problems.push("unknowns must be a list");
  return problems;
}

/**
 * 1.1.0 integrity: the closure exists, is disjoint from the bound set, has
 * unique ids, and is exactly what the alias references of bound ∪ closure
 * variables reach — so a consumer can rely on `unresolvedIds` alone to decide
 * whether absence is provable.
 */
function validateAliasClosure(snapshot: FigmaSnapshot, problems: string[]): void {
  const closure = snapshot.observed.aliasClosure;
  if (snapshot.schemaVersion === "1.0.0") {
    if (closure !== undefined) problems.push("a 1.0.0 snapshot cannot carry an aliasClosure");
    if (snapshot.derived.aliasClosureComplete !== undefined) problems.push("a 1.0.0 snapshot cannot carry derived.aliasClosureComplete");
    return;
  }
  if (!closure || !Array.isArray(closure.variables) || !Array.isArray(closure.unresolvedIds)) {
    problems.push("observed.aliasClosure is required from schema 1.1.0");
    return;
  }
  const boundIds = new Set(snapshot.observed.variables.map((v) => v.id));
  const closureIds = closure.variables.map((v) => v.id);
  for (const d of duplicates(closureIds)) problems.push(`duplicate alias-closure variable ${d}`);
  for (const id of closureIds) if (boundIds.has(id)) problems.push(`alias-closure variable ${id} is also a bound variable`);

  const known = new Map([...snapshot.observed.variables, ...closure.variables].map((v) => [v.id, v]));
  const recomputed = computeAliasClosure(snapshot.observed.variables, (id) => {
    const variable = closure.variables.find((candidate) => candidate.id === id);
    return variable ? { name: variable.name, resolvedType: variable.resolvedType, collection: variable.collection, valuesByMode: variable.valuesByMode } : null;
  });
  const declared = new Set(closureIds);
  for (const variable of recomputed.variables) {
    if (!declared.has(variable.id)) problems.push(`alias-closure is missing reachable variable ${variable.id}`);
  }
  for (const id of closureIds) {
    if (!recomputed.variables.some((variable) => variable.id === id)) problems.push(`alias-closure variable ${id} is not reachable from a bound variable`);
  }
  if (JSON.stringify([...closure.unresolvedIds].sort()) !== JSON.stringify(recomputed.unresolvedIds)) {
    problems.push("alias-closure unresolvedIds do not match the unresolved alias references");
  }
  for (const variable of Array.from(known.values())) {
    for (const reference of aliasReferences(variable.valuesByMode)) {
      if (reference.name !== null && known.has(reference.id) && known.get(reference.id)!.name !== reference.name) {
        problems.push(`alias reference ${reference.id} names "${reference.name}" but the variable is "${known.get(reference.id)!.name}"`);
      }
    }
  }
  if (snapshot.derived.aliasClosureComplete !== (closure.unresolvedIds.length === 0)) {
    problems.push("derived.aliasClosureComplete does not follow from observed.aliasClosure");
  }
}
