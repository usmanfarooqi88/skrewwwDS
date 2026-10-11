import { createHash } from "node:crypto";
import { classifyFetch, mapLimit, type FetchClass, type Fetcher } from "@/lib/ccv/public/fetcher";
import { serializeServedItem } from "@/lib/ccv/runner/registry-server";
import { evidence, listEvidence } from "@/lib/ccv/runner/result";
import type { CcvCheck } from "@/lib/ccv/types";
import { buildRegistryIndex, type ShadcnRegistryItem } from "@/lib/shadcn-registry-generator";

/**
 * CCV-5 — PUBLIC_REGISTRY provenance by PAYLOAD EQUIVALENCE (docs §11).
 *
 * The public shadcn payload carries no version, SHA or timestamp, and CCV adds none
 * (a SHA in every manifest would churn every payload on every commit; the registry
 * stays one generated truth). The generator is deterministic, so the strongest
 * machine-verifiable statement is: every public `/r/*.json` file is BYTE-IDENTICAL to
 * what the existing generator emits at the expected commit. The expected bytes come
 * from the same `ShadcnRegistryItem[]` the verifier already derives its contracts
 * from — nothing is typed in a second time.
 *
 * What this proves: public content ≡ generator(expected commit). What it cannot
 * prove: which deployment serves the bytes (not visible to a consumer); two commits
 * that generate the same registry are indistinguishable by design.
 */

export type IdFn = (category: string, key: string) => string;

export type ExpectedRegistryPayload = {
  /** Keyed by file stem: `registry` and every item name. */
  files: Map<string, string>;
  itemNames: string[];
};

const serialize = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
export const sha256Text = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");
const sha256Bytes = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

export function buildExpectedRegistryPayload(items: readonly ShadcnRegistryItem[]): ExpectedRegistryPayload {
  const files = new Map<string, string>();
  files.set("registry", serialize(buildRegistryIndex(items as ShadcnRegistryItem[])));
  for (const item of items) files.set(item.name, serializeServedItem(item));
  return { files, itemNames: items.map((item) => item.name) };
}

/** An SRI digest over `<stem>.json <sha256>` lines in code-unit order: one machine-comparable identity for the whole public payload. */
export function payloadIdentity(entries: ReadonlyArray<readonly [string, string]>): string {
  const lines = [...entries].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([stem, hash]) => `${stem}.json ${hash}`);
  return `sha256-${createHash("sha256").update(`${lines.join("\n")}\n`, "utf8").digest("base64")}`;
}

export type ObservedFile = { stem: string; url: string; fetch: FetchClass; sha256?: string; bytes?: number; text?: string };
export type PublicObservation = { origin: string; files: Map<string, ObservedFile>; indexNames?: string[] };

export async function observePublicRegistry(origin: string, expected: ExpectedRegistryPayload, fetcher: Fetcher, concurrency = 6): Promise<PublicObservation> {
  const stems = ["registry", ...expected.itemNames];
  const observed = await mapLimit(stems, concurrency, async (stem): Promise<ObservedFile> => {
    const url = `${origin}/r/${stem}.json`;
    const fetched = classifyFetch(await fetcher(url), origin);
    if (fetched.class !== "ok") return { stem, url, fetch: fetched };
    return { stem, url, fetch: fetched, sha256: sha256Bytes(fetched.bytes), bytes: fetched.bytes.length, text: new TextDecoder().decode(fetched.bytes) };
  });
  const files = new Map(observed.map((file) => [file.stem, file]));
  let indexNames: string[] | undefined;
  const index = files.get("registry");
  if (index?.text) {
    try {
      const parsed = JSON.parse(index.text) as { items?: Array<{ name?: unknown }> };
      indexNames = (parsed.items ?? []).map((entry) => String(entry.name));
    } catch {
      indexNames = undefined;
    }
  }
  return { origin, files, ...(indexNames ? { indexNames } : {}) };
}

type Verdict = Pick<CcvCheck, "status" | "failureCode">;

function firstDifference(expected: string, observed: string): string {
  const limit = Math.min(expected.length, observed.length);
  let offset = 0;
  while (offset < limit && expected[offset] === observed[offset]) offset += 1;
  return `first difference at byte ${offset} (expected ${expected.length} bytes, observed ${observed.length})`;
}

function judgeFile(expected: string, file: ObservedFile | undefined): { verdict: Verdict; detail: string } {
  if (!file) return { verdict: { status: "unknown", failureCode: "ENVIRONMENT_ERROR" }, detail: "not fetched" };
  if (file.fetch.class === "absent") return { verdict: { status: "fail", failureCode: "PROVENANCE_MISMATCH" }, detail: `HTTP ${file.fetch.status}: the expected public artifact is absent` };
  if (file.fetch.class === "unavailable") return { verdict: { status: "unknown", failureCode: "ENVIRONMENT_ERROR" }, detail: `could not be observed: ${file.fetch.detail}` };
  if (file.sha256 === sha256Text(expected)) return { verdict: { status: "pass" }, detail: `byte-identical to the generator output (${file.bytes} bytes)` };
  return { verdict: { status: "fail", failureCode: "PROVENANCE_MISMATCH" }, detail: `differs from the generator output: ${firstDifference(expected, file.text ?? "")}` };
}

export type RegistryProvenanceInput = {
  id: IdFn;
  origin: string;
  expectedGitSha: string;
  expected: ExpectedRegistryPayload;
  observed: PublicObservation;
  /** Non-empty means the expected identity could not be established (e.g. uncommitted generator inputs): nothing may be claimed. */
  identityProblems?: readonly string[];
};

export function registryProvenanceChecks(input: RegistryProvenanceInput): CcvCheck[] {
  const { id, origin, expected, observed } = input;
  const expectedEntries = Array.from(expected.files, ([stem, text]) => [stem, sha256Text(text)] as const);
  const expectedDigest = payloadIdentity(expectedEntries);
  const checks: CcvCheck[] = [];

  if (input.identityProblems && input.identityProblems.length > 0) {
    const unknown = { status: "unknown" as const, failureCode: "PROVENANCE_MISSING" as const };
    const reason = `expected identity not established: ${input.identityProblems.slice(0, 6).join("; ")}`;
    const notEvaluated = (checkId: string, claim: string): CcvCheck => ({ checkId, ...unknown, claim, authority: "generator", evidence: [evidence("source", "expected-identity", reason)] });
    return [
      notEvaluated(id("registry-public", "expected-identity"), `the expected commit and its generator output are established (${input.expectedGitSha})`),
      notEvaluated(id("registry-public", "index"), `the public ${origin}/r/registry.json is byte-identical to the generator output at the expected commit`),
      notEvaluated(id("registry-public", "item-set"), "the public index lists exactly the items the expected commit distributes"),
      ...expected.itemNames.map((name) => notEvaluated(id("registry-public", `item/${name}`), `the public ${origin}/r/${name}.json is byte-identical to the generator output at the expected commit`)),
      notEvaluated(id("registry-public", "payload-identity"), "the whole public payload has the identity the expected commit generates"),
    ];
  }

  checks.push({
    checkId: id("registry-public", "expected-identity"),
    status: "pass",
    claim: `the expected commit and its generator output are established (${input.expectedGitSha})`,
    authority: "generator",
    evidence: [
      evidence("source", "expected-commit", `${input.expectedGitSha}; every file the registry generator reads is committed`),
      evidence("registry-payload", "expected-payload", `${expected.files.size} files (index + ${expected.itemNames.length} items) from buildDistributedRegistryItems(); identity ${expectedDigest}`),
    ],
  });

  const indexFile = observed.files.get("registry");
  const indexJudged = judgeFile(expected.files.get("registry") ?? "", indexFile);
  checks.push({
    checkId: id("registry-public", "index"),
    ...indexJudged.verdict,
    claim: `the public ${origin}/r/registry.json is byte-identical to the generator output at the expected commit`,
    authority: "generator",
    expected: sha256Text(expected.files.get("registry") ?? ""),
    ...(indexFile?.sha256 ? { actual: indexFile.sha256 } : {}),
    evidence: [evidence("registry-payload", `${origin}/r/registry.json`, indexJudged.detail, indexFile?.sha256)],
  });

  const expectedNames = new Set(expected.itemNames);
  let setVerdict: Verdict;
  let setEvidence = [] as CcvCheck["evidence"];
  if (!observed.indexNames) {
    const absent = indexFile?.fetch.class === "absent";
    setVerdict = absent ? { status: "fail", failureCode: "PROVENANCE_MISMATCH" } : { status: "unknown", failureCode: "ENVIRONMENT_ERROR" };
    setEvidence = [evidence("registry-payload", "index-items", absent ? "the public index is absent" : "the public index could not be read, so its item set is unknown")];
  } else {
    const names = new Set(observed.indexNames);
    const missing = expected.itemNames.filter((name) => !names.has(name));
    const extra = observed.indexNames.filter((name) => !expectedNames.has(name));
    setVerdict = missing.length === 0 && extra.length === 0 && names.size === observed.indexNames.length ? { status: "pass" } : { status: "fail", failureCode: "PROVENANCE_MISMATCH" };
    setEvidence = setVerdict.status === "pass"
      ? [evidence("registry-payload", "index-items", `${observed.indexNames.length} public index items == the ${expected.itemNames.length} expected`)]
      : [...listEvidence("registry-payload", "missing-from-public-index", missing), ...listEvidence("registry-payload", "unexpected-in-public-index", extra), ...(names.size !== observed.indexNames.length ? [evidence("registry-payload", "duplicates", "the public index repeats an item name")] : [])];
  }
  checks.push({ checkId: id("registry-public", "item-set"), ...setVerdict, claim: "the public index lists exactly the items the expected commit distributes", authority: "generator", evidence: setEvidence });

  for (const name of expected.itemNames) {
    const file = observed.files.get(name);
    const judged = judgeFile(expected.files.get(name) ?? "", file);
    checks.push({
      checkId: id("registry-public", `item/${name}`),
      ...judged.verdict,
      claim: `the public ${origin}/r/${name}.json is byte-identical to the generator output at the expected commit`,
      authority: "generator",
      expected: sha256Text(expected.files.get(name) ?? ""),
      ...(file?.sha256 ? { actual: file.sha256 } : {}),
      evidence: [evidence("registry-payload", `${origin}/r/${name}.json`, judged.detail, file?.sha256)],
    });
  }

  const compared = checks.filter((check) => check.checkId !== id("registry-public", "expected-identity") && check.checkId !== id("registry-public", "item-set"));
  const failed = compared.filter((check) => check.status === "fail");
  const unknown = compared.filter((check) => check.status === "unknown");
  const observedEntries = Array.from(observed.files.values()).filter((file) => file.sha256).map((file) => [file.stem, file.sha256 as string] as const);
  const observedDigest = observedEntries.length === expectedEntries.length ? payloadIdentity(observedEntries) : undefined;
  checks.push({
    checkId: id("registry-public", "payload-identity"),
    status: failed.length > 0 ? "fail" : unknown.length > 0 ? "unknown" : "pass",
    ...(failed.length > 0 ? { failureCode: "PROVENANCE_MISMATCH" as const } : unknown.length > 0 ? { failureCode: "ENVIRONMENT_ERROR" as const } : {}),
    claim: "the whole public payload has the identity the expected commit generates",
    authority: "generator",
    expected: expectedDigest,
    ...(observedDigest ? { actual: observedDigest } : {}),
    evidence: [
      evidence("registry-payload", "payload-identity", failed.length === 0 && unknown.length === 0 ? `identical: ${expectedDigest}` : `${failed.length} file(s) differ or are absent, ${unknown.length} could not be observed; expected ${expectedDigest}${observedDigest ? `, observed ${observedDigest}` : ""}`),
      ...(failed.length > 0 ? listEvidence("registry-payload", "differing", failed.map((check) => check.checkId.split(":").slice(-1)[0])) : []),
    ],
  });
  return checks;
}

/** Observed identity as an SRI for `CcvResult.source.integrity`; undefined unless EVERY public file was observed. */
export function observedPayloadIdentity(observed: PublicObservation, expectedFileCount: number): string | undefined {
  const entries = Array.from(observed.files.values()).filter((file) => file.sha256).map((file) => [file.stem, file.sha256 as string] as const);
  return entries.length === expectedFileCount ? payloadIdentity(entries) : undefined;
}

/** Optional: shadcn's own directory must resolve `@skrewww` to the same public path. */
export async function directoryCheck(id: IdFn, origin: string, fetcher: Fetcher): Promise<CcvCheck> {
  const directory = "https://ui.shadcn.com";
  const claim = `the official shadcn directory resolves @skrewww to ${origin}/r/{name}.json`;
  const fetched = classifyFetch(await fetcher(`${directory}/r/registries.json`), directory);
  if (fetched.class !== "ok") {
    return { checkId: id("registry-public", "directory"), status: "unknown", failureCode: "ENVIRONMENT_ERROR", claim, authority: "npm-registry-metadata", evidence: [evidence("registry-payload", `${directory}/r/registries.json`, fetched.class === "absent" ? `HTTP ${fetched.status}` : fetched.detail)] };
  }
  let entry: { url?: string } | undefined;
  try {
    entry = (JSON.parse(new TextDecoder().decode(fetched.bytes)) as Array<{ name?: string; url?: string }>).find((candidate) => candidate.name === "@skrewww");
  } catch {
    entry = undefined;
  }
  const expectedUrl = `${origin}/r/{name}.json`;
  const ok = entry?.url === expectedUrl;
  return {
    checkId: id("registry-public", "directory"),
    status: ok ? "pass" : "fail",
    ...(ok ? {} : { failureCode: "INSTALL_FAILED" as const }),
    claim,
    authority: "npm-registry-metadata",
    expected: expectedUrl,
    actual: entry?.url ?? "(no @skrewww entry)",
    evidence: [evidence("registry-payload", `${directory}/r/registries.json`, entry ? `@skrewww → ${entry.url}` : "no @skrewww entry in the directory")],
  };
}
