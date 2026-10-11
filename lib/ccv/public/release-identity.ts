import { expectedPublishTag } from "@/scripts/check-react-publish-tag.mjs";

/**
 * CCV-5 — the EXPECTED identity, derived from authoritative repository state
 * only (never typed in twice):
 *   - shadcn: the checked-out commit, valid only while every file the registry
 *     generator reads is committed;
 *   - npm: the version in packages/react/package.json → its release tag
 *     (react-v<version>) → the commit that tag points at; the expected dist-tag
 *     comes from the repository's own publish rule (scripts/check-react-publish-tag.mjs).
 * Git is injected as a reader so the derivation is testable without a repository.
 */

/** Runs git with the given arguments in the repository; undefined when it exits non-zero. */
export type GitReader = (args: string[]) => string | undefined;

export const REGISTRY_GENERATOR_INPUT_PATHS = [
  "components",
  "styles",
  "content",
  ":(glob)lib/*.ts",
  ":(exclude,glob)lib/*.test.ts",
  "scripts/generate-shadcn-registry.ts",
] as const;

/**
 * Inputs that DETERMINE the published artifact's bytes. If any differs between the release tag and HEAD, HEAD would not
 * build the released package, so a HEAD-derived contract does not describe the release: provenance cannot be established.
 */
export const NPM_ARTIFACT_INPUT_PATHS = [
  "packages/react",
  "components/ui",
  "styles",
  "lib/cn.ts",
  "lib/use-controllable.ts",
  "lib/react-package/pilot-entry.ts",
  "scripts/build-react-package.ts",
  "package-lock.json",
] as const;

/**
 * Contract METADATA the HEAD-derived contract also reads (registry entries, the repo's root manifest). A difference is
 * always reported as evidence, but it does not gate source identity: the artifact is proven to equal the tag by the
 * commit-pinned rebuild, and a registry change that mattered (membership, exports, tokens) shows up as failing contract
 * checks against the installed package rather than being hidden. Documentation text and npm scripts do neither.
 */
export const NPM_CONTRACT_METADATA_PATHS = [":(glob)lib/component-registry*.ts", "package.json"] as const;

export type RegistryExpectedIdentity = { gitSha: string; dirtyGeneratorInputs: string[] };

export function deriveRegistryExpectedIdentity(git: GitReader): RegistryExpectedIdentity | undefined {
  const gitSha = git(["rev-parse", "HEAD"]);
  if (!gitSha || !/^[0-9a-f]{40}$/.test(gitSha)) return undefined;
  const dirty = git(["status", "--porcelain=v1", "--untracked-files=all", "--", ...REGISTRY_GENERATOR_INPUT_PATHS]) ?? "";
  return { gitSha, dirtyGeneratorInputs: dirty.split("\n").map((line) => line.trim()).filter(Boolean) };
}

export type ReleaseIdentity = {
  packageName: string;
  version: string;
  tag: string;
  /** Commit the release tag points at; undefined when the tag is not present in this checkout. */
  tagCommit?: string;
  /** `tag` for an annotated tag object, `commit` for a lightweight tag. */
  tagObjectType?: string;
  /** Structural only: the tag object carries a signature block. Verification is not performed. */
  tagCarriesSignature?: boolean;
  /** Prerelease versions publish under their own dist-tag (`beta`); null for a stable version. */
  expectedDistTag: string | null;
  /** Package source paths that differ between the release tag and HEAD. */
  /** Artifact-determining files that differ between the release tag and HEAD (gates source identity). */
  changedSinceTag: string[];
  /** Contract-metadata files that differ (reported, never gating). */
  metadataChangedSinceTag: string[];
};

export function deriveReleaseIdentity(input: { packageName: string; version: string; git: GitReader }): ReleaseIdentity {
  const tag = `react-v${input.version}`;
  const tagCommit = input.git(["rev-parse", "--verify", "--quiet", `refs/tags/${tag}^{commit}`]);
  const tagObjectType = tagCommit ? input.git(["cat-file", "-t", `refs/tags/${tag}`]) : undefined;
  const tagBody = tagObjectType === "tag" ? input.git(["cat-file", "tag", `refs/tags/${tag}`]) : undefined;
  const diff = (paths: readonly string[]) => (tagCommit ? (input.git(["diff", "--name-only", tagCommit, "HEAD", "--", ...paths]) ?? "").split("\n").map((line) => line.trim()).filter(Boolean) : []);
  const changed = diff(NPM_ARTIFACT_INPUT_PATHS);
  const metadataChanged = diff(NPM_CONTRACT_METADATA_PATHS);
  return {
    packageName: input.packageName,
    version: input.version,
    tag,
    ...(tagCommit && /^[0-9a-f]{40}$/.test(tagCommit) ? { tagCommit } : {}),
    ...(tagObjectType ? { tagObjectType } : {}),
    ...(tagBody !== undefined ? { tagCarriesSignature: /-----BEGIN (SSH|PGP) SIGNATURE-----/.test(tagBody) } : {}),
    expectedDistTag: expectedPublishTag(input.version),
    changedSinceTag: changed,
    metadataChangedSinceTag: metadataChanged,
  };
}
