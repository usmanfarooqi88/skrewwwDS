import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createFsSourceReader } from "@/lib/audit/repo-source";
import { analyzeCssSurface } from "@/lib/ccv/css-surface";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { serializeConsumerContract } from "@/lib/ccv/serialize";
import type { NpmConsumerContract } from "@/lib/ccv/types";
import { validateConsumerContract } from "@/lib/ccv/validate";
import { componentRegistry } from "@/lib/component-registry";
import { buildReactPackageEntry } from "@/lib/react-package/pilot-entry";
import { extractExportedNames } from "@/lib/react-package/release-checks";
import { extractFoundationCss } from "@/lib/shadcn-registry-generator";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const root = process.cwd();
const manifest = JSON.parse(readFileSync(join(root, "packages", "react", "package.json"), "utf8")) as Record<string, any>;

let contract: NpmConsumerContract;
beforeAll(() => {
  contract = deriveNpmContract({ gitSha: SHA });
});

/** A reader that serves the repository with selected files replaced. */
function readerWith(overrides: Record<string, (original: string) => string>) {
  const base = createFsSourceReader(root);
  return (path: string) => {
    const original = base(path);
    return original !== undefined && overrides[path] ? overrides[path](original) : original;
  };
}

describe("CCV-1 npm contract derivation", () => {
  it("derives exactly one contract at the current package version, valid and offline", () => {
    expect(contract.distribution).toBe("npm-package");
    expect(contract.subject).toBe(manifest.name);
    expect(contract.source).toEqual({ gitSha: SHA, packageVersion: manifest.version });
    expect(contract.expectations.package.version).toBe(manifest.version);
    expect(validateConsumerContract(contract)).toEqual({ ok: true });
  });

  it("the public root surface equals the package build's own entry expectations", () => {
    const barrel = readFileSync(join(root, "components", "ui", "index.ts"), "utf8");
    const named = extractExportedNames(buildReactPackageEntry(componentRegistry, barrel).source);
    expect(contract.expectations.exports.values).toEqual(named.values);
    expect(contract.expectations.exports.types).toEqual(named.types);
  });

  it("separates runtime values from type-only exports without guessing by capitalization", () => {
    const { values, types } = contract.expectations.exports;
    expect(values).toEqual(expect.arrayContaining(["Button", "Dialog", "SkrewwwRouterProvider", "TextInput"]));
    expect(types).toEqual(expect.arrayContaining(["ButtonProps", "DialogProps", "SkrewwwNavigate", "SkrewwwRouterProviderProps"]));
    expect(values.filter((name) => types.includes(name))).toEqual([]);
    // capitalized names that are types stay types
    for (const name of ["ButtonSize", "CardElevation", "SpinnerSize", "ValidationMessageType"]) {
      expect(types).toContain(name);
      expect(values).not.toContain(name);
    }
  });

  it("represents Dialog's compound exports as values", () => {
    expect(contract.expectations.exports.byModule.Dialog.values).toEqual([
      "Dialog", "DialogBody", "DialogClose", "DialogContent", "DialogDescription", "DialogFooter", "DialogHeader", "DialogTitle", "DialogTrigger",
    ]);
    expect(contract.expectations.exports.values).toEqual(expect.arrayContaining(contract.expectations.exports.byModule.Dialog.values));
  });

  it("describes the stylesheet export and the public/denied import surface from the real exports map", () => {
    const e = contract.expectations;
    expect(e.css.stylesheetSpecifier).toBe("@skrewww/react/styles.css");
    expect(e.package.exportsMap).toEqual(manifest.exports);
    expect(e.package.publicSpecifiers).toEqual(["@skrewww/react", "@skrewww/react/package.json", "@skrewww/react/styles.css"]);
    for (const denied of ["@skrewww/react/dist/index.js", "@skrewww/react/dist/styles.css", "@skrewww/react/README.md", "@skrewww/react/components/ui/Button"]) {
      expect(e.exports.denied).toContain(denied);
    }
    for (const allowed of e.package.publicSpecifiers) expect(e.exports.denied).not.toContain(allowed);
    expect(e.exports.denied).toEqual([...e.exports.denied].sort());
  });

  it("derives the dependency, peer and optional sets, with ranges, from the manifest", () => {
    const d = contract.expectations.dependencies;
    expect(d.npm).toEqual(Object.keys(manifest.dependencies).sort());
    expect(d.peers).toEqual(Object.keys(manifest.peerDependencies).sort());
    expect(d.optional).toEqual([]);
    expect(d.ranges.npm).toEqual(manifest.dependencies);
    expect(d.ranges.peers).toEqual(manifest.peerDependencies);
  });

  it("derives the lifecycle state: nothing a consumer install would run", () => {
    expect(contract.expectations.package.lifecycleScripts).toEqual({ allowedConsumerRun: [], declaredConsumerRun: [], declaredPublisherOnly: ["prepublishOnly"] });
    const withPostinstall = deriveNpmContract({
      gitSha: SHA,
      read: readerWith({
        "packages/react/package.json": (text) => JSON.stringify({ ...JSON.parse(text), scripts: { postinstall: "node x.js", prepare: "husky", prepublishOnly: "true" } }),
      }),
    });
    // the policy stays empty; a declared consumer-run script becomes visible to the verifier
    expect(withPostinstall.expectations.package.lifecycleScripts).toEqual({
      allowedConsumerRun: [],
      declaredConsumerRun: ["postinstall", "prepare"],
      declaredPublisherOnly: ["prepublishOnly"],
    });
  });

  it("the tarball contract reuses the release checks' file rules", () => {
    const files = contract.expectations.package.files;
    expect(files.required).toEqual(["LICENSE", "README.md", "dist/index.d.ts", "dist/index.js", "dist/styles.css", "package.json"]);
    expect(files.allowedPrefixes).toEqual(["dist/"]);
    expect(contract.expectations.package.publishConfig).toEqual({ access: "public", tag: "beta" });
  });

  it("modes change only the mode and the registry origin", () => {
    const publicContract = deriveNpmContract({ gitSha: SHA, mode: "PUBLIC_NPM" });
    expect(publicContract.mode).toBe("PUBLIC_NPM");
    expect(publicContract.source.registryOrigin).toBe("https://registry.npmjs.org");
    expect(contract.mode).toBe("LOCAL_TARBALL");
    expect(contract.source.registryOrigin).toBeUndefined();
    expect(publicContract.expectations).toEqual(contract.expectations);
  });

  it("CSS: declared and used properties, mode selectors, and the fallback-backed F7 case", () => {
    const css = contract.expectations.css;
    expect(css.declaredCustomProperties.length).toBeGreaterThan(400);
    expect(css.usedCustomProperties).toEqual(expect.arrayContaining(["--semantic-action-primary"]));
    expect(css.declaredCustomProperties).toContain("--semantic-action-primary");
    expect(css.fallbackBackedUses).toEqual(["--color-neutral-900"]);
    expect(css.usedCustomProperties).toContain("--color-neutral-900");
    expect(css.declaredCustomProperties).not.toContain("--color-neutral-900");
    expect(css.unresolvedWithoutFallback).toEqual([]); // a fallback-backed use is not a failure
    expect(css.modeSelectors).toEqual([
      '[data-skrewww-shape="pill"]', '[data-skrewww-shape="rounded"]', '[data-skrewww-shape="sharp"]', '[data-skrewww-shape="squircle"]',
      '[data-skrewww-surface="flat"]', '[data-skrewww-surface="glass"]', '[data-skrewww-surface="gradient"]',
    ]);
    expect(css.sourceFiles).toEqual(expect.arrayContaining(["styles/tokens.css", "styles/foundation.css", "components/ui/button.module.css", "components/ui/dialog.module.css"]));
  });

  it("CSS: a genuinely unresolved use (no declaration, no fallback) is represented, and never confused with a fallback-backed one", () => {
    const broken = deriveNpmContract({ gitSha: SHA, foundationCss: `${extractFoundationCss()}\n.x { color: var(--definitely-missing); margin: var(--soft, 4px); }` });
    expect(broken.expectations.css.unresolvedWithoutFallback).toEqual(["--definitely-missing"]);
    expect(broken.expectations.css.fallbackBackedUses).toEqual(expect.arrayContaining(["--soft"]));
  });

  it("is deterministic and refuses to guess when an authority is missing or disagrees", () => {
    expect(serializeConsumerContract(deriveNpmContract({ gitSha: SHA }))).toBe(serializeConsumerContract(contract));
    expect(() => deriveNpmContract({ gitSha: SHA, read: (path) => (path === "packages/react/package.json" ? undefined : createFsSourceReader(root)(path)) })).toThrow(/package\.json is missing/);
    // the build's regex-based entry and the TypeScript reading of the barrel must agree; an inline `type` modifier splits them
    const split = readerWith({
      "components/ui/index.ts": (text) => text.replace('export { Button } from "@/components/ui/Button";', 'export { Button, type ButtonVariant } from "@/components/ui/Button";'),
    });
    expect(() => deriveNpmContract({ gitSha: SHA, read: split })).toThrow(/disagree about "Button"/);
  });

  describe.skipIf(!existsSync(join(root, "packages", "react", "dist", "styles.css")))("against a locally built package (skipped on a clean checkout)", () => {
    it("the derived CSS surface equals the built stylesheet's", () => {
      const built = analyzeCssSurface([readFileSync(join(root, "packages", "react", "dist", "styles.css"), "utf8")]);
      expect(contract.expectations.css.declaredCustomProperties).toEqual(built.declaredCustomProperties);
      expect(contract.expectations.css.usedCustomProperties).toEqual(built.usedCustomProperties);
      expect(contract.expectations.css.fallbackBackedUses).toEqual(built.fallbackBackedUses);
      expect(contract.expectations.css.modeSelectors).toEqual(built.modeSelectors);
    });
  });
});
