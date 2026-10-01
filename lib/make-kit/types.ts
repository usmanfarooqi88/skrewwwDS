import type { ComponentAgentContract, SystemAgentContract } from "@/lib/agent-kit/contract-schema";
import type { AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";
import type { MaturityStatus } from "@/lib/component-registry";
import type { ModuleExports } from "@/lib/react-package/pilot-entry";

/** Versions the shape of `make-kit/dist/manifest.json`. Independent of every other schema version. */
export const MAKE_KIT_MANIFEST_SCHEMA_VERSION = "1.0.0";
/** Versions this compiler's own rendering logic. */
export const MAKE_KIT_COMPILER_VERSION = "1.0.0";

export type MakeKitPackageInput = {
  name: string;
  version: string;
  type?: string;
  exports: Record<string, unknown>;
  peerDependencies: Record<string, string>;
};

export type MakeKitPilotComponent = {
  slug: string;
  /** Canonical registry status — copied, never decided here. */
  status: MaturityStatus;
  /** components/ui module (and root export) name, e.g. "TextInput". */
  module: string;
};

/** Everything the compiler reads. All of it is canonical or manual-setup input; nothing comes from Figma or the network. */
export type MakeKitInput = {
  package: MakeKitPackageInput;
  components: MakeKitPilotComponent[];
  /** Public export names per package-entry module, derived from the real public barrel. */
  exportsByModule: Record<string, ModuleExports>;
  routerModule: string;
  contracts: ComponentAgentContract[];
  system: SystemAgentContract;
  recipes: AuthoredRecipe[];
  modes: { shape: string[]; surface: string[] };
  /** The one hand-written file (make-kit/setup.md), copied verbatim into the kit. */
  manualSetup: string;
  sources: {
    agentContractSchemaVersion: string;
    agentContractGeneratorVersion: string;
    agentKitProductVersion: string;
    registrySchemaVersion: string;
  };
  provenance: { sourceGitSha: string; sourceGitCommitTimestamp: string };
};

export type MakeKitFile = { path: string; content: string };

export type MakeKitManifest = {
  schemaVersion: string;
  compilerVersion: string;
  package: {
    name: string;
    version: string;
    entry: string;
    stylesheet: string;
    moduleFormat: "esm";
    peerDependencies: Record<string, string>;
  };
  modes: { shape: string[]; surface: string[]; attributes: { shape: string; surface: string } };
  components: Array<{
    slug: string;
    name: string;
    status: MaturityStatus;
    componentVersion: string;
    guideline: string;
    exports: ModuleExports;
  }>;
  utilities: Array<{ name: string; guideline: string; exports: ModuleExports }>;
  /** Public export name -> the one import specifier it comes from. Derived, never hand-maintained. */
  exportIndex: Record<string, string>;
  guidelines: { generated: string[]; manual: string[] };
  recipes: Array<{ id: string; status: string; guideline: string }>;
  sources: MakeKitInput["sources"];
  authority: {
    isAuthority: false;
    figmaReferencesAreReferenceOnly: true;
    figmaSnapshotsIncluded: false;
    liveFigmaRequired: false;
  };
  provenance: {
    sourceGitSha: string;
    sourceGitCommitTimestamp: string;
    /** sha256 over every generated and manual guideline file (path + content). */
    guidelinesDigest: string;
  };
};

export type MakeKitOutput = { files: MakeKitFile[]; manifest: MakeKitManifest };

export class MakeKitCompileError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`Make Kit guideline compilation failed (${issues.length} issue(s)):\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "MakeKitCompileError";
    this.issues = issues;
  }
}
