import type { ConsumerContract } from "@/lib/ccv/types";
import { sortedUnique } from "@/lib/ccv/serialize";

/**
 * CCV-1 — stable machine-readable ids: `<shadcn|npm>:<subject>:<category>:<key>`.
 * Built from the thing identified (an install path, an export name, a custom
 * property) — never from an array index or randomness — so the same expectation
 * has the same id in every run, and a future result check can reference it.
 */

export const CCV_ID_PATTERN = /^(shadcn|npm):[^:\s]+:[a-z][a-z0-9-]*:\S+$/;

export const shadcnId = (item: string, category: string, key: string): string => `shadcn:${item}:${category}:${key}`;
export const npmId = (pkg: string, category: string, key: string): string => `npm:${pkg}:${category}:${key}`;

/** Every expectation id of a contract, sorted and unique. */
export function listExpectationIds(contract: ConsumerContract): string[] {
  const ids: string[] = [];
  if (contract.distribution === "shadcn-registry") {
    const item = contract.subject;
    const e = contract.expectations;
    for (const file of e.files) ids.push(shadcnId(item, "file", file.installPath));
    for (const name of e.dependencies.npm) ids.push(shadcnId(item, "dependency-npm", name));
    for (const name of e.dependencies.registry) ids.push(shadcnId(item, "dependency-registry", name));
    for (const name of e.exports.values) ids.push(shadcnId(item, "export", name));
    for (const name of e.exports.types) ids.push(shadcnId(item, "export-type", name));
    for (const name of e.css.declaredCustomProperties) ids.push(shadcnId(item, "css", name));
    for (const name of e.css.unresolvedWithoutFallback) ids.push(shadcnId(item, "css-unresolved", name));
    for (const name of e.css.fallbackBackedUses) ids.push(shadcnId(item, "css-fallback", name));
    for (const shared of e.closure.sharedTargets) ids.push(shadcnId(item, "shared-target", shared.installPath));
  } else {
    const pkg = contract.subject;
    const e = contract.expectations;
    for (const name of e.exports.values) ids.push(npmId(pkg, "export", name));
    for (const name of e.exports.types) ids.push(npmId(pkg, "export-type", name));
    for (const specifier of e.exports.denied) ids.push(npmId(pkg, "denied", specifier));
    for (const specifier of e.package.publicSpecifiers) ids.push(npmId(pkg, "public", specifier));
    for (const path of e.package.files.required) ids.push(npmId(pkg, "package-file", path));
    for (const name of e.dependencies.npm) ids.push(npmId(pkg, "dependency", name));
    for (const name of e.dependencies.peers) ids.push(npmId(pkg, "peer", name));
    for (const name of e.dependencies.optional) ids.push(npmId(pkg, "optional", name));
    for (const script of e.package.lifecycleScripts.declaredConsumerRun) ids.push(npmId(pkg, "lifecycle", script));
    for (const name of e.css.declaredCustomProperties) ids.push(npmId(pkg, "css", name));
    for (const name of e.css.unresolvedWithoutFallback) ids.push(npmId(pkg, "css-unresolved", name));
    for (const name of e.css.fallbackBackedUses) ids.push(npmId(pkg, "css-fallback", name));
  }
  return sortedUnique(ids);
}
