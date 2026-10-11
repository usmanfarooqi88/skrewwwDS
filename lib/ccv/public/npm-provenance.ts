import { createHash } from "node:crypto";
import { classifyFetch, type FetchClass, type Fetcher } from "@/lib/ccv/public/fetcher";
import type { ReleaseIdentity } from "@/lib/ccv/public/release-identity";
import { verifyNpmSignatures, type NpmRegistryKey, type NpmSignature } from "@/lib/ccv/public/signatures";
import { evidence, listEvidence } from "@/lib/ccv/runner/result";
import type { CcvCheck } from "@/lib/ccv/types";

/**
 * CCV-5 — PUBLIC_NPM provenance. Expected identity is derived from the repository
 * (version → release tag → tag commit → expected dist-tag, see release-identity.ts);
 * observed identity is read from the public npm registry. Everything here is a pure
 * judgement over already-collected evidence, so each verdict is unit-testable:
 *
 *   PASS     the observed value equals the expected value
 *   FAIL     the evidence contradicts the expectation (PROVENANCE_MISMATCH)
 *   UNKNOWN  the evidence is absent (PROVENANCE_MISSING) or could not be observed
 *            (ENVIRONMENT_ERROR) — never a pass
 */

export type IdFn = (category: string, key: string) => string;

export type NpmVersionMeta = {
  version: string;
  gitHead?: string;
  dist?: { integrity?: string; shasum?: string; tarball?: string; signatures?: NpmSignature[] };
};
export type PackumentObservation =
  | { class: "ok"; origin: string; versions: Record<string, NpmVersionMeta>; distTags: Record<string, string> }
  | Exclude<FetchClass, { class: "ok" }>;
export type KeysObservation = { class: "ok"; keys: NpmRegistryKey[] } | Exclude<FetchClass, { class: "ok" }>;

const parseJson = (bytes: Uint8Array): unknown => {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return undefined;
  }
};

export async function observePackument(origin: string, packageName: string, fetcher: Fetcher): Promise<PackumentObservation> {
  const fetched = classifyFetch(await fetcher(`${origin}/${packageName.replace("/", "%2f")}`), origin);
  if (fetched.class !== "ok") return fetched;
  const doc = parseJson(fetched.bytes) as { versions?: Record<string, NpmVersionMeta>; "dist-tags"?: Record<string, string> } | undefined;
  if (!doc || typeof doc !== "object" || !doc.versions) return { class: "unavailable", detail: "the packument is not valid JSON with versions" };
  return { class: "ok", origin, versions: doc.versions, distTags: doc["dist-tags"] ?? {} };
}

export async function observeRegistryKeys(origin: string, fetcher: Fetcher): Promise<KeysObservation> {
  const fetched = classifyFetch(await fetcher(`${origin}/-/npm/v1/keys`), origin);
  if (fetched.class !== "ok") return fetched;
  const doc = parseJson(fetched.bytes) as { keys?: NpmRegistryKey[] } | undefined;
  return Array.isArray(doc?.keys) ? { class: "ok", keys: doc.keys } : { class: "unavailable", detail: "the registry key document is not valid" };
}

const unknownEnvironment = { status: "unknown" as const, failureCode: "ENVIRONMENT_ERROR" as const };
const unknownMissing = { status: "unknown" as const, failureCode: "PROVENANCE_MISSING" as const };
const failMismatch = { status: "fail" as const, failureCode: "PROVENANCE_MISMATCH" as const };
const detailOf = (observation: Exclude<FetchClass, { class: "ok" }>): string => (observation.class === "absent" ? `HTTP ${observation.status}` : observation.detail);

export type NpmMetadataInput = {
  id: IdFn;
  pkg: string;
  origin: string;
  release: ReleaseIdentity;
  packument: PackumentObservation;
  keys: KeysObservation;
};

export function npmMetadataChecks(input: NpmMetadataInput): { checks: CcvCheck[]; meta?: NpmVersionMeta } {
  const { id, pkg, release, packument, keys } = input;
  const checks: CcvCheck[] = [];
  const category = "provenance";

  // 1. expected release identity (repository side)
  checks.push(
    release.tagCommit
      ? {
          checkId: id(category, "expected-release"),
          status: "pass",
          claim: `the expected release is derived from the repository: ${pkg}@${release.version} → tag ${release.tag} → commit ${release.tagCommit}`,
          authority: "release-tag",
          evidence: [evidence("source", release.tag, `${release.tagCommit}; tag object ${release.tagObjectType ?? "?"}${release.tagCarriesSignature === undefined ? "" : release.tagCarriesSignature ? "; carries a signature block (structural; not verified)" : "; carries no signature block"}`)],
        }
      : { checkId: id(category, "expected-release"), ...unknownMissing, claim: `the expected release commit for ${pkg}@${release.version} can be derived from tag ${release.tag}`, authority: "release-tag", evidence: [evidence("source", release.tag, "the release tag is not present in this checkout (fetch tags); the expected commit cannot be established, so nothing below can be a pass")] },
  );

  // 2. the exact public version
  let meta: NpmVersionMeta | undefined;
  if (packument.class !== "ok") {
    const code = packument.class === "absent" ? failMismatch : unknownEnvironment;
    checks.push({ checkId: id(category, "registry-version"), ...code, claim: `${pkg}@${release.version} is published on ${input.origin}`, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", `${input.origin}/${pkg}`, packument.class === "absent" ? `HTTP ${packument.status}: the package is not on the public registry` : `could not be observed: ${packument.detail}`)] });
  } else {
    meta = packument.versions[release.version];
    checks.push(
      meta
        ? { checkId: id(category, "registry-version"), status: "pass", claim: `${pkg}@${release.version} is published on ${input.origin}`, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", `${pkg}@${release.version}`, `published; dist-tags ${Object.entries(packument.distTags).map(([tag, version]) => `${tag}=${version}`).join(", ") || "(none)"}`)] }
        : { checkId: id(category, "registry-version"), ...failMismatch, claim: `${pkg}@${release.version} is published on ${input.origin}`, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", `${pkg}@${release.version}`, `the registry has no such version (has ${Object.keys(packument.versions).slice(-5).join(", ") || "none"})`)] },
    );
  }

  // 3. gitHead ↔ release tag commit
  const gitHeadClaim = `the registry's gitHead for ${pkg}@${release.version} equals the release tag's commit`;
  if (!meta) checks.push({ checkId: id(category, "git-head"), ...unknownEnvironment, claim: gitHeadClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "gitHead", "the published version could not be read")] });
  else if (!meta.gitHead) checks.push({ checkId: id(category, "git-head"), ...unknownMissing, claim: gitHeadClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "gitHead", "the registry exposes no gitHead for this version")] });
  else if (!release.tagCommit) checks.push({ checkId: id(category, "git-head"), ...unknownMissing, claim: gitHeadClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "gitHead", `registry gitHead ${meta.gitHead}; no expected commit to compare (release tag unavailable)`)] });
  else checks.push({ checkId: id(category, "git-head"), ...(meta.gitHead === release.tagCommit ? { status: "pass" as const } : failMismatch), claim: gitHeadClaim, authority: "npm-registry-metadata", expected: release.tagCommit, actual: meta.gitHead, evidence: [evidence("package-metadata", "gitHead", `expected ${release.tagCommit}; registry ${meta.gitHead}`)] });

  // 4. dist-tags: the version sits under its own tag and a prerelease never moved `latest`
  const tagClaim = release.expectedDistTag ? `${pkg}@${release.version} is published under dist-tag "${release.expectedDistTag}" and has not been promoted to "latest"` : `${pkg}@${release.version} (stable) is "latest"`;
  if (packument.class !== "ok") checks.push({ checkId: id(category, "dist-tags"), ...unknownEnvironment, claim: tagClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "dist-tags", "the packument could not be observed")] });
  else {
    const tags = packument.distTags;
    const ok = release.expectedDistTag ? tags[release.expectedDistTag] === release.version && tags.latest !== release.version : tags.latest === release.version;
    checks.push({ checkId: id(category, "dist-tags"), ...(ok ? { status: "pass" as const } : failMismatch), claim: tagClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "dist-tags", Object.entries(tags).map(([tag, version]) => `${tag}=${version}`).join(", ") || "(none)")] });
  }

  // 5. registry signature (cryptographic, against the registry's published keys)
  const signatureClaim = `the registry's signature over ${pkg}@${release.version} and its integrity verifies against the registry's published key`;
  const signatures = meta?.dist?.signatures ?? [];
  if (!meta || !meta.dist?.integrity) checks.push({ checkId: id(category, "signatures"), ...unknownEnvironment, claim: signatureClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "signatures", "the published version or its integrity could not be read")] });
  else if (signatures.length === 0) checks.push({ checkId: id(category, "signatures"), ...unknownMissing, claim: signatureClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "signatures", "the registry exposes no signature for this version")] });
  else if (keys.class !== "ok") checks.push({ checkId: id(category, "signatures"), ...unknownEnvironment, claim: signatureClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", `${input.origin}/-/npm/v1/keys`, `registry keys could not be observed: ${detailOf(keys)}`)] });
  else {
    const verdict = verifyNpmSignatures({ name: pkg, version: release.version, integrity: meta.dist.integrity, signatures, keys: keys.keys });
    const status = verdict.invalid.length > 0 ? failMismatch : verdict.valid.length > 0 ? { status: "pass" as const } : unknownMissing;
    checks.push({ checkId: id(category, "signatures"), ...status, claim: signatureClaim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "signatures", `${verdict.valid.length} valid, ${verdict.invalid.length} invalid, ${verdict.unknownKey.length} with an unknown key id (${signatures.map((signature) => signature.keyid.slice(0, 18)).join(", ")}…)`)] });
  }

  // 6. does the HEAD-derived contract describe the release?
  const sourceClaim = "no artifact-determining source changed between the release tag and the commit the CCV contract is derived from";
  const metadataNote = release.metadataChangedSinceTag.length > 0 ? [evidence("source", "contract-metadata", `contract metadata also differs since the tag (reported, not gating): ${release.metadataChangedSinceTag.join(", ")}`)] : [];
  if (!release.tagCommit) checks.push({ checkId: id(category, "source-identity"), ...unknownMissing, claim: sourceClaim, authority: "release-tag", evidence: [evidence("source", "release-tag", "no release tag in this checkout to compare against")] });
  else if (release.changedSinceTag.length === 0) checks.push({ checkId: id(category, "source-identity"), status: "pass", claim: sourceClaim, authority: "release-tag", evidence: [evidence("source", release.tag, "packages/react, components/ui, styles, the pilot entry, the build script and the lockfile are identical to the release tag"), ...metadataNote] });
  else checks.push({ checkId: id(category, "source-identity"), ...unknownMissing, claim: sourceClaim, authority: "release-tag", evidence: [evidence("source", release.tag, "the contract is derived from HEAD, which differs from the release in artifact-determining files:"), ...listEvidence("source", "changed-since-tag", release.changedSinceTag), ...metadataNote] });

  return { checks, meta };
}

export const sri512 = (bytes: Uint8Array): string => `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
export const sha1Hex = (bytes: Uint8Array): string => createHash("sha1").update(bytes).digest("hex");

/** The downloaded public tarball must be the artifact the registry describes. */
export function npmTarballChecks(input: { id: IdFn; pkg: string; version: string; meta?: NpmVersionMeta; tarball: { integrity: string; shasum: string; sha256: string; bytes: number } }): CcvCheck[] {
  const { id, pkg, version, meta, tarball } = input;
  const claim = `the public tarball of ${pkg}@${version} has exactly the integrity and shasum the registry lists`;
  if (!meta?.dist?.integrity) return [{ checkId: id("provenance", "integrity"), ...unknownEnvironment, claim, authority: "npm-registry-metadata", evidence: [evidence("package-metadata", "integrity", "the registry integrity could not be read")] }];
  const integrityOk = tarball.integrity === meta.dist.integrity;
  const shasumOk = !meta.dist.shasum || tarball.shasum === meta.dist.shasum;
  return [{
    checkId: id("provenance", "integrity"),
    ...(integrityOk && shasumOk ? { status: "pass" as const } : failMismatch),
    claim,
    authority: "npm-registry-metadata",
    expected: meta.dist.integrity,
    actual: tarball.integrity,
    evidence: [evidence("hash", `${pkg}@${version}.tgz`, `${tarball.bytes} bytes; ${integrityOk ? "integrity equals the registry's" : `integrity ${tarball.integrity} != registry ${meta.dist.integrity}`}; ${shasumOk ? "shasum equals the registry's" : `shasum ${tarball.shasum} != registry ${meta.dist.shasum}`}`, tarball.sha256)],
  }];
}

export type RebuildOutcome =
  | { ok: true; integrity: string; files: Map<string, string> }
  | { ok: false; reason: string; environment: boolean };

/** Rebuilding the package at the release commit must reproduce the public tarball. */
export function rebuildCheck(input: { id: IdFn; pkg: string; version: string; tagCommit?: string; publicIntegrity: string; publicFiles: Map<string, string>; rebuilt?: RebuildOutcome }): CcvCheck {
  const claim = `rebuilding ${input.pkg} at the release commit reproduces the public tarball`;
  const base = { checkId: input.id("provenance", "rebuild"), claim, authority: "release-tag" as const };
  if (!input.tagCommit) return { ...base, ...unknownMissing, evidence: [evidence("source", "rebuild", "no release commit to rebuild")] };
  if (!input.rebuilt) return { ...base, ...unknownEnvironment, evidence: [evidence("command", "rebuild", "the rebuild was not performed")] };
  if (!input.rebuilt.ok) return { ...base, ...unknownEnvironment, evidence: [evidence("command", "rebuild", `could not be rebuilt at ${input.tagCommit}: ${input.rebuilt.reason}`)] };
  if (input.rebuilt.integrity === input.publicIntegrity) return { ...base, status: "pass", expected: input.publicIntegrity, actual: input.rebuilt.integrity, evidence: [evidence("hash", "rebuild", `rebuild at ${input.tagCommit} is byte-identical to the public tarball (${input.publicFiles.size} files, ${input.publicIntegrity.slice(0, 24)}…)`)] };
  const rebuilt = input.rebuilt.files;
  const differing = Array.from(input.publicFiles).filter(([path, hash]) => rebuilt.has(path) && rebuilt.get(path) !== hash).map(([path]) => path);
  const onlyPublic = Array.from(input.publicFiles.keys()).filter((path) => !rebuilt.has(path));
  const onlyRebuilt = Array.from(rebuilt.keys()).filter((path) => !input.publicFiles.has(path));
  return {
    ...base, ...failMismatch, expected: input.publicIntegrity, actual: input.rebuilt.integrity,
    evidence: [evidence("hash", "rebuild", `rebuild at ${input.tagCommit} differs from the public tarball (${input.rebuilt.integrity.slice(0, 24)}… vs ${input.publicIntegrity.slice(0, 24)}…)`), ...listEvidence("file", "differing", differing), ...listEvidence("file", "only-in-public", onlyPublic), ...listEvidence("file", "only-in-rebuild", onlyRebuilt)],
  };
}

/** Proof that the CCV consumer installed the PUBLIC artifact: never a file:, link:, workspace: or git spec, never a cache or sibling copy. */
export type ConsumedArtifactInput = {
  id: IdFn;
  pkg: string;
  version: string;
  registryOrigin: string;
  dependencySpec: string;
  configuredRegistry?: string;
  lockEntry?: { resolved?: string; integrity?: string; link?: boolean };
  installedIsLink: boolean;
  installedVersion?: string;
  expectedTarball?: string;
  expectedIntegrity?: string;
  consumerHasNpmrc: boolean;
};

export function consumedPublicArtifactCheck(input: ConsumedArtifactInput): CcvCheck {
  const claim = `the consumer installed ${input.pkg}@${input.version} from the public registry (not a tarball, link, workspace or local copy)`;
  const base = { checkId: input.id("provenance", "consumed-public-artifact"), claim, authority: "npm-registry-metadata" as const };
  // Problems that prove a non-public artifact WITHOUT needing the registry's metadata.
  const problems: string[] = [];
  if (input.dependencySpec !== input.version) problems.push(`dependency spec ${JSON.stringify(input.dependencySpec)} is not the exact public version`);
  if (/^(file|link|workspace|git|github|http):/.test(input.dependencySpec)) problems.push("dependency spec is not a registry spec");
  if (input.configuredRegistry && input.configuredRegistry.replace(/\/$/, "") !== input.registryOrigin) problems.push(`npm registry is ${input.configuredRegistry}, not ${input.registryOrigin}`);
  if (input.consumerHasNpmrc) problems.push("the consumer carries an .npmrc that could redirect the registry");
  if (input.installedIsLink || input.lockEntry?.link) problems.push("the package is installed as a symbolic link");
  if (!input.lockEntry) problems.push("the lockfile has no entry for the package");
  else if (!input.lockEntry.resolved || !input.lockEntry.resolved.startsWith(`${input.registryOrigin}/`)) problems.push(`lockfile resolved ${input.lockEntry.resolved ?? "(none)"} is not under ${input.registryOrigin}`);
  if (input.installedVersion !== input.version) problems.push(`installed version ${input.installedVersion ?? "(none)"} != ${input.version}`);
  // Problems that need the registry's metadata to judge.
  const unverifiable: string[] = [];
  if (input.lockEntry) {
    if (!input.expectedTarball) unverifiable.push("the registry tarball URL could not be observed");
    else if (input.lockEntry.resolved !== input.expectedTarball && input.lockEntry.resolved?.startsWith(`${input.registryOrigin}/`)) problems.push(`lockfile resolved ${input.lockEntry.resolved} != the registry tarball ${input.expectedTarball}`);
    if (!input.expectedIntegrity) unverifiable.push("the registry integrity could not be observed");
    else if (input.lockEntry.integrity !== input.expectedIntegrity) problems.push("lockfile integrity != the registry integrity");
  }
  if (problems.length > 0) return { ...base, ...failMismatch, evidence: [evidence("package-metadata", "lockfile", problems.join("; "))] };
  if (unverifiable.length > 0) return { ...base, ...unknownEnvironment, evidence: [evidence("package-metadata", "lockfile", `no local-artifact signs, but it cannot be tied to the registry listing: ${unverifiable.join("; ")}`)] };
  return { ...base, status: "pass", evidence: [evidence("package-metadata", "lockfile", `spec ${input.dependencySpec}; resolved ${input.lockEntry?.resolved}; integrity ${input.lockEntry?.integrity?.slice(0, 24)}…; real directory, registry ${input.registryOrigin}`)] };
}
