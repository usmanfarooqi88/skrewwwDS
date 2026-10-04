import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { compareRuntimeExports, consumerPackageJson, CCV_VITE_CONSUMER_PINS, generateProbe, generateSurfaceHarness, judgeSpecifier, parseProbeOutput } from "@/lib/ccv/npm/consumer";
import { IMPLICIT_NODE_GYP, classifyScripts, walkDependencyTree } from "@/lib/ccv/npm/lifecycle";
import { compareDependencies, compareIdentity, satisfiesRange } from "@/lib/ccv/npm/manifest";
import { comparePackedInstalled, hashFiles } from "@/lib/ccv/npm/package-files";
import { packageRelative, readTarGz } from "@/lib/ccv/npm/tarball";
import { resultStem } from "@/lib/ccv/runner/artifacts";

const SHA = "0123456789abcdef0123456789abcdef01234567";

/** Builds a minimal ustar `.tgz` in memory (regular files, a pax long path, a directory, a symlink). */
function tgz(entries: Array<{ path: string; data?: string; type?: string; pax?: string }>): Buffer {
  const blocks: Buffer[] = [];
  const header = (name: string, size: number, type: string) => {
    const block = Buffer.alloc(512);
    block.write(name.slice(0, 100), 0, "utf8");
    block.write(size.toString(8).padStart(11, "0"), 124, "ascii");
    block.write(type, 156, "ascii");
    block.write("ustar", 257, "ascii");
    return block;
  };
  const pushData = (data: Buffer) => {
    blocks.push(data, Buffer.alloc((512 - (data.length % 512)) % 512));
  };
  for (const entry of entries) {
    if (entry.pax) {
      const record = `path=${entry.pax}\n`;
      let length = record.length + 2;
      while (String(length).length + 1 + record.length !== length) length = String(length).length + 1 + record.length;
      const body = Buffer.from(`${length} ${record}`);
      blocks.push(header("PaxHeader", body.length, "x"));
      pushData(body);
    }
    const data = Buffer.from(entry.data ?? "");
    blocks.push(header(entry.path, data.length, entry.type ?? "0"));
    if (data.length) pushData(data);
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

describe("CCV-3 tarball reader", () => {
  it("reads regular files, pax long paths, skips directories and reports links", () => {
    const longName = `package/dist/types/${"x".repeat(120)}.d.ts`;
    const archive = tgz([
      { path: "package/", type: "5" },
      { path: "package/package.json", data: '{"name":"p"}' },
      { path: "ignored", data: "export {}", pax: longName },
      { path: "package/link", type: "2" },
      { path: "stray.txt", data: "x" },
    ]);
    const { files, nonRegular } = readTarGz(archive);
    expect(Array.from(files.keys())).toEqual(["package/package.json", longName, "stray.txt"]);
    expect(nonRegular).toEqual([{ path: "package/link", type: "2" }]);
    const relative = packageRelative(files);
    expect(Array.from(relative.files.keys())).toEqual(["package.json", longName.slice(8)]);
    expect(relative.outside).toEqual(["stray.txt"]);
  });
});

describe("CCV-3 packed vs installed files", () => {
  const packed = hashFiles(new Map([["package.json", Buffer.from("{}")], ["dist/index.js", Buffer.from("a")], ["README.md", Buffer.from("r")]]));
  it("passes only exact equality and names every difference", () => {
    expect(comparePackedInstalled(packed, packed)).toEqual({ equal: ["README.md", "dist/index.js", "package.json"], missing: [], unexpected: [], differing: [] });
    const installed = hashFiles(new Map([["package.json", Buffer.from("{}")], ["dist/index.js", Buffer.from("b")], ["extra.js", Buffer.from("x")]]));
    const result = comparePackedInstalled(packed, installed);
    expect(result.missing).toEqual(["README.md"]);
    expect(result.unexpected).toEqual(["extra.js"]);
    expect(result.differing.map((entry) => entry.path)).toEqual(["dist/index.js"]);
  });
});

describe("CCV-3 manifest, dependency and range checks", () => {
  const contract = deriveNpmContract({ gitSha: SHA });
  const e = contract.expectations;
  const manifest = {
    name: e.package.name, version: e.package.version, type: e.package.type, engines: { node: e.package.engines ?? undefined }, exports: e.package.exportsMap,
    sideEffects: e.package.sideEffects, dependencies: e.dependencies.ranges.npm, peerDependencies: e.dependencies.ranges.peers,
  };

  it("an installed manifest equal to the contract passes every identity field", () => {
    expect(compareIdentity(manifest, e.package).filter((field) => !field.ok)).toEqual([]);
    expect(compareIdentity({ ...manifest, version: "9.9.9" }, e.package).find((field) => field.field === "version")).toMatchObject({ ok: false, actual: "9.9.9" });
    expect(compareIdentity({ ...manifest, exports: { ".": "./dist/index.js", "./dist/*": "./dist/*" } }, e.package).find((field) => field.field === "exports")?.ok).toBe(false);
  });

  it("compares dependency names and ranges in both directions", () => {
    expect(compareDependencies(manifest, e.dependencies).every((entry) => entry.ok)).toBe(true);
    const peers = Object.keys(e.dependencies.ranges.peers);
    const changed = compareDependencies({ ...manifest, dependencies: { ...manifest.dependencies, "left-pad": "1.0.0" }, peerDependencies: { ...manifest.peerDependencies, [peers[0]]: ">=16" } }, e.dependencies);
    expect(changed.find((entry) => entry.name === "left-pad")).toEqual({ kind: "dependency", name: "left-pad", actual: "1.0.0", ok: false });
    expect(changed.find((entry) => entry.name === peers[0])).toMatchObject({ kind: "peer", ok: false, actual: ">=16" });
  });

  it("judges the range forms the package uses", () => {
    expect(satisfiesRange("19.2.7", "^19.2.0")).toBe(true);
    expect(satisfiesRange("19.1.0", "^19.2.0")).toBe(false);
    expect(satisfiesRange("20.0.0", "^19.2.0")).toBe(false);
    expect(satisfiesRange("0.2.5", "^0.2.1")).toBe(true);
    expect(satisfiesRange("0.3.0", "^0.2.1")).toBe(false);
    expect(satisfiesRange("1.2.9", "~1.2.3")).toBe(true);
    expect(satisfiesRange("1.3.0", "~1.2.3")).toBe(false);
    expect(satisfiesRange("2.0.0", ">=1.0.0")).toBe(true);
    expect(satisfiesRange("1.0.0", "1.0.0")).toBe(true);
    expect(satisfiesRange("1.0.0", "1.x || 2.x")).toBeUndefined();
  });
});

describe("CCV-3 lifecycle classification", () => {
  it("separates consumer-run scripts from publisher-only scripts, including the implicit node-gyp install", () => {
    expect(classifyScripts({ prepublishOnly: "x", prepack: "y" })).toEqual({ consumerRun: [], publisherOnly: ["prepack", "prepublishOnly"] });
    expect(classifyScripts({ postinstall: "node x.js", prepare: "husky", build: "tsc" })).toEqual({ consumerRun: ["postinstall", "prepare"], publisherOnly: ["build"] });
    expect(classifyScripts({}, { hasBindingGyp: true }).consumerRun).toEqual([IMPLICIT_NODE_GYP]);
    expect(classifyScripts({ install: "x" }, { hasBindingGyp: true }).consumerRun).toEqual(["install"]);
  });

  it("walks the runtime dependency tree the way Node resolves it (nested first), not peers", () => {
    const manifests: Record<string, { version: string; dependencies?: Record<string, string>; peerDependencies?: Record<string, string>; scripts?: Record<string, string> }> = {
      "/c/node_modules/pkg": { version: "1.0.0", dependencies: { a: "^1" }, peerDependencies: { react: "^19" } },
      "/c/node_modules/a": { version: "1.1.0", dependencies: { b: "^1" } },
      "/c/node_modules/a/node_modules/b": { version: "1.9.0", scripts: { postinstall: "x" } },
      "/c/node_modules/react": { version: "19.2.7", scripts: { postinstall: "never visited" } },
    };
    const tree = walkDependencyTree("/c", "pkg", (dir) => manifests[dir]);
    expect(tree.nodes).toEqual([{ name: "a", version: "1.1.0", consumerRun: [] }, { name: "b", version: "1.9.0", consumerRun: ["postinstall"] }]);
    expect(tree.unresolved).toEqual([]);
    expect(walkDependencyTree("/c", "pkg", (dir) => (dir === "/c/node_modules/a" ? undefined : manifests[dir])).unresolved).toEqual(["a"]);
  });
});

describe("CCV-3 consumer, harness and probe generation", () => {
  it("pins every consumer tool exactly and installs the tarball by file path", () => {
    for (const version of Object.values(CCV_VITE_CONSUMER_PINS)) expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    const pkg = JSON.parse(consumerPackageJson("@skrewww/react", "/w/pack/skrewww-react-1.0.0.tgz"));
    expect(pkg.dependencies["@skrewww/react"]).toBe("file:/w/pack/skrewww-react-1.0.0.tgz");
    expect(JSON.stringify(pkg)).not.toMatch(/"[\^~]|latest|\*/);
  });

  it("generates a surface harness from the contract: one name per line, types via import type, from the package root only", () => {
    const harness = generateSurfaceHarness("@skrewww/react", ["Dialog", "DialogBody"], ["DialogProps"]);
    expect(harness.source).toContain('import type {\n  DialogProps,\n} from "@skrewww/react";');
    expect(harness.source).toContain('import {\n  Dialog,\n  DialogBody,\n} from "@skrewww/react";');
    expect(harness.source).not.toMatch(/@skrewww\/react\/|dist\//);
    expect(Array.from(harness.lines.values()).map((line) => `${line.kind}:${line.name}`).sort()).toEqual(["type:DialogProps", "value:Dialog", "value:Dialog", "value:DialogBody", "value:DialogBody"]);
  });

  it("generates a Node probe that imports the root and only RESOLVES specifiers", () => {
    const probe = generateProbe("@skrewww/react", ["@skrewww/react/styles.css", "@skrewww/react/dist/index.js"]);
    expect(probe).toContain("await import(packageName)");
    expect(probe).toContain("import.meta.resolve(specifier)");
    expect(probe).not.toMatch(/import\(specifier\)/);
    const parsed = parseProbeOutput('noise\n{"root":{"ok":true,"keys":["A"]},"resolutions":{}}\n');
    expect(parsed?.root).toEqual({ ok: true, keys: ["A"] });
    expect(parseProbeOutput("not json")).toBeUndefined();
  });

  it("judges public and denied specifiers from the recorded resolution evidence", () => {
    expect(judgeSpecifier("public", { resolved: true, target: "dist/styles.css" }).status).toBe("pass");
    expect(judgeSpecifier("public", { resolved: false, code: "ERR_PACKAGE_PATH_NOT_EXPORTED", message: "x" })).toMatchObject({ status: "fail", failureCode: "IMPORT_UNRESOLVED" });
    expect(judgeSpecifier("public", { resolved: true, target: "outside:x/y" })).toMatchObject({ status: "fail" });
    expect(judgeSpecifier("denied", { resolved: false, code: "ERR_PACKAGE_PATH_NOT_EXPORTED", message: "x" }).status).toBe("pass");
    expect(judgeSpecifier("denied", { resolved: true, target: "dist/index.js" })).toMatchObject({ status: "fail", failureCode: "DEEP_IMPORT_EXPOSED" });
    expect(judgeSpecifier("denied", { resolved: false, code: "ERR_MODULE_NOT_FOUND", message: "missing" })).toMatchObject({ status: "unknown" });
    expect(judgeSpecifier("denied", undefined).status).toBe("unknown");
  });

  it("compares runtime export names as an exact set", () => {
    expect(compareRuntimeExports(["A", "B"], ["A", "B"])).toEqual({ missing: [], unexpected: [] });
    expect(compareRuntimeExports(["A", "C", "D"], ["A", "B"])).toEqual({ missing: ["B"], unexpected: ["C", "D"] });
  });

  it("names result artifacts filesystem-safely", () => {
    expect(resultStem(["npm", "LOCAL_TARBALL", "@skrewww/react", SHA])).toBe(`npm.LOCAL_TARBALL.skrewww-react.${SHA}`);
    expect(resultStem(["shadcn", "LOCAL_CANONICAL", "button+card", SHA])).toBe(`shadcn.LOCAL_CANONICAL.button+card.${SHA}`);
  });
});
