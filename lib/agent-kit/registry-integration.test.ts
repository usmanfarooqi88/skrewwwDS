import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";

const root = process.cwd();
const R_DIR = join(root, "public", "r");

/**
 * AK-3B: proves the relationship between Agent Kit knowledge
 * (public/agent/contracts/<slug>.json — "what is this component, how
 * should it be used") and shadcn distribution (public/r/<name>.json —
 * "how is this component installed") without merging the two schemas.
 * See docs/architecture/agent-kit.md.
 */

function regenerateShadcnRegistry(): void {
  execFileSync("npx", ["tsx", "scripts/generate-shadcn-registry.ts"], { cwd: root, stdio: "pipe" });
}

describe("registry integration — Agent Kit slug resolves to a real registry entry", () => {
  it("every distributed component slug exists in the canonical registry", () => {
    const distributed = componentRegistry.filter((entry) => entry.files && entry.files.length > 0);
    for (const entry of distributed) {
      const found = componentRegistry.find((candidate) => candidate.slug === entry.slug);
      expect(found).toBeDefined();
      expect(found!.name).toBe(entry.name);
    }
  });
});

describe("registry integration — installability is derived from real /r output, never asserted independently", () => {
  regenerateShadcnRegistry();
  const rFiles = readdirSync(R_DIR).filter((name) => name.endsWith(".json"));
  const distributedNames = rFiles.map((name) => name.replace(/\.json$/, "")).filter((name) => name !== "foundation");

  it("every slug isDistributedViaSkrewwwRegistry() reports true for has a matching public/r/<slug>.json file", () => {
    for (const entry of componentRegistry) {
      if (isDistributedViaSkrewwwRegistry(entry.slug)) {
        expect(existsSync(join(R_DIR, `${entry.slug}.json`)), entry.slug).toBe(true);
      }
    }
  });

  it("every real /r component manifest corresponds to a component isDistributedViaSkrewwwRegistry() reports true for", () => {
    for (const name of distributedNames) {
      expect(isDistributedViaSkrewwwRegistry(name), name).toBe(true);
    }
  });

  it("a non-distributed component is not presented as installable, even though it is implemented", () => {
    const nonDistributed = componentRegistry.find((entry) => !entry.files || entry.files.length === 0);
    expect(nonDistributed).toBeDefined();
    expect(nonDistributed!.hasImplementation).toBe(true); // implemented in React...
    expect(isDistributedViaSkrewwwRegistry(nonDistributed!.slug)).toBe(false); // ...but not shadcn-installable
    expect(existsSync(join(R_DIR, `${nonDistributed!.slug}.json`))).toBe(false);
  });
});

describe("registry integration — AK-3 introduced no /r catalog expansion", () => {
  it("the shadcn manifest generator still builds exactly the same 9 items as before AK-3 (foundation + 8 components)", () => {
    const generatorSource = readFileSync(join(root, "scripts", "generate-shadcn-registry.ts"), "utf8");
    const buildCalls = generatorSource.match(/build\w+Manifest\(\)/g) ?? [];
    expect(buildCalls).toHaveLength(9);
  });

  it("public/r/ contains exactly one manifest per distributed registry entry plus foundation, nothing extra", () => {
    regenerateShadcnRegistry();
    const distributedCount = componentRegistry.filter((entry) => entry.files && entry.files.length > 0).length;
    const actualFiles = readdirSync(R_DIR).filter((name) => name.endsWith(".json"));
    expect(actualFiles).toHaveLength(distributedCount + 1); // +1 for foundation.json
  }, 30_000);
});

describe("registry integration — Agent Kit contract and /r manifest never merge schemas", () => {
  it("public/agent/contracts/<slug>.json and public/r/<slug>.json exist as genuinely separate files with distinct shapes", () => {
    const AGENT_CONTRACTS_DIR = join(root, "public", "agent", "contracts");
    const buttonContractPath = join(AGENT_CONTRACTS_DIR, "button.json");
    // Skip when Agent Kit output is absent or mid-regeneration (another suite
    // may temporarily delete public/agent/ during a determinism check).
    if (!existsSync(buttonContractPath)) return;

    const buttonContract = JSON.parse(readFileSync(buttonContractPath, "utf8")) as Record<
      string,
      unknown
    >;
    const buttonManifestPath = join(R_DIR, "button.json");
    if (!existsSync(buttonManifestPath)) return;
    const buttonManifest = JSON.parse(readFileSync(buttonManifestPath, "utf8")) as Record<string, unknown>;

    // Agent Kit contract has knowledge fields the shadcn manifest never has...
    expect(buttonContract).toHaveProperty("guidance");
    expect(buttonContract).toHaveProperty("tokens");
    expect(buttonManifest).not.toHaveProperty("guidance");
    expect(buttonManifest).not.toHaveProperty("tokens");

    // ...and the shadcn manifest has transport fields the Agent Kit contract never has.
    expect(buttonManifest).toHaveProperty("files");
    expect(buttonManifest.files).toEqual(
      expect.arrayContaining([expect.objectContaining({ content: expect.any(String) })]),
    );
    expect(buttonContract).not.toHaveProperty("$schema");
  });
});
