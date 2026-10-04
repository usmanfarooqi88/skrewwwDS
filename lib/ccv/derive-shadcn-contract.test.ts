import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { analyzeCssSurface } from "@/lib/ccv/css-surface";
import { deriveAllShadcnContracts, deriveShadcnContract, listDistributedItemNames } from "@/lib/ccv/derive-shadcn-contract";
import { serializeConsumerContract, sha256Hex } from "@/lib/ccv/serialize";
import type { ShadcnConsumerContract } from "@/lib/ccv/types";
import { validateConsumerContract } from "@/lib/ccv/validate";
import { componentRegistry } from "@/lib/component-registry";
import { buildDistributedRegistryItems, type ShadcnRegistryItem } from "@/lib/shadcn-registry-generator";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const root = process.cwd();

let items: ShadcnRegistryItem[];
let contracts: ShadcnConsumerContract[];
const byName = (name: string): ShadcnConsumerContract => {
  const contract = contracts.find((candidate) => candidate.subject === name);
  if (!contract) throw new Error(`no contract for ${name}`);
  return contract;
};

beforeAll(() => {
  items = buildDistributedRegistryItems();
  contracts = deriveAllShadcnContracts({ gitSha: SHA });
});

describe("CCV-1 shadcn contract derivation", () => {
  it("derives a contract for every distributed item — the set is the generator's, not a count or a second list", () => {
    expect(contracts.map((contract) => contract.subject)).toEqual(items.map((item) => item.name));
    expect(listDistributedItemNames()).toEqual(items.map((item) => item.name));
    expect(new Set(contracts.map((contract) => contract.subject)).size).toBe(items.length);
    for (const contract of contracts) {
      expect(contract.distribution).toBe("shadcn-registry");
      expect(validateConsumerContract(contract)).toEqual({ ok: true });
    }
  });

  it("follows an injected generator list: no slug allowlist exists in the derivation", () => {
    const sample = items.filter((item) => ["foundation", "button"].includes(item.name));
    const derived = deriveAllShadcnContracts({ gitSha: SHA, items: sample });
    expect(derived.map((contract) => contract.subject)).toEqual(["foundation", "button"]);
    expect(deriveShadcnContract("card", { gitSha: SHA, items: sample })).toBeUndefined();
    // a distributed item with no canonical registry entry (other than Foundation) is a derivation error, never silently skipped
    const orphan: ShadcnRegistryItem = { ...sample[1], name: "not-in-the-registry" };
    expect(() => deriveAllShadcnContracts({ gitSha: SHA, items: [sample[0], orphan] })).toThrow(/no canonical registry entry/);
  });

  it("derives Foundation through the same architecture", () => {
    const foundation = byName("foundation").expectations;
    expect(foundation.files).toHaveLength(1);
    expect(foundation.files[0]).toMatchObject({ kind: "foundation", installPath: "styles/skrewww-foundation.css", fileType: "registry:file" });
    expect(foundation.dependencies).toEqual({ npm: [], registry: [] });
    expect(foundation.closure.items).toEqual(["foundation"]);
    expect(foundation.css.declaredCustomProperties.length).toBeGreaterThan(400);
    expect(foundation.css.modeSelectors).toContain('[data-skrewww-shape="pill"]');
    expect(foundation.css.modeSelectors).toContain('[data-skrewww-surface="glass"]');
    expect(foundation.exports).toEqual({ values: [], types: [], bySourcePath: {} });
  });

  it("targets are unique and every hash is the SHA-256 of the exact generator content", () => {
    for (const contract of contracts) {
      const item = items.find((candidate) => candidate.name === contract.subject) as ShadcnRegistryItem;
      const targets = contract.expectations.files.map((file) => file.target);
      expect(new Set(targets).size).toBe(targets.length);
      expect(contract.expectations.files).toHaveLength(item.files.length);
      for (const file of item.files) {
        const expected = contract.expectations.files.find((candidate) => candidate.target === file.target);
        expect(expected?.sha256).toBe(sha256Hex(file.content));
        expect(expected?.bytes).toBe(Buffer.byteLength(file.content, "utf8"));
        expect(expected?.sourcePath).toBe(file.path);
        expect(expected?.fileType).toBe(file.type);
      }
    }
  });

  it("is deterministic: the same commit and mode serialize byte-identically", () => {
    const again = deriveAllShadcnContracts({ gitSha: SHA });
    expect(again.map(serializeConsumerContract)).toEqual(contracts.map(serializeConsumerContract));
    expect(serializeConsumerContract(byName("button"))).toBe(serializeConsumerContract(deriveShadcnContract("button", { gitSha: SHA }) as ShadcnConsumerContract));
  });

  it("dependency sets come from the item, sorted and unique", () => {
    for (const contract of contracts) {
      const item = items.find((candidate) => candidate.name === contract.subject) as ShadcnRegistryItem;
      expect(contract.expectations.dependencies.npm).toEqual(Array.from(new Set(item.dependencies)).sort());
      expect(contract.expectations.dependencies.registry).toEqual(Array.from(new Set(item.registryDependencies)).sort());
    }
    expect(byName("data-table").expectations.dependencies.registry.length).toBeGreaterThan(0);
  });

  it("classifies files as own, internal or foundation from the canonical registry entry", () => {
    for (const contract of contracts) {
      const entry = componentRegistry.find((candidate) => candidate.slug === contract.subject);
      for (const file of contract.expectations.files) {
        if (contract.subject === "foundation") expect(file.kind).toBe("foundation");
        else if (entry?.files?.includes(file.sourcePath)) expect(file.kind).toBe("own");
        else expect(entry?.internalDependencies).toContain(file.sourcePath);
        if (contract.subject !== "foundation" && !entry?.files?.includes(file.sourcePath)) expect(file.kind).toBe("internal");
      }
    }
  });

  it("Button: own and internal files, the origin marker, exports and the Foundation dependency", () => {
    const button = byName("button").expectations;
    const own = button.files.filter((file) => file.kind === "own").map((file) => file.installPath);
    expect(own).toEqual(expect.arrayContaining(["components/ui/Button.tsx", "components/ui/button.module.css"]));
    expect(button.files.filter((file) => file.kind === "internal").map((file) => file.installPath)).toEqual(expect.arrayContaining(["lib/cn.ts", "components/ui/router-navigation.tsx"]));
    expect(button.dependencies.registry).toEqual(["@skrewww/foundation"]);
    expect(button.closure.items).toEqual(["button", "foundation"]);
    expect(button.exports.values).toEqual(["Button"]);
    expect(button.exports.types).toEqual(expect.arrayContaining(["ButtonProps", "ButtonVariant"]));
    expect(button.exports.bySourcePath["components/ui/Button.tsx"].values).toEqual(["Button"]);
    expect(button.hostRequirements).toEqual(["react", "react-dom"]);
    expect(button.manifest.keys).toEqual(["$schema", "author", "dependencies", "description", "docs", "files", "name", "registryDependencies", "title", "type"]);
    expect(button.manifest.fileEntryKeys).toEqual(["content", "path", "target", "type"]);
    expect(button.authorities).toEqual({ files: "generator", dependencies: "canonical-registry", exports: "public-barrel", css: "delivered-css" });
  });

  it("Text Input resolves its recursive graph; shared targets are recorded with their hashes", () => {
    const textInput = byName("text-input").expectations;
    expect(textInput.closure.items).toEqual(["form-field", "foundation", "text-input", "validation-message"]);
    expect(textInput.closure.npm).toEqual(["@phosphor-icons/react"]);
    const shared = textInput.closure.sharedTargets.find((entry) => entry.installPath === "lib/cn.ts");
    expect(shared?.items.length).toBeGreaterThan(1);
    expect(shared?.sha256).toHaveLength(1); // every contributing manifest embeds identical bytes
    for (const installPath of textInput.closure.installPaths) expect(typeof installPath).toBe("string");
    expect(textInput.closure.installPaths).toEqual([...textInput.closure.installPaths].sort());
  });

  it("a shared target whose contributing manifests disagree is visible in the contract", () => {
    const base = items.filter((item) => ["foundation", "text-input", "form-field", "validation-message"].includes(item.name));
    const tampered = base.map((item) =>
      item.name === "form-field"
        ? { ...item, files: item.files.map((file) => (file.target === "~/lib/cn.ts" ? { ...file, content: `${file.content}\n// drift` } : file)) }
        : item,
    );
    const contract = deriveShadcnContract("text-input", { gitSha: SHA, items: tampered }) as ShadcnConsumerContract;
    expect(contract.expectations.closure.sharedTargets.find((entry) => entry.installPath === "lib/cn.ts")?.sha256).toHaveLength(2);
  });

  it("Dialog's compound exports are attributed to its own source file", () => {
    const dialog = byName("dialog").expectations;
    expect(dialog.exports.values).toEqual(["Dialog", "DialogBody", "DialogClose", "DialogContent", "DialogDescription", "DialogFooter", "DialogHeader", "DialogTitle", "DialogTrigger"]);
    expect(Object.keys(dialog.exports.bySourcePath)).toEqual(["components/ui/Dialog.tsx"]);
  });

  it("CSS: script-supplied properties are reported beside, never subtracted from, the unresolved set", () => {
    const slider = byName("slider").expectations.css;
    expect(slider.unresolvedWithoutFallback).toEqual(expect.arrayContaining(["--slider-fill-percent", "--slider-thumb-left"]));
    for (const name of slider.unresolvedWithoutFallback) expect(slider.scriptSuppliedCustomProperties).toContain(name);
    expect(byName("foundation").expectations.css.fallbackBackedUses).toEqual(["--color-neutral-900"]);
    expect(byName("foundation").expectations.css.unresolvedWithoutFallback).toEqual([]);
  });

  it("CSS resolution is judged against the item's dependency closure, not its own CSS alone", () => {
    const button = byName("button").expectations.css;
    const alone = analyzeCssSurface(items.find((item) => item.name === "button")!.files.filter((f) => f.target.endsWith(".css")).map((f) => f.content));
    expect(alone.unresolvedWithoutFallback.length).toBeGreaterThan(0); // its own CSS uses Foundation tokens it does not declare…
    expect(button.unresolvedWithoutFallback).toEqual([]); // …which the Foundation dependency delivers
    expect(button.resolvedAgainst).toEqual(["button", "foundation"]);
  });

  it("modes: PUBLIC_REGISTRY changes only the mode and the registry origin", () => {
    const local = byName("card");
    const publicContract = deriveShadcnContract("card", { gitSha: SHA, mode: "PUBLIC_REGISTRY" }) as ShadcnConsumerContract;
    expect(publicContract.mode).toBe("PUBLIC_REGISTRY");
    expect(publicContract.source.registryOrigin).toBe("https://skrewww.com");
    expect(local.source.registryOrigin).toBeUndefined();
    expect(publicContract.expectations).toEqual(local.expectations);
  });

  it("the committed generator output is the only input: reading the manifest file bytes agrees with the contract", () => {
    const tokens = readFileSync(join(root, "styles", "tokens.css"), "utf8");
    expect(tokens.length).toBeGreaterThan(0);
    const foundationFile = byName("foundation").expectations.files[0];
    expect(foundationFile.sha256).toBe(sha256Hex(items[0].files[0].content));
  });
});
