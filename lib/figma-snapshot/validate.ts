/**
 * AG-1B snapshot validation — deterministic, offline, checks a snapshot
 * against the registry identity it claims to describe. Missing optional data
 * (no bindings, no properties) is valid; pointing at a different node, React
 * facts, or parity claims are not.
 */
import { figmaIdentityKey, validateFigmaIdentity, type FigmaIdentity } from "@/lib/figma-identity";
import { FIGMA_SNAPSHOT_SCHEMA_VERSION, type FigmaSnapshot } from "@/lib/figma-snapshot/schema";

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

  if (snapshot.schemaVersion !== FIGMA_SNAPSHOT_SCHEMA_VERSION) {
    problems.push(`schemaVersion ${snapshot.schemaVersion} is not ${FIGMA_SNAPSHOT_SCHEMA_VERSION}`);
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

  const forbidden: string[] = [];
  findForbiddenKeys(snapshot, "snapshot", forbidden);
  for (const f of forbidden) problems.push(`forbidden cross-source/verdict key ${f}`);

  if (!Array.isArray(snapshot.unknowns)) problems.push("unknowns must be a list");
  return problems;
}
