import type { RawVariableValue } from "@/lib/figma-snapshot/raw-capture";
import type { SnapshotVariable } from "@/lib/figma-snapshot/schema";

/**
 * AG-1B 1.1.0 — transitive variable alias closure.
 *
 * A bound variable may alias another variable, which may alias another. The
 * closure is every variable reachable from the bound set through alias values
 * in ANY mode, excluding the bound variables themselves (they are already
 * `observed.variables`). It lets a consumer tell apart:
 *
 * - a token that is bound directly (in `variables`);
 * - a token that is only a transitive alias target (in `aliasClosure.variables`);
 * - a token that is provably absent from the master's dependency graph
 *   (in neither, with `unresolvedIds` empty);
 * - a token whose absence cannot be proven (`unresolvedIds` not empty).
 *
 * Pure, read-only and cycle-safe (every id is visited at most once). It
 * observes alias references and literal values only; it never evaluates
 * rendering, mode selection or fallbacks.
 */

export type ClosureVariableSource = {
  name: string;
  resolvedType: string;
  collection: string | null;
  valuesByMode: Record<string, RawVariableValue>;
};

/** Looks a variable up by id. `null`/`undefined` mean "could not be resolved". */
export type ClosureLookup = (id: string) => ClosureVariableSource | null | undefined;

export type AliasClosure = {
  variables: SnapshotVariable[];
  /** Alias targets that could not be resolved, so the closure is incomplete past them. */
  unresolvedIds: string[];
};

export function aliasReferences(valuesByMode: Record<string, RawVariableValue>): Array<{ id: string; name: string | null }> {
  const references: Array<{ id: string; name: string | null }> = [];
  for (const value of Object.values(valuesByMode)) {
    if (value && typeof value === "object" && "aliasId" in value && typeof value.aliasId === "string") {
      references.push({ id: value.aliasId, name: value.alias ?? null });
    }
  }
  return references;
}

const byString = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function computeAliasClosure(bound: readonly SnapshotVariable[], lookup: ClosureLookup): AliasClosure {
  const boundIds = new Set(bound.map((variable) => variable.id));
  const visited = new Set<string>(boundIds);
  const closure = new Map<string, SnapshotVariable>();
  const unresolved = new Set<string>();
  const queue: Array<Record<string, RawVariableValue>> = bound.map((variable) => variable.valuesByMode);

  while (queue.length > 0) {
    const valuesByMode = queue.shift()!;
    for (const reference of aliasReferences(valuesByMode)) {
      if (visited.has(reference.id)) continue;
      visited.add(reference.id);
      const source = lookup(reference.id);
      if (!source) {
        unresolved.add(reference.id);
        continue;
      }
      closure.set(reference.id, {
        id: reference.id,
        name: source.name,
        resolvedType: source.resolvedType,
        collection: source.collection,
        valuesByMode: source.valuesByMode,
      });
      queue.push(source.valuesByMode);
    }
  }

  return {
    variables: Array.from(closure.values()).sort((a, b) => byString(a.name, b.name) || byString(a.id, b.id)),
    unresolvedIds: Array.from(unresolved).sort(byString),
  };
}

/** True when a snapshot's alias closure is present and every alias target was resolved. */
export function isAliasClosureComplete(closure: AliasClosure | undefined): boolean {
  return closure !== undefined && closure.unresolvedIds.length === 0;
}
