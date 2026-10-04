/**
 * CCV-1 — the closed failure taxonomy for Consumer Contract Verification.
 *
 * Deterministic and non-subjective: every code names a mechanical way an
 * installed result can differ from its contract. There is no quality score.
 *
 * `attribution` keeps three things apart that must never be conflated:
 * - `skrewww`     — the Skrewww payload, package or contract is the cause;
 * - `upstream`    — an installer/tool transformed the payload (observable
 *                    evidence, never silently accepted as parity);
 * - `environment` — the run could not reach a conclusion (network, tool crash,
 *                    timeout). It is never a contract failure: a check hit by
 *                    it is `unknown`, not `fail`.
 */

export const CCV_FAILURE_ATTRIBUTIONS = ["skrewww", "upstream", "environment"] as const;
export type CcvFailureAttribution = (typeof CCV_FAILURE_ATTRIBUTIONS)[number];

export const CCV_FAILURE_AREAS = ["environment", "install", "files", "exports", "imports", "build", "dependencies", "css", "postinstall", "provenance", "compatibility", "runtime"] as const;
export type CcvFailureArea = (typeof CCV_FAILURE_AREAS)[number];

export type CcvFailureDefinition = {
  area: CcvFailureArea;
  attribution: CcvFailureAttribution;
  meaning: string;
};

export const CCV_FAILURES = {
  ENVIRONMENT_ERROR: { area: "environment", attribution: "environment", meaning: "The run could not reach a conclusion (network unavailable, upstream tool crashed, timeout, disk). Not a contract failure." },

  INSTALL_FAILED: { area: "install", attribution: "skrewww", meaning: "The installer ran and refused or failed because of the Skrewww payload or package." },
  MANIFEST_MISMATCH: { area: "files", attribution: "skrewww", meaning: "A manifest-level disagreement: a served manifest differs from the generator output at the expected commit, contributing manifests embed different bytes for one target, or the installer resolved items the manifests do not justify." },

  FILE_MISSING: { area: "files", attribution: "skrewww", meaning: "An expected file is absent from the installed result." },
  FILE_UNEXPECTED: { area: "files", attribution: "skrewww", meaning: "A file was added, removed or modified outside the expected target set." },
  FILE_CONTENT_MISMATCH: { area: "files", attribution: "skrewww", meaning: "An installed file's bytes differ from the expected bytes and no known installer transformation reproduces the installed bytes exactly." },
  UPSTREAM_TRANSFORM: { area: "files", attribution: "upstream", meaning: "A known installer transformation applied to the expected bytes reproduces the installed bytes exactly. Still a contract FAIL: the attribution names who changed the bytes, never that the change is acceptable." },

  EXPORT_MISSING: { area: "exports", attribution: "skrewww", meaning: "An expected value or type export is not importable from the installed result." },
  EXPORT_UNEXPECTED: { area: "exports", attribution: "skrewww", meaning: "The installed result exports a name the contract does not expect." },
  DEEP_IMPORT_EXPOSED: { area: "exports", attribution: "skrewww", meaning: "A specifier the package `exports` map must deny resolved from the consumer." },

  IMPORT_UNRESOLVED: { area: "imports", attribution: "skrewww", meaning: "An import in installed Skrewww code resolves to no installed file, declared dependency or documented host requirement." },
  TYPECHECK_FAILED: { area: "build", attribution: "skrewww", meaning: "The consumer's TypeScript check failed over the installed result." },
  BUILD_FAILED: { area: "build", attribution: "skrewww", meaning: "The consumer's production build failed over the installed result." },

  DEPENDENCY_MISMATCH: { area: "dependencies", attribution: "skrewww", meaning: "The installed npm dependency set differs from the declared set." },
  PEER_DEPENDENCY_MISMATCH: { area: "dependencies", attribution: "skrewww", meaning: "The peer-dependency declaration or its satisfaction by the consumer differs from the contract." },

  CSS_DECLARATION_MISSING: { area: "css", attribution: "skrewww", meaning: "Delivered CSS uses a custom property that is declared nowhere in the delivered set and has no fallback." },
  CSS_RUNTIME_UNRESOLVED: { area: "runtime", attribution: "skrewww", meaning: "A representative computed style did not resolve in a real browser." },

  LIFECYCLE_SCRIPT_UNEXPECTED: { area: "postinstall", attribution: "skrewww", meaning: "A package install-time lifecycle script is present that the contract does not allow." },
  POSTINSTALL_SIDE_EFFECT: { area: "postinstall", attribution: "skrewww", meaning: "An install produced a side effect outside the declared target set or declared dependencies." },

  PROVENANCE_MISSING: { area: "provenance", attribution: "skrewww", meaning: "The evidence needed to tie the artifact to an expected commit is absent." },
  PROVENANCE_MISMATCH: { area: "provenance", attribution: "skrewww", meaning: "The artifact does not match the expected commit (hash, gitHead, tag or registry equivalence)." },

  COMPATIBILITY_BREAK: { area: "compatibility", attribution: "skrewww", meaning: "A consumer-visible custom property or export present in the baseline is gone or renamed." },

  INTERACTION_FAILED: { area: "runtime", attribution: "skrewww", meaning: "A scripted representative interaction did not behave as its scenario asserts." },
} as const satisfies Record<string, CcvFailureDefinition>;

export type CcvFailureCode = keyof typeof CCV_FAILURES;

export const CCV_FAILURE_CODES = Object.keys(CCV_FAILURES) as CcvFailureCode[];

export function isCcvFailureCode(value: unknown): value is CcvFailureCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CCV_FAILURES, value);
}

export function failureAttribution(code: CcvFailureCode): CcvFailureAttribution {
  return CCV_FAILURES[code].attribution;
}
