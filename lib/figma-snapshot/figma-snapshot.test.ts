import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compileComponentContract } from "@/lib/agent-kit/contract-compiler";
import { componentRegistry, getRegistryEntry } from "@/lib/component-registry";
import { allComponents } from "@/lib/data";
import { figmaIdentityKey, SKREWWW_PRO_FIGMA_FILE_KEY, type FigmaIdentity } from "@/lib/figma-identity";
import { FigmaSnapshotError, normalizeFigmaSnapshot } from "@/lib/figma-snapshot/normalize";
import type { RawFigmaCapture } from "@/lib/figma-snapshot/raw-capture";
import { FIGMA_SNAPSHOT_SCHEMA_VERSION, type FigmaSnapshot } from "@/lib/figma-snapshot/schema";
import { validateFigmaSnapshot } from "@/lib/figma-snapshot/validate";

// Checks committed evidence and synthetic captures only — never live Figma.

const root = process.cwd();
const SNAPSHOT_DIR = join(root, "agent", "figma-snapshots", SKREWWW_PRO_FIGMA_FILE_KEY);
const PILOTS = ["alert", "button", "chart-card", "dialog", "text-input"];

function loadSnapshot(slug: string): FigmaSnapshot {
  return JSON.parse(readFileSync(join(SNAPSHOT_DIR, `${slug}.json`), "utf8")) as FigmaSnapshot;
}

function identityOf(slug: string): FigmaIdentity {
  return getRegistryEntry(slug)!.figmaIdentity!;
}

function isSorted(values: string[]): boolean {
  return values.every((v, i) => i === 0 || values[i - 1] <= v);
}

const SYNTHETIC_IDENTITY: FigmaIdentity = {
  fileKey: "SyntheticFileKey01",
  nodeId: "10:1",
  nodeType: "COMPONENT_SET",
  role: "master",
  verifiedAt: "2026-09-29",
};

function syntheticCapture(): RawFigmaCapture {
  const layout = {
    layoutMode: "HORIZONTAL",
    itemSpacing: 8,
    padding: [6, 12, 6, 12],
    primaryAxisSizingMode: "AUTO",
    counterAxisSizingMode: "AUTO",
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "CENTER",
    cornerRadius: 4,
    strokeWeight: 1,
    strokeAlign: "INSIDE",
    clipsContent: false,
    width: 100,
    height: 36,
    fillTypes: ["SOLID"],
    strokeTypes: [],
    effectTypes: [],
  };
  const rootFor = (id: string, size: string) => ({
    id,
    name: `Size=${size}`,
    variantProperties: { Size: size },
    explicitVariableModes: {},
    layout: { ...layout, height: size === "Small" ? 29 : 36 },
    children: [{ name: "Label", type: "TEXT", visible: true }],
    bindings: [
      { path: "", property: "fills[0].color", variableId: "V:bg", withinInstance: null },
      ...(size === "Small" ? [] : [{ path: "", property: "topLeftRadius", variableId: "V:radius", withinInstance: null }]),
    ],
    textStyles: [{ path: "Label", withinInstance: null, styleName: "Label/M", mixed: false }],
    instances: [],
  });
  return {
    captureVersion: "1.0.0",
    fileKey: SYNTHETIC_IDENTITY.fileKey,
    fileName: "Synthetic",
    targets: [
      {
        target: { slug: "synthetic", fileKey: SYNTHETIC_IDENTITY.fileKey, nodeId: "10:1" },
        fileKey: SYNTHETIC_IDENTITY.fileKey,
        node: {
          id: "10:1",
          type: "COMPONENT_SET",
          name: "Synthetic/Thing",
          description: "PURPOSE: Test.\n\nTOKENS USED: something.",
          pageName: "Page",
          parent: { id: "9:1", type: "SECTION", name: "Synthetic/Thing" },
          componentPropertyDefinitions: {
            "Size": { type: "VARIANT", defaultValue: "Small", variantOptions: ["Small", "Medium"] },
            "Label#10:5": { type: "TEXT", defaultValue: "Label", variantOptions: null },
          },
          roots: [rootFor("10:2", "Small"), rootFor("10:3", "Medium")],
        },
      },
    ],
    variables: {
      "V:bg": { name: "component/thing/background", resolvedType: "COLOR", collectionId: "C:surface", collectionName: "Surface", valuesByMode: { Flat: { alias: "semantic/x", aliasId: "V:x" } } },
      "V:radius": { name: "component/radius/control", resolvedType: "FLOAT", collectionId: "C:shape", collectionName: "Shape", valuesByMode: { Rounded: 4, Pill: 9999 } },
    },
    collections: {
      "C:surface": { name: "Surface", modes: [{ modeId: "m1", name: "Flat" }] },
      "C:shape": { name: "Shape", modes: [{ modeId: "m2", name: "Rounded" }, { modeId: "m3", name: "Pill" }] },
    },
  };
}

describe("AG-1B — committed pilot snapshots", () => {
  it("exist for exactly the registry entries that carry a figmaIdentity (the five pilots)", () => {
    const files = readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
    const withIdentity = componentRegistry.filter((e) => e.figmaIdentity).map((e) => e.slug).sort();
    expect(files).toEqual(PILOTS);
    expect(files).toEqual(withIdentity);
  });

  it("each validates against its registry identity", () => {
    for (const slug of PILOTS) {
      expect(validateFigmaSnapshot(loadSnapshot(slug), identityOf(slug)), slug).toEqual([]);
    }
  });

  it("point at exactly the registry (fileKey, nodeId), with the expected node type and role", () => {
    const keys = PILOTS.map((slug) => {
      const snapshot = loadSnapshot(slug);
      expect(snapshot.identity, slug).toEqual(identityOf(slug));
      expect(snapshot.observed.node.id, slug).toBe(identityOf(slug).nodeId);
      expect(snapshot.observed.node.type, slug).toBe(identityOf(slug).nodeType);
      expect(snapshot.schemaVersion, slug).toBe(FIGMA_SNAPSHOT_SCHEMA_VERSION);
      return figmaIdentityKey(snapshot.identity);
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keep stable ordering so refreshes produce meaningful diffs", () => {
    for (const slug of PILOTS) {
      const s = loadSnapshot(slug);
      expect(isSorted(s.observed.componentProperties.map((p) => p.name)), slug).toBe(true);
      expect(isSorted(s.observed.variants.map((v) => v.name)), slug).toBe(true);
      expect(isSorted(s.observed.variables.map((v) => v.name)), slug).toBe(true);
      expect(isSorted(s.observed.collections.map((c) => c.name)), slug).toBe(true);
      expect(isSorted(s.unknowns.map((u) => u.fact)), slug).toBe(true);
      expect(readFileSync(join(SNAPSHOT_DIR, `${slug}.json`), "utf8")).toBe(`${JSON.stringify(s, null, 2)}\n`);
    }
  });

  it("record what was not captured instead of guessing", () => {
    for (const slug of PILOTS) {
      const facts = loadSnapshot(slug).unknowns.map((u) => u.fact);
      expect(facts, slug).toEqual(expect.arrayContaining(["reactMapping", "parity", "renderedValues", "modeSupport"]));
    }
    // Chart Card's master exposes no properties of its own.
    expect(loadSnapshot("chart-card").unknowns.map((u) => u.fact)).toContain("componentProperties");
  });

  it("preserve Figma's own names and observed facts (spot checks)", () => {
    const button = loadSnapshot("button");
    expect(button.observed.componentProperties.filter((p) => p.type === "VARIANT").map((p) => p.name)).toEqual(["Size", "State", "Style"]);
    expect(button.derived.variantCount).toBe(45);
    expect(button.derived.variantCombinationsComplete).toBe(true);
    const alert = loadSnapshot("alert");
    const radiusNames = new Set(
      alert.observed.variableBindings
        .filter((b) => b.path === "" && /Radius$/.test(b.property))
        .map((b) => alert.observed.variables.find((v) => v.id === b.variableId)!.name),
    );
    expect(Array.from(radiusNames)).toEqual(["component/radius/feedback"]);
  });
});

describe("AG-1B — snapshots are evidence, not authority", () => {
  it("contain no React mapping or parity state", () => {
    for (const slug of PILOTS) {
      const json = JSON.stringify(loadSnapshot(slug));
      expect(json, slug).not.toMatch(/"(react|reactProp|apiProps|cssTokens|tokensUsed|parity|verdict)"\s*:/);
    }
  });

  it("are not consumed by the registry or the Agent contract compiler", () => {
    for (const file of ["lib/component-registry.ts", "lib/agent-kit/contract-compiler.ts", "lib/agent-kit/contract-schema.ts"]) {
      expect(readFileSync(join(root, file), "utf8"), file).not.toMatch(/figma-snapshot/);
    }
    const entry = getRegistryEntry("button")!;
    const doc = allComponents.find((d) => d.slug === "button")!;
    const contract = compileComponentContract(entry, doc, { sourceGitSha: "0".repeat(40), sourceGitCommitTimestamp: "2026-09-29T00:00:00Z" });
    expect(JSON.stringify(contract)).not.toMatch(/snapshot|observed|capturedAt/);
  });

  it("reject injected React or parity keys", () => {
    const snapshot = loadSnapshot("alert") as FigmaSnapshot & Record<string, unknown>;
    expect(validateFigmaSnapshot({ ...snapshot, parity: "pass" } as FigmaSnapshot, identityOf("alert"))).not.toEqual([]);
    const withReact = JSON.parse(JSON.stringify(snapshot));
    withReact.observed.componentProperties[0].reactProp = "type";
    expect(validateFigmaSnapshot(withReact, identityOf("alert"))).not.toEqual([]);
  });
});

describe("AG-1B — identity binding", () => {
  it("cannot silently point at a different node than figmaIdentity", () => {
    const snapshot = loadSnapshot("button");
    const otherNode = { ...snapshot, identity: { ...snapshot.identity, nodeId: "2022:1151" } };
    expect(validateFigmaSnapshot(otherNode, identityOf("button"))).not.toEqual([]);
    const otherFile = { ...snapshot, identity: { ...snapshot.identity, fileKey: "KrQIUWznpBdP0ZuWjOu2e3" } };
    expect(validateFigmaSnapshot(otherFile, identityOf("button"))).not.toEqual([]);
    const otherObserved = JSON.parse(JSON.stringify(snapshot));
    otherObserved.observed.node.id = "2022:1151";
    expect(validateFigmaSnapshot(otherObserved, identityOf("button"))).not.toEqual([]);
  });

  it("refuses to normalize a capture of a different file, node or type", () => {
    const capture = syntheticCapture();
    expect(() => normalizeFigmaSnapshot(capture, "synthetic", { ...SYNTHETIC_IDENTITY, fileKey: "AnotherFileKey01" }, "2026-09-29T00:00:00Z")).toThrow(FigmaSnapshotError);
    expect(() => normalizeFigmaSnapshot(capture, "synthetic", { ...SYNTHETIC_IDENTITY, nodeId: "10:9" }, "2026-09-29T00:00:00Z")).toThrow(FigmaSnapshotError);
    expect(() => normalizeFigmaSnapshot(capture, "synthetic", { ...SYNTHETIC_IDENTITY, nodeType: "COMPONENT" }, "2026-09-29T00:00:00Z")).toThrow(FigmaSnapshotError);
    const errored = syntheticCapture();
    errored.targets[0].error = "file-key-mismatch";
    expect(() => normalizeFigmaSnapshot(errored, "synthetic", SYNTHETIC_IDENTITY, "2026-09-29T00:00:00Z")).toThrow(FigmaSnapshotError);
  });

  it("ships a capture script that refuses targets from a different file", () => {
    const script = readFileSync(join(root, "scripts/figma-snapshot/capture-in-figma.js"), "utf8");
    expect(script).toMatch(/target\.fileKey !== figma\.fileKey/);
    expect(script).not.toMatch(/\.(setBoundVariable|setValueForMode|remove|appendChild|setProperties)\(/);
  });
});

describe("AG-1B — normalization", () => {
  it("is deterministic and independent of raw array order", () => {
    const at = "2026-09-29T00:00:00Z";
    const a = normalizeFigmaSnapshot(syntheticCapture(), "synthetic", SYNTHETIC_IDENTITY, at);
    const shuffled = syntheticCapture();
    const node = shuffled.targets[0].node!;
    node.roots.reverse();
    for (const r of node.roots) r.bindings.reverse();
    node.componentPropertyDefinitions = Object.fromEntries(Object.entries(node.componentPropertyDefinitions).reverse());
    const b = normalizeFigmaSnapshot(shuffled, "synthetic", SYNTHETIC_IDENTITY, at);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });

  it("changes only capturedAt between captures of an unchanged node", () => {
    const a = normalizeFigmaSnapshot(syntheticCapture(), "synthetic", SYNTHETIC_IDENTITY, "2026-09-29T00:00:00Z");
    const b = normalizeFigmaSnapshot(syntheticCapture(), "synthetic", SYNTHETIC_IDENTITY, "2030-01-01T00:00:00Z");
    expect({ ...a, capturedAt: "" }).toEqual({ ...b, capturedAt: "" });
    expect(a.capturedAt).not.toBe(b.capturedAt);
  });

  it("scopes facts to the variants that actually have them", () => {
    const s = normalizeFigmaSnapshot(syntheticCapture(), "synthetic", SYNTHETIC_IDENTITY, "2026-09-29T00:00:00Z");
    const fill = s.observed.variableBindings.find((b) => b.property === "fills[0].color")!;
    const radius = s.observed.variableBindings.find((b) => b.property === "topLeftRadius")!;
    expect(fill.scope).toBe("all");
    expect(radius.scope).toEqual(["Size=Medium"]);
    expect(s.derived.descriptionSections).toEqual(["PURPOSE", "TOKENS USED"]);
    expect(s.derived.variantCombinationsComplete).toBe(true);
  });

  it("produces a valid snapshot even when Figma data is missing", () => {
    const sparse = syntheticCapture();
    const node = sparse.targets[0].node!;
    node.componentPropertyDefinitions = {};
    node.description = "";
    for (const r of node.roots) {
      r.bindings = [];
      r.textStyles = [];
    }
    sparse.variables = {};
    const snapshot = normalizeFigmaSnapshot(sparse, "synthetic", SYNTHETIC_IDENTITY, "2026-09-29T00:00:00Z");
    expect(validateFigmaSnapshot(snapshot, SYNTHETIC_IDENTITY)).toEqual([]);
    expect(snapshot.observed.variableBindings).toEqual([]);
    expect(snapshot.unknowns.map((u) => u.fact)).toContain("componentProperties");
  });

  it("records a bound variable it could not resolve as unknown instead of dropping the binding", () => {
    const partial = syntheticCapture();
    partial.variables["V:radius"] = null;
    const snapshot = normalizeFigmaSnapshot(partial, "synthetic", SYNTHETIC_IDENTITY, "2026-09-29T00:00:00Z");
    expect(snapshot.observed.variableBindings.some((b) => b.variableId === "V:radius")).toBe(true);
    expect(snapshot.unknowns.map((u) => u.fact)).toContain("variables");
    expect(validateFigmaSnapshot(snapshot, SYNTHETIC_IDENTITY)).toEqual([]);
  });
});
