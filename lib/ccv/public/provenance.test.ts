import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { classifyFetch, mapLimit, type FetchOutcome, type Fetcher } from "@/lib/ccv/public/fetcher";
import { selectMode } from "@/lib/ccv/public/modes";
import { consumedPublicArtifactCheck, npmMetadataChecks, npmTarballChecks, rebuildCheck, sri512, type KeysObservation, type PackumentObservation } from "@/lib/ccv/public/npm-provenance";
import { buildExpectedRegistryPayload, directoryCheck, observePublicRegistry, observedPayloadIdentity, payloadIdentity, registryProvenanceChecks, sha256Text } from "@/lib/ccv/public/registry-provenance";
import { deriveRegistryExpectedIdentity, deriveReleaseIdentity, type GitReader, type ReleaseIdentity } from "@/lib/ccv/public/release-identity";
import { verifyNpmSignatures } from "@/lib/ccv/public/signatures";
import { provenanceVerdict } from "@/lib/ccv/public/verdict";
import { buildDistributedRegistryItems } from "@/lib/shadcn-registry-generator";
import type { CcvCheck, CcvResult } from "@/lib/ccv/types";

/**
 * CCV-5 — pure provenance logic, no network and no process. Every public verdict is
 * driven by injected evidence: PASS only when observed == expected, FAIL when the
 * evidence contradicts it, UNKNOWN when it is absent or unobservable.
 */

const ORIGIN = "https://skrewww.com";
const id = (category: string, key: string) => `shadcn:all:${category}:${key}`;
const ok = (body: string, contentType = "application/json; charset=utf-8"): FetchOutcome => ({ kind: "response", status: 200, bytes: new TextEncoder().encode(body), contentType, finalUrl: "" });
const status = (checks: CcvCheck[], suffix: string) => checks.find((check) => check.checkId.endsWith(suffix));

describe("CCV-5 mode selection", () => {
  it("defaults to the LOCAL mode and only selects a public mode when asked", () => {
    expect(selectMode("shadcn-registry", undefined)).toEqual({ ok: true, mode: "LOCAL_CANONICAL", public: false });
    expect(selectMode("npm-package", undefined)).toEqual({ ok: true, mode: "LOCAL_TARBALL", public: false });
    expect(selectMode("shadcn-registry", "PUBLIC_REGISTRY")).toEqual({ ok: true, mode: "PUBLIC_REGISTRY", public: true });
    expect(selectMode("npm-package", "PUBLIC_NPM")).toEqual({ ok: true, mode: "PUBLIC_NPM", public: true });
  });

  it("never substitutes one distribution's mode for the other's, and refuses unknown modes", () => {
    const wrong = selectMode("npm-package", "PUBLIC_REGISTRY");
    expect(wrong).toMatchObject({ ok: false });
    expect(wrong.ok === false && wrong.message).toMatch(/belongs to the shadcn-registry distribution/);
    expect(selectMode("shadcn-registry", "LOCAL_TARBALL")).toMatchObject({ ok: false });
    expect(selectMode("shadcn-registry", "public_registry")).toMatchObject({ ok: false });
  });
});

describe("CCV-5 fetch classification", () => {
  it("only an explicit not-found is evidence of absence; everything that hides the artifact is unavailable", () => {
    expect(classifyFetch({ kind: "response", status: 200, bytes: new Uint8Array(), finalUrl: `${ORIGIN}/r/x.json` }, ORIGIN).class).toBe("ok");
    expect(classifyFetch({ kind: "response", status: 404, bytes: new Uint8Array(), finalUrl: `${ORIGIN}/r/x.json` }, ORIGIN)).toEqual({ class: "absent", status: 404 });
    for (const code of [403, 429, 500, 503]) expect(classifyFetch({ kind: "response", status: code, bytes: new Uint8Array(), finalUrl: `${ORIGIN}/r/x.json` }, ORIGIN).class).toBe("unavailable");
    expect(classifyFetch({ kind: "network-error", message: "ENOTFOUND" }, ORIGIN)).toMatchObject({ class: "unavailable", detail: expect.stringContaining("unreachable") });
    expect(classifyFetch({ kind: "response", status: 200, bytes: new Uint8Array(), finalUrl: "https://elsewhere.example/r/x.json" }, ORIGIN)).toMatchObject({ class: "unavailable", detail: expect.stringContaining("off origin") });
  });

  it("mapLimit preserves order and bounds concurrency", async () => {
    let active = 0;
    let peak = 0;
    const out = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return n * 2;
    });
    expect(out).toEqual([2, 4, 6, 8, 10, 12]);
    expect(peak).toBeLessThanOrEqual(2);
  });
});

describe("CCV-5 PUBLIC_REGISTRY provenance — payload equivalence with the generator output", () => {
  const items = buildDistributedRegistryItems();
  const expected = buildExpectedRegistryPayload(items);
  const serve = (override: (stem: string, text: string) => FetchOutcome | undefined = () => undefined): Fetcher => async (url) => {
    const stem = url.replace(`${ORIGIN}/r/`, "").replace(/\.json$/, "");
    const text = expected.files.get(stem);
    if (text === undefined) return { kind: "response", status: 404, bytes: new Uint8Array(), finalUrl: url };
    const replaced = override(stem, text);
    if (!replaced) return { ...ok(text), finalUrl: url } as FetchOutcome;
    return replaced.kind === "response" ? { ...replaced, finalUrl: url } : replaced;
  };
  const run = async (fetcher: Fetcher, identityProblems?: string[]) => {
    const observed = await observePublicRegistry(ORIGIN, expected, fetcher, 8);
    return { observed, checks: registryProvenanceChecks({ id, origin: ORIGIN, expectedGitSha: "0".repeat(40), expected, observed, identityProblems }) };
  };

  it("expects exactly the generator's index + every distributed item (56 today), derived — not listed", () => {
    expect(expected.files.size).toBe(items.length + 1);
    expect(expected.itemNames).toEqual(items.map((item) => item.name));
    expect(expected.files.get("registry")).toMatch(/"\$schema": "https:\/\/ui\.shadcn\.com\/schema\/registry\.json"/);
  });

  it("PASS: every public file byte-identical → every provenance check passes and the identity is the expected SRI", async () => {
    const { observed, checks } = await run(serve());
    expect(checks.every((check) => check.status === "pass")).toBe(true);
    expect(checks.length).toBe(items.length + 4); // identity, index, item-set, N items, payload-identity
    const expectedIdentity = payloadIdentity(Array.from(expected.files, ([stem, text]) => [stem, sha256Text(text)] as const));
    expect(status(checks, "registry-public:payload-identity")?.expected).toBe(expectedIdentity);
    expect(observedPayloadIdentity(observed, expected.files.size)).toBe(expectedIdentity);
  }, 30_000);

  it("is deterministic: two verifications of the same public payload give identical checks", async () => {
    const first = await run(serve());
    const second = await run(serve());
    expect(JSON.stringify(first.checks)).toBe(JSON.stringify(second.checks));
  }, 30_000);

  it("FAIL: one public item differs by a single byte → PROVENANCE_MISMATCH on that item and on the whole payload, others still pass", async () => {
    const { checks } = await run(serve((stem, text) => (stem === "button" ? ok(text.replace("Button", "Buttoon")) : undefined)));
    expect(status(checks, "registry-public:item/button")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(status(checks, "registry-public:item/button")?.evidence[0].observed).toMatch(/first difference at byte/);
    expect(status(checks, "registry-public:payload-identity")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(status(checks, "registry-public:item/card")?.status).toBe("pass");
    expect(checks.filter((check) => check.status === "fail")).toHaveLength(2);
  }, 30_000);

  it("FAIL: an expected public item is absent (404) → PROVENANCE_MISMATCH, not a silent pass", async () => {
    const { checks } = await run(serve((stem) => (stem === "slider" ? { kind: "response", status: 404, bytes: new Uint8Array(), finalUrl: "" } : undefined)));
    expect(status(checks, "registry-public:item/slider")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(status(checks, "registry-public:payload-identity")?.status).toBe("fail");
  }, 30_000);

  it("FAIL: the public index lists an unexpected item or omits an expected one (item-set)", async () => {
    const index = JSON.parse(expected.files.get("registry") as string) as { items: Array<{ name: string }> };
    const tampered = JSON.stringify({ ...index, items: [...index.items.filter((entry) => entry.name !== "tabs"), { name: "rogue" }] }, null, 2) + "\n";
    const { checks } = await run(serve((stem) => (stem === "registry" ? ok(tampered) : undefined)));
    expect(status(checks, "registry-public:item-set")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(status(checks, "registry-public:item-set")?.evidence.map((entry) => entry.observed).join(" ")).toMatch(/tabs[\s\S]*rogue|rogue[\s\S]*tabs/);
    expect(status(checks, "registry-public:index")?.status).toBe("fail");
  }, 30_000);

  it("UNKNOWN (ENVIRONMENT_ERROR): public service unreachable or 5xx → never PASS and never FAIL", async () => {
    for (const outcome of [{ kind: "network-error", message: "ENOTFOUND skrewww.com" } as FetchOutcome, { kind: "response", status: 503, bytes: new Uint8Array(), finalUrl: "" } as FetchOutcome]) {
      const { checks } = await run(async () => outcome);
      expect(status(checks, "registry-public:index")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
      expect(status(checks, "registry-public:payload-identity")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
      expect(checks.some((check) => check.status === "pass" && !check.checkId.endsWith("expected-identity"))).toBe(false);
      expect(checks.some((check) => check.status === "fail")).toBe(false);
    }
  }, 30_000);

  it("UNKNOWN (PROVENANCE_MISSING): when the expected identity is not established nothing may be claimed, even for byte-identical public files", async () => {
    const { checks } = await run(serve(), ["uncommitted:  M lib/component-registry.ts"]);
    expect(checks.every((check) => check.status === "unknown" && check.failureCode === "PROVENANCE_MISSING")).toBe(true);
    expect(status(checks, "registry-public:expected-identity")?.evidence[0].observed).toMatch(/uncommitted/);
  }, 30_000);

  it("a redirect off the verified origin is unavailable, not provenance", async () => {
    const { checks } = await run(async (url) => ({ ...ok("{}"), finalUrl: url.replace("skrewww.com", "evil.example") }));
    expect(status(checks, "registry-public:index")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
  }, 30_000);

  it("directory check: @skrewww → the public template passes; a different url fails; an unreachable directory is unknown", async () => {
    const entry = (url: string) => ok(JSON.stringify([{ name: "@other", url: "x" }, { name: "@skrewww", url }]));
    const withUrl = (outcome: FetchOutcome): Fetcher => async (url) => ({ ...outcome, finalUrl: url } as FetchOutcome);
    expect(await directoryCheck(id, ORIGIN, withUrl(entry(`${ORIGIN}/r/{name}.json`)))).toMatchObject({ status: "pass" });
    expect(await directoryCheck(id, ORIGIN, withUrl(entry("https://old.example/r/{name}.json")))).toMatchObject({ status: "fail", failureCode: "INSTALL_FAILED" });
    expect(await directoryCheck(id, ORIGIN, async () => ({ kind: "network-error", message: "ETIMEDOUT" }))).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
  });
});

describe("CCV-5 expected identity is derived from git, not typed", () => {
  const reader = (answers: Record<string, string | undefined>): GitReader => (args) => answers[args.slice(0, 3).join(" ")] ?? answers[args[0]];

  it("registry: HEAD is the expected commit; uncommitted generator inputs are reported", () => {
    const sha = "a".repeat(40);
    expect(deriveRegistryExpectedIdentity(reader({ "rev-parse HEAD": sha, status: "" }))).toEqual({ gitSha: sha, dirtyGeneratorInputs: [] });
    expect(deriveRegistryExpectedIdentity(reader({ "rev-parse HEAD": sha, status: " M lib/component-registry.ts\n?? components/ui/New.tsx" }))?.dirtyGeneratorInputs).toEqual(["M lib/component-registry.ts", "?? components/ui/New.tsx"]);
    expect(deriveRegistryExpectedIdentity(reader({ "rev-parse HEAD": "not-a-sha" }))).toBeUndefined();
  });

  it("npm: version → release tag → tag commit, signature structure and the repository's own dist-tag rule", () => {
    const commit = "6ea9e0d0a5c0980f88153e998ff5667acc3aab93";
    const identity = deriveReleaseIdentity({
      packageName: "@skrewww/react",
      version: "0.1.0-beta.2",
      git: reader({ "rev-parse --verify --quiet": commit, "cat-file -t refs/tags/react-v0.1.0-beta.2": "tag", "cat-file tag refs/tags/react-v0.1.0-beta.2": "object x\n-----BEGIN SSH SIGNATURE-----\nabc", diff: "" }),
    });
    expect(identity).toMatchObject({ tag: "react-v0.1.0-beta.2", tagCommit: commit, tagObjectType: "tag", tagCarriesSignature: true, expectedDistTag: "beta", changedSinceTag: [], metadataChangedSinceTag: [] });
    const commit2 = "6ea9e0d0a5c0980f88153e998ff5667acc3aab93";
    const byPath: GitReader = (args) => {
      if (args[0] === "diff") return args.includes("packages/react") ? "packages/react/src/x.ts\n" : "lib/component-registry-forms.ts\npackage.json\n";
      return reader({ "rev-parse --verify --quiet": commit2, "cat-file -t refs/tags/react-v0.1.0-beta.2": "tag" })(args);
    };
    const split = deriveReleaseIdentity({ packageName: "@skrewww/react", version: "0.1.0-beta.2", git: byPath });
    expect(split.changedSinceTag).toEqual(["packages/react/src/x.ts"]);
    expect(split.metadataChangedSinceTag).toEqual(["lib/component-registry-forms.ts", "package.json"]);
    const missing = deriveReleaseIdentity({ packageName: "@skrewww/react", version: "0.1.0-beta.2", git: reader({}) });
    expect(missing.tagCommit).toBeUndefined();
    expect(deriveReleaseIdentity({ packageName: "@skrewww/react", version: "1.0.0", git: reader({}) }).expectedDistTag).toBeNull();
  });
});

describe("CCV-5 npm registry signatures (real ECDSA, no network)", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const keyDer = publicKey.export({ type: "spki", format: "der" }).toString("base64");
  const integrity = `sha512-${Buffer.from("tarball").toString("base64")}`;
  const message = Buffer.from(`@skrewww/react@0.1.0-beta.2:${integrity}`);
  const goodSig = sign("sha256", message, privateKey).toString("base64");
  const keys = [{ keyid: "SHA256:test-key", key: keyDer }];

  it("accepts a signature over name@version:integrity and rejects any other message or key", () => {
    const base = { name: "@skrewww/react", version: "0.1.0-beta.2", integrity, keys };
    expect(verifyNpmSignatures({ ...base, signatures: [{ keyid: "SHA256:test-key", sig: goodSig }] })).toEqual({ valid: ["SHA256:test-key"], invalid: [], unknownKey: [] });
    expect(verifyNpmSignatures({ ...base, version: "0.1.0-beta.3", signatures: [{ keyid: "SHA256:test-key", sig: goodSig }] }).invalid).toEqual(["SHA256:test-key"]);
    expect(verifyNpmSignatures({ ...base, integrity: `${integrity}x`, signatures: [{ keyid: "SHA256:test-key", sig: goodSig }] }).invalid).toEqual(["SHA256:test-key"]);
    expect(verifyNpmSignatures({ ...base, signatures: [{ keyid: "SHA256:other", sig: goodSig }] }).unknownKey).toEqual(["SHA256:other"]);
    expect(verifyNpmSignatures({ ...base, signatures: [{ keyid: "SHA256:test-key", sig: "!!!" }] }).invalid).toEqual(["SHA256:test-key"]);
  });
});

describe("CCV-5 PUBLIC_NPM provenance checks", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const keys: KeysObservation = { class: "ok", keys: [{ keyid: "SHA256:test-key", key: publicKey.export({ type: "spki", format: "der" }).toString("base64") }] };
  const pkg = "@skrewww/react";
  const version = "0.1.0-beta.2";
  const tagCommit = "6ea9e0d0a5c0980f88153e998ff5667acc3aab93";
  const integrity = `sha512-${Buffer.from("public tarball").toString("base64")}`;
  const release: ReleaseIdentity = { packageName: pkg, version, tag: `react-v${version}`, tagCommit, tagObjectType: "tag", tagCarriesSignature: true, expectedDistTag: "beta", changedSinceTag: [], metadataChangedSinceTag: [] };
  const sig = sign("sha256", Buffer.from(`${pkg}@${version}:${integrity}`), privateKey).toString("base64");
  const meta = { version, gitHead: tagCommit, dist: { integrity, shasum: "a9ea35a8e994a5de115af61e153738925bf7db0d", tarball: `https://registry.npmjs.org/${pkg}/-/react-${version}.tgz`, signatures: [{ keyid: "SHA256:test-key", sig }] } };
  const packument = (over: Partial<typeof meta> = {}, distTags: Record<string, string> = { beta: version, latest: "0.1.0-beta.1" }): PackumentObservation => ({ class: "ok", origin: "https://registry.npmjs.org", versions: { [version]: { ...meta, ...over } }, distTags });
  const idN = (category: string, key: string) => `npm:${pkg}:${category}:${key}`;
  const run = (over: { release?: Partial<ReleaseIdentity>; packument?: PackumentObservation; keys?: KeysObservation } = {}) =>
    npmMetadataChecks({ id: idN, pkg, origin: "https://registry.npmjs.org", release: { ...release, ...over.release }, packument: over.packument ?? packument(), keys: over.keys ?? keys });

  it("PASS: gitHead equals the tag commit, dist-tags follow the publish rule, the registry signature verifies, sources match the tag", () => {
    const { checks, meta: observed } = run();
    expect(observed?.gitHead).toBe(tagCommit);
    expect(checks.map((check) => `${check.checkId.split(":").pop()}=${check.status}`)).toEqual(["expected-release=pass", "registry-version=pass", "git-head=pass", "dist-tags=pass", "signatures=pass", "source-identity=pass"]);
  });

  it("FAIL: gitHead differs from the release tag's commit (PROVENANCE_MISMATCH)", () => {
    expect(status(run({ packument: packument({ gitHead: "b".repeat(40) }) }).checks, ":git-head")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH", expected: tagCommit, actual: "b".repeat(40) });
  });

  it("UNKNOWN (PROVENANCE_MISSING): the registry exposes no gitHead", () => {
    expect(status(run({ packument: packument({ gitHead: undefined }) }).checks, ":git-head")).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
  });

  it("UNKNOWN (PROVENANCE_MISSING): the release tag is not in the checkout → no expected identity, no pass anywhere that depends on it", () => {
    const { checks } = run({ release: { tagCommit: undefined, changedSinceTag: [], metadataChangedSinceTag: [] } });
    expect(status(checks, ":expected-release")).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
    expect(status(checks, ":git-head")).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
    expect(status(checks, ":source-identity")).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
  });

  it("FAIL: the version is not published / the package is absent; UNKNOWN: the registry is unreachable", () => {
    expect(status(run({ packument: { class: "ok", origin: "x", versions: {}, distTags: {} } }).checks, ":registry-version")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(status(run({ packument: { class: "absent", status: 404 } }).checks, ":registry-version")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    const down = run({ packument: { class: "unavailable", detail: "HTTP 503" } }).checks;
    expect(status(down, ":registry-version")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(status(down, ":git-head")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(down.some((check) => check.status === "fail")).toBe(false);
  });

  it("FAIL: a prerelease promoted to latest, or missing its own dist-tag", () => {
    expect(status(run({ packument: packument({}, { beta: version, latest: version }) }).checks, ":dist-tags")?.status).toBe("fail");
    expect(status(run({ packument: packument({}, { latest: "0.1.0-beta.1" }) }).checks, ":dist-tags")?.status).toBe("fail");
    expect(status(run({ release: { expectedDistTag: null }, packument: packument({}, { latest: version }) }).checks, ":dist-tags")?.status).toBe("pass");
  });

  it("signatures: invalid → FAIL; none → UNKNOWN missing; unknown key id → UNKNOWN missing; keys unreachable → UNKNOWN environment", () => {
    expect(status(run({ packument: packument({ dist: { ...meta.dist, integrity: `${integrity}x` } }) }).checks, ":signatures")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(status(run({ packument: packument({ dist: { ...meta.dist, signatures: [] } }) }).checks, ":signatures")).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
    expect(status(run({ packument: packument({ dist: { ...meta.dist, signatures: [{ keyid: "SHA256:nope", sig }] } }) }).checks, ":signatures")).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
    expect(status(run({ keys: { class: "unavailable", detail: "ETIMEDOUT" } }).checks, ":signatures")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
  });

  it("UNKNOWN: artifact-determining sources changed since the release tag, so a HEAD-derived contract may not describe the release", () => {
    const changed = status(run({ release: { changedSinceTag: ["components/ui/Button.tsx"] } }).checks, ":source-identity");
    expect(changed).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
    expect(changed?.evidence.map((entry) => entry.observed).join(" ")).toMatch(/Button\.tsx/);
  });

  it("PASS with reported (non-gating) drift: only contract metadata (registry text, npm scripts) differs since the tag", () => {
    const drift = status(run({ release: { metadataChangedSinceTag: ["lib/component-registry-forms.ts", "package.json"] } }).checks, ":source-identity");
    expect(drift).toMatchObject({ status: "pass" });
    expect(drift?.evidence.map((entry) => entry.observed).join(" ")).toMatch(/reported, not gating.*component-registry-forms\.ts.*package\.json/);
  });

  it("tarball identity: integrity and shasum must equal the registry's", () => {
    const tarball = { integrity, shasum: meta.dist.shasum, sha256: "a".repeat(64), bytes: 10 };
    expect(npmTarballChecks({ id: idN, pkg, version, meta, tarball })[0].status).toBe("pass");
    expect(npmTarballChecks({ id: idN, pkg, version, meta, tarball: { ...tarball, integrity: sri512(new Uint8Array([1])) } })[0]).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(npmTarballChecks({ id: idN, pkg, version, meta, tarball: { ...tarball, shasum: "0".repeat(40) } })[0].status).toBe("fail");
    expect(npmTarballChecks({ id: idN, pkg, version, meta: undefined, tarball })[0]).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
  });

  it("rebuild at the release commit: identical → PASS; differing → FAIL with the file diff; not performed / failed → UNKNOWN", () => {
    const files = new Map([["dist/index.js", "aaa"], ["package.json", "bbb"]]);
    const base = { id: idN, pkg, version, tagCommit, publicIntegrity: integrity, publicFiles: files };
    expect(rebuildCheck({ ...base, rebuilt: { ok: true, integrity, files } }).status).toBe("pass");
    const differing = rebuildCheck({ ...base, rebuilt: { ok: true, integrity: sri512(new Uint8Array([2])), files: new Map([["dist/index.js", "CHANGED"], ["package.json", "bbb"], ["extra.js", "x"]]) } });
    expect(differing).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(differing.evidence.map((entry) => entry.observed).join(" ")).toMatch(/dist\/index\.js[\s\S]*extra\.js/);
    expect(rebuildCheck({ ...base, rebuilt: undefined })).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(rebuildCheck({ ...base, rebuilt: { ok: false, reason: "npm run build:react-package: exit 1", environment: false } })).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(rebuildCheck({ ...base, tagCommit: undefined })).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
  });

  describe("accidental local artifact usage is detected", () => {
    const good = { id: idN, pkg, version, registryOrigin: "https://registry.npmjs.org", dependencySpec: version, configuredRegistry: "https://registry.npmjs.org/", lockEntry: { resolved: meta.dist.tarball, integrity }, installedIsLink: false, installedVersion: version, expectedTarball: meta.dist.tarball, expectedIntegrity: integrity, consumerHasNpmrc: false };
    it("PASS only for the exact registry spec, the public tarball URL and integrity in the lockfile, a real directory and the default registry", () => {
      expect(consumedPublicArtifactCheck(good).status).toBe("pass");
    });
    it.each([
      ["a file: tarball spec", { dependencySpec: "file:/tmp/x.tgz" }],
      ["a link:/workspace: spec", { dependencySpec: "workspace:*" }],
      ["a lockfile that resolved to a local file", { lockEntry: { resolved: "file:../pack/skrewww-react-0.1.0-beta.2.tgz", integrity } }],
      ["a lockfile with another integrity", { lockEntry: { resolved: meta.dist.tarball, integrity: `${integrity}x` } }],
      ["a symlinked install (npm link)", { installedIsLink: true }],
      ["a lockfile link entry", { lockEntry: { resolved: meta.dist.tarball, integrity, link: true } }],
      ["a non-public registry", { configuredRegistry: "http://127.0.0.1:4873/" }],
      ["a consumer .npmrc", { consumerHasNpmrc: true }],
      ["another installed version", { installedVersion: "0.0.1" }],
      ["no lockfile entry", { lockEntry: undefined }],
    ])("FAIL (PROVENANCE_MISMATCH): %s", (_label, over) => {
      expect(consumedPublicArtifactCheck({ ...good, ...over })).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    });
  });
});

describe("CCV-5 provenance verdict is separate from 'it installed'", () => {
  const result = (mode: CcvResult["mode"], checks: Array<[string, CcvCheck["status"]]>): CcvResult => ({
    schemaVersion: "1.0.0", distribution: mode.includes("NPM") || mode === "LOCAL_TARBALL" ? "npm-package" : "shadcn-registry", mode, subject: "x", environment: {}, source: { expectedGitSha: "0".repeat(40) },
    checks: checks.map(([checkId, st]) => ({ checkId, status: st, claim: "c", authority: "generator", evidence: [] })), summary: { pass: 0, fail: 0, unknown: 0, notApplicable: 0 },
  });
  it("LOCAL modes are NOT_EVALUATED; a public mode passes only with passing provenance and nothing unknown or failing", () => {
    expect(provenanceVerdict(result("LOCAL_CANONICAL", [["shadcn:all:file:a", "pass"]])).state).toBe("NOT_EVALUATED");
    expect(provenanceVerdict(result("PUBLIC_REGISTRY", [["shadcn:all:registry-public:index", "pass"], ["shadcn:all:file:a", "pass"]])).state).toBe("PASS");
    expect(provenanceVerdict(result("PUBLIC_REGISTRY", [["shadcn:all:registry-public:index", "pass"], ["shadcn:all:registry-public:item/a", "unknown"]])).state).toBe("UNKNOWN");
    expect(provenanceVerdict(result("PUBLIC_NPM", [["npm:p:provenance:git-head", "pass"], ["npm:p:provenance:integrity", "fail"]])).state).toBe("FAIL");
  });
  it("a public run whose every install/runtime check passed but which has NO provenance check is UNKNOWN, never PASS", () => {
    expect(provenanceVerdict(result("PUBLIC_NPM", [["npm:p:install:tarball", "pass"], ["npm:p:build:vite", "pass"]])).state).toBe("UNKNOWN");
  });
  it("the shadcn directory service check does not decide provenance", () => {
    expect(provenanceVerdict(result("PUBLIC_REGISTRY", [["shadcn:all:registry-public:index", "pass"], ["shadcn:all:registry-public:directory", "fail"]])).state).toBe("PASS");
  });
});
