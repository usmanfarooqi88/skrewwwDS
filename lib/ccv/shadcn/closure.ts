import { sortedUnique } from "@/lib/ccv/serialize";

/**
 * CCV-2 — which registry items did the installer actually resolve? Read from the
 * local registry's request log and compared with the contract-derived closure.
 * The filesystem alone cannot show a resolution failure that another item happened
 * to mask, so this is checked separately.
 */

export type ClosureVerdict = { requested: string[]; missing: string[]; extra: string[]; unknown: string[] };

export function evaluateRegistryClosure(requests: readonly string[], expectedClosure: readonly string[], distributed: readonly string[]): ClosureVerdict {
  const names = sortedUnique(requests.map((path) => /^\/r\/([^/]+)\.json$/.exec(path)?.[1]).filter((name): name is string => Boolean(name)));
  const unknownPaths = requests.filter((path) => !/^\/r\/[^/]+\.json$/.test(path));
  return {
    requested: names,
    missing: expectedClosure.filter((name) => !names.includes(name)),
    extra: names.filter((name) => distributed.includes(name) && !expectedClosure.includes(name)),
    unknown: sortedUnique([...names.filter((name) => !distributed.includes(name)), ...unknownPaths]),
  };
}
