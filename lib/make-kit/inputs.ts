/**
 * Reads the real canonical inputs for the Make Kit guideline compiler. Local
 * files and in-process registry/contract compilation only: no network, no
 * Figma. Kept separate from the pure compiler so tests can feed it fixtures.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { authoredRecipes } from "../../agent/recipes";
import { AGENT_KIT_PRODUCT_VERSION } from "@/lib/agent-kit/beta-version";
import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import { AGENT_CONTRACT_GENERATOR_VERSION, CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION } from "@/lib/agent-kit/contract-schema";
import { systemAgentContract } from "@/lib/agent-kit/system-contract";
import { CANONICAL_REGISTRY_SCHEMA_VERSION, componentRegistry } from "@/lib/component-registry";
import type { MakeKitInput } from "@/lib/make-kit/types";
import { REACT_PACKAGE_ROUTER_MODULE, buildReactPackageEntry } from "@/lib/react-package/pilot-entry";

/** Distinct values of a `[data-skrewww-<attr>="…"]` top-level selector, in stylesheet order. */
export function deriveModes(tokensCss: string, attribute: "shape" | "surface"): string[] {
  const pattern = new RegExp(`^\\[data-skrewww-${attribute}="([a-z-]+)"\\]`, "gm");
  const seen: string[] = [];
  for (const match of Array.from(tokensCss.matchAll(pattern))) {
    if (!seen.includes(match[1])) seen.push(match[1]);
  }
  return seen;
}

export function loadMakeKitInputs(root: string, provenance: MakeKitInput["provenance"]): MakeKitInput {
  const pkg = JSON.parse(readFileSync(join(root, "packages", "react", "package.json"), "utf8")) as {
    name: string;
    version: string;
    type?: string;
    exports: Record<string, unknown>;
    peerDependencies: Record<string, string>;
  };
  const barrel = readFileSync(join(root, "components", "ui", "index.ts"), "utf8");
  const entry = buildReactPackageEntry(componentRegistry, barrel);
  const { contracts } = compileAllContracts(provenance);
  const tokensCss = readFileSync(join(root, "styles", "tokens.css"), "utf8");

  return {
    package: { name: pkg.name, version: pkg.version, type: pkg.type, exports: pkg.exports, peerDependencies: pkg.peerDependencies },
    components: entry.components.map((component) => ({ slug: component.slug, status: component.status, module: component.module })),
    exportsByModule: entry.exportsByModule,
    routerModule: REACT_PACKAGE_ROUTER_MODULE,
    contracts,
    system: systemAgentContract,
    recipes: [...authoredRecipes],
    modes: { shape: deriveModes(tokensCss, "shape"), surface: deriveModes(tokensCss, "surface") },
    manualSetup: readFileSync(join(root, "make-kit", "setup.md"), "utf8"),
    sources: {
      agentContractSchemaVersion: CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION,
      agentContractGeneratorVersion: AGENT_CONTRACT_GENERATOR_VERSION,
      agentKitProductVersion: AGENT_KIT_PRODUCT_VERSION,
      registrySchemaVersion: CANONICAL_REGISTRY_SCHEMA_VERSION,
    },
    provenance,
  };
}
