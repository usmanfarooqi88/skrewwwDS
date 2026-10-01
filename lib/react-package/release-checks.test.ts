import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkDistIntegrity,
  checkManifest,
  checkPackedFiles,
  extractExportedNames,
  isPublishBlockedByPrivate,
} from "@/lib/react-package/release-checks";

const manifest = () => JSON.parse(readFileSync(join(process.cwd(), "packages/react/package.json"), "utf8"));
const messages = (pkg: object) => checkManifest(pkg).map((issue) => issue.message);

describe("@skrewww/react manifest release contract", () => {
  it("the real manifest satisfies it", () => {
    expect(checkManifest(manifest())).toEqual([]);
  });

  it("publishes publicly under an explicit beta tag, with explicit engines, and is no longer private (release state)", () => {
    const pkg = manifest();
    expect(pkg.publishConfig).toEqual({ access: "public", tag: "beta" });
    expect(pkg.engines.node).toBeTruthy();
    expect(pkg.version).toBe("0.1.0-beta.1");
    expect(isPublishBlockedByPrivate(pkg)).toBe(false);
    expect(pkg.scripts.prepublishOnly).toMatch(/prepublish:react-package/);
  });

  it.each([
    ["public access missing", (p: any) => { delete p.publishConfig.access; }, /access/],
    ["tag missing", (p: any) => { delete p.publishConfig.tag; }, /tag must be set/],
    ["prerelease on latest", (p: any) => { p.publishConfig.tag = "latest"; }, /non-latest/],
    ["engines missing", (p: any) => { delete p.engines; }, /engines/],
    ["prepublish guard missing", (p: any) => { delete p.scripts; }, /prepublishOnly/],
    ["resolved-tag guard dropped from prepublishOnly", (p: any) => { p.scripts.prepublishOnly = "npm --prefix ../.. run prepublish:react-package"; }, /resolved-publish-tag guard/],
    ["next dependency", (p: any) => { p.dependencies.next = "^16"; }, /forbidden dependency: next/],
    ["recharts peer", (p: any) => { p.peerDependencies.recharts = "^3"; }, /peerDependencies|recharts/],
    ["@vercel dependency", (p: any) => { p.dependencies["@vercel/analytics"] = "^2"; }, /forbidden dependency/],
    ["extra export", (p: any) => { p.exports["./internal"] = "./dist/internal.js"; }, /exports must be exactly/],
    ["files widened", (p: any) => { p.files = ["dist", "src", "README.md", "LICENSE"]; }, /files must be exactly/],
    ["CSS side effects dropped", (p: any) => { p.sideEffects = false; }, /sideEffects/],
    ["React 18 peer claimed", (p: any) => { p.peerDependencies.react = "^18.0.0"; }, /React 19/],
    ["wrong name", (p: any) => { p.name = "@skrewww/ui"; }, /name must be/],
  ])("rejects: %s", (_name, mutate, expected) => {
    const pkg = manifest();
    mutate(pkg);
    expect(messages(pkg).join("\n")).toMatch(expected);
  });
});

describe("packed file allowlist", () => {
  const good = ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.d.ts", "dist/styles.css", "dist/types/lib/cn.d.ts"];

  it("accepts package metadata and dist only", () => {
    expect(checkPackedFiles(good)).toEqual([]);
  });

  it("rejects repository files and a missing dist", () => {
    expect(checkPackedFiles([...good, "app/page.tsx"]).map((i) => i.message).join()).toMatch(/unexpected file.*app\/page.tsx/);
    expect(checkPackedFiles(["package.json", "README.md", "LICENSE"]).map((i) => i.message).join()).toMatch(/dist\/index\.js/);
  });
});

describe("extractExportedNames", () => {
  it("splits runtime values from type-only exports", () => {
    const names = extractExportedNames(
      'export { Button } from "a";\nexport type { ButtonProps, ButtonSize } from "a";\nexport { Dialog, DialogTitle, } from "b";',
    );
    expect(names).toEqual({ values: ["Button", "Dialog", "DialogTitle"], types: ["ButtonProps", "ButtonSize"] });
  });
});

describe("dist integrity", () => {
  const dirs: string[] = [];
  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
  });

  function makeDist(options: { js?: string; dts?: string; css?: string; extraDts?: Record<string, string> } = {}) {
    const dir = mkdtempSync(join(tmpdir(), "skrewww-dist-"));
    dirs.push(dir);
    mkdirSync(join(dir, "types"), { recursive: true });
    writeFileSync(join(dir, "index.js"), options.js ?? "const A = 1;\nexport {\n  A,\n  B\n};\n");
    writeFileSync(join(dir, "index.d.ts"), options.dts ?? 'export { A, B } from "./types/x";\nexport type { T } from "./types/x";\n');
    writeFileSync(join(dir, "styles.css"), options.css ?? ":root{}");
    writeFileSync(join(dir, "types", "x.d.ts"), "export declare const A: number;\nexport declare const B: number;\nexport type T = string;\n");
    for (const [path, content] of Object.entries(options.extraDts ?? {})) writeFileSync(join(dir, path), content);
    return dir;
  }
  const expected = { values: ["A", "B"], types: ["T"] };

  it("passes for a complete, consistent dist", () => {
    expect(checkDistIntegrity(makeDist(), expected)).toEqual([]);
  });

  it("fails when dist is missing files", () => {
    const dir = makeDist();
    rmSync(join(dir, "styles.css"));
    expect(checkDistIntegrity(dir, expected).map((i) => i.message).join()).toMatch(/styles\.css/);
    expect(checkDistIntegrity(join(dir, "nope"), expected).length).toBeGreaterThan(0);
  });

  it("fails when an expected export is absent from the JS or the declarations (stale build)", () => {
    const staleJs = makeDist({ js: "export {\n  A\n};\n" });
    expect(checkDistIntegrity(staleJs, expected).map((i) => i.message).join()).toMatch(/index\.js does not export B/);
    const staleDts = makeDist({ dts: 'export { A } from "./types/x";\n' });
    expect(checkDistIntegrity(staleDts, expected).map((i) => i.message).join()).toMatch(/index\.d\.ts does not export (B|type T)/);
  });

  it("fails on an unresolved relative declaration import (incomplete dist)", () => {
    const dir = makeDist({ extraDts: { "types/y.d.ts": 'export * from "./missing";\n' } });
    expect(checkDistIntegrity(dir, expected).map((i) => i.message).join()).toMatch(/unresolved declaration import \.\/missing/);
  });
});
