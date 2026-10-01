import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe("canonical component source is framework-agnostic", () => {
  it("components/ui has no import or export from next/*", () => {
    const offenders = sourceFiles(join(root, "components/ui")).filter((file) =>
      /(?:from|import)\s*\(?\s*["']next(?:\/[^"']*)?["']/.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("the shared lib modules reachable from components/ui import no framework or app code", () => {
    const libs = ["cn", "use-controllable", "credit-card-field-format", "number-input-value", "phone-number-field-countries", "use-data-table-sort"];
    for (const name of libs) {
      const source = readFileSync(join(root, "lib", `${name}.ts`), "utf8");
      expect(source).not.toMatch(/from\s+["']next/);
      expect(source).not.toMatch(/from\s+["']@\/(?!lib\/use-controllable)/);
    }
  });
});

describe("@skrewww/react package manifest", () => {
  const pkg = JSON.parse(readFileSync(join(root, "packages/react/package.json"), "utf8"));

  it("is an unpublished, ESM-first candidate with an explicit public surface", () => {
    expect(pkg.name).toBe("@skrewww/react");
    // Release state (MK-2C): no longer private. Publication is guarded by the prepublish checks.
    expect(pkg.private).toBeUndefined();
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/);
    expect(pkg.type).toBe("module");
    expect(Object.keys(pkg.exports).sort()).toEqual([".", "./package.json", "./styles.css"]);
    expect(pkg.exports["."].types).toBe("./dist/index.d.ts");
    expect(pkg.exports["./styles.css"]).toBe("./dist/styles.css");
    expect(pkg.files).toEqual(["dist", "README.md", "LICENSE"]);
  });

  it("declares stylesheet side effects so consumer bundlers keep the CSS", () => {
    expect(pkg.sideEffects).toEqual(["**/*.css"]);
  });

  it("peers on React 19 only and depends on no framework or docs-app package", () => {
    expect(Object.keys(pkg.peerDependencies).sort()).toEqual(["react", "react-dom"]);
    expect(pkg.peerDependencies.react).toMatch(/^\^19\./);
    const all = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies });
    for (const forbidden of ["next", "recharts", "server-only", "@next/third-parties"]) {
      expect(all).not.toContain(forbidden);
    }
    expect(all.some((name) => name.startsWith("@vercel/"))).toBe(false);
    expect(Object.keys(pkg.dependencies ?? {})).toEqual(["@phosphor-icons/react"]);
  });
});
