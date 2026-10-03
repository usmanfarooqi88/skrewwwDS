import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compileComponentContract } from "@/lib/agent-kit/contract-compiler";
import { componentRegistry, getRegistryEntry } from "@/lib/component-registry";
import { allComponents } from "@/lib/data";
import { figmaIdentityKey, SKREWWW_PRO_FIGMA_FILE_KEY, type FigmaIdentity } from "@/lib/figma-identity";
import { computeAliasClosure, type ClosureVariableSource } from "@/lib/figma-snapshot/alias-closure";
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

// ── 1.1.0: transitive alias closure ─────────────────────────────────────────

const variable = (id: string, name: string, valuesByMode: ClosureVariableSource["valuesByMode"]) => ({ id, name, resolvedType: "FLOAT", collection: "C", valuesByMode });
const source = (name: string, valuesByMode: ClosureVariableSource["valuesByMode"]): ClosureVariableSource => ({ name, resolvedType: "FLOAT", collection: "C", valuesByMode });
const ref = (name: string, id: string) => ({ alias: name, aliasId: id });

describe("AG-1B 1.1.0 — alias closure (generic, read-only, cycle-safe)", () => {
  it("separates bound variables, transitive alias targets and unresolved references", () => {
    const bound = [variable("B", "bound", { Light: ref("mid", "M"), Dark: ref("other", "O") })];
    const table = new Map<string, ClosureVariableSource>([
      ["M", source("mid", { Value: ref("leaf", "L") })],
      ["L", source("leaf", { Value: 12 })],
      ["O", source("other", { Value: ref("missing", "X") })],
    ]);
    const closure = computeAliasClosure(bound, (id) => table.get(id));
    expect(closure.variables.map((v) => v.name)).toEqual(["leaf", "mid", "other"]); // sorted, bound excluded
    expect(closure.unresolvedIds).toEqual(["X"]); // the chain past `other` cannot be proven
  });

  it("terminates on alias cycles and counts each variable once", () => {
    const bound = [variable("B", "bound", { Value: ref("a", "A") })];
    const table = new Map<string, ClosureVariableSource>([
      ["A", source("a", { Value: ref("b", "B2") })],
      ["B2", source("b", { Value: ref("a", "A") })],
    ]);
    const closure = computeAliasClosure(bound, (id) => table.get(id));
    expect(closure.variables.map((v) => v.name)).toEqual(["a", "b"]);
    expect(closure.unresolvedIds).toEqual([]);
    // a cycle that returns to a bound variable does not duplicate it either
    const loop = computeAliasClosure(bound, (id) => (id === "A" ? source("a", { Value: ref("bound", "B") }) : undefined));
    expect(loop.variables.map((v) => v.name)).toEqual(["a"]);
  });

  it("follows aliases in every mode, and is independent of input order", () => {
    const bound = [variable("B1", "x", { Light: ref("p", "P"), Dark: ref("q", "Q") }), variable("B2", "y", { Value: ref("q", "Q") })];
    const table = new Map<string, ClosureVariableSource>([
      ["P", source("p", { Value: 1 })],
      ["Q", source("q", { Value: 2 })],
    ]);
    const a = computeAliasClosure(bound, (id) => table.get(id));
    const b = computeAliasClosure([...bound].reverse(), (id) => table.get(id));
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(a.variables.map((v) => v.name)).toEqual(["p", "q"]);
  });

  it("normalization records a complete closure when every alias target was captured", () => {
    const capture = syntheticCapture();
    capture.variables["V:x"] = { name: "semantic/x", resolvedType: "COLOR", collectionId: "C:semantic", collectionName: "Semantic", valuesByMode: { Light: { alias: "color/y", aliasId: "V:y" } } };
    capture.variables["V:y"] = { name: "color/y", resolvedType: "COLOR", collectionId: "C:primitive", collectionName: "Primitive", valuesByMode: { Value: { r: 1, g: 0, b: 0, a: 1 } } };
    const snapshot = normalizeFigmaSnapshot(capture, "synthetic", SYNTHETIC_IDENTITY, "2026-10-03T00:00:00Z");
    expect(snapshot.schemaVersion).toBe("1.1.0");
    expect(snapshot.observed.aliasClosure!.variables.map((v) => v.name)).toEqual(["color/y", "semantic/x"]);
    expect(snapshot.observed.aliasClosure!.unresolvedIds).toEqual([]);
    expect(snapshot.derived.aliasClosureComplete).toBe(true);
    expect(validateFigmaSnapshot(snapshot, SYNTHETIC_IDENTITY)).toEqual([]);
  });

  it("normalization marks the closure incomplete when an alias target was not captured", () => {
    const snapshot = normalizeFigmaSnapshot(syntheticCapture(), "synthetic", SYNTHETIC_IDENTITY, "2026-10-03T00:00:00Z");
    expect(snapshot.observed.aliasClosure!.variables).toEqual([]);
    expect(snapshot.observed.aliasClosure!.unresolvedIds).toEqual(["V:x"]);
    expect(snapshot.derived.aliasClosureComplete).toBe(false);
    expect(validateFigmaSnapshot(snapshot, SYNTHETIC_IDENTITY)).toEqual([]);
  });

  it("the validator rejects a closure that is missing, padded, inconsistent or mis-versioned", () => {
    const base = normalizeFigmaSnapshot(syntheticCapture(), "synthetic", SYNTHETIC_IDENTITY, "2026-10-03T00:00:00Z");
    const mutate = (fn: (s: FigmaSnapshot) => void) => {
      const copy = JSON.parse(JSON.stringify(base)) as FigmaSnapshot;
      fn(copy);
      return validateFigmaSnapshot(copy, SYNTHETIC_IDENTITY).join("\n");
    };
    expect(mutate((s) => delete s.observed.aliasClosure)).toMatch(/aliasClosure is required/);
    expect(mutate((s) => (s.observed.aliasClosure!.unresolvedIds = []))).toMatch(/unresolvedIds do not match/);
    expect(mutate((s) => s.observed.aliasClosure!.variables.push(variable("Z", "orphan", { Value: 1 })))).toMatch(/not reachable/);
    expect(mutate((s) => s.observed.aliasClosure!.variables.push(variable("V:bg", "dup", { Value: 1 })))).toMatch(/also a bound variable/);
    expect(mutate((s) => (s.derived.aliasClosureComplete = true))).toMatch(/aliasClosureComplete does not follow/);
    expect(mutate((s) => (s.schemaVersion = "1.0.0"))).toMatch(/1\.0\.0 snapshot cannot carry/);
    expect(mutate((s) => (s.schemaVersion = "9.9.9"))).toMatch(/is not one of/);
  });

  it("capture stays read-only and follows aliases transitively", () => {
    const script = readFileSync(join(root, "scripts/figma-snapshot/capture-in-figma.js"), "utf8");
    expect(script).toContain('const SKREWWW_FIGMA_CAPTURE_VERSION = "1.1.0"');
    expect(script).toMatch(/await describeVariable\(value\.id\)/);
    expect(script).toMatch(/variables\[id\] = null;\s*\n\s*const v = await/); // visited-before-lookup: cycle safety
    expect(script).not.toMatch(/\.(create[A-Z]\w*|setValueForMode|remove\(\)|setBoundVariable\w*)\(/);
  });

  it("every committed pilot snapshot is 1.1.0 with a complete, reproducible alias closure", () => {
    for (const slug of PILOTS) {
      const snapshot = loadSnapshot(slug);
      expect(snapshot.schemaVersion).toBe(FIGMA_SNAPSHOT_SCHEMA_VERSION);
      expect(snapshot.schemaVersion).toBe("1.1.0");
      const closure = snapshot.observed.aliasClosure!;
      expect(closure.unresolvedIds, slug).toEqual([]);
      expect(snapshot.derived.aliasClosureComplete, slug).toBe(true);
      expect(snapshot.capture.aliasClosureCapturedAt, slug).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      // reproducible: the closure is exactly what the aliases of bound ∪ closure variables reach
      const known = new Map([...snapshot.observed.variables, ...closure.variables].map((v) => [v.id, v]));
      const recomputed = computeAliasClosure(snapshot.observed.variables, (id) => known.get(id));
      expect(JSON.stringify(recomputed), slug).toBe(JSON.stringify(closure));
      expect(isSorted(closure.variables.map((v) => v.name)), slug).toBe(true);
    }
  });

  it("closure variables carry their own literal values, so alias chains resolve to numbers", () => {
    const alert = loadSnapshot("alert");
    const full = alert.observed.aliasClosure!.variables.find((v) => v.name === "radius/full")!;
    expect(full.valuesByMode).toEqual({ Value: 9999 });
    const feedback = alert.observed.variables.find((v) => v.name === "component/radius/feedback")!;
    expect(feedback.valuesByMode.Pill).toMatchObject({ alias: "radius/full" });
  });
});
