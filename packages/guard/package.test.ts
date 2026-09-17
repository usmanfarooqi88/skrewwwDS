import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PKG = join(ROOT, "packages", "guard");

describe("Guard package candidate", () => {
  it("package.json ships only runtime essentials", () => {
    const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as {
      name: string;
      version: string;
      license: string;
      bin: Record<string, string>;
      files: string[];
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe("@skrewww/guard");
    expect(pkg.version).toBe("0.1.0-beta.1");
    expect(pkg.license).toBe("MIT");
    expect(pkg.bin["skrewww-guard"]).toBe("./dist/cli.js");
    expect(pkg.files).toEqual(["dist", "facts", "README.md", "LICENSE"]);
    expect(pkg.dependencies.typescript).toBeTruthy();
    expect(pkg.files).not.toContain("src");
  });

  it("dist CLI + facts exist after build:guard-package (or committed build)", () => {
    // CI/fresh checkout may need a build; attempt once if missing.
    if (!existsSync(join(PKG, "dist", "cli.js"))) {
      const built = spawnSync("npm", ["run", "build:guard-package"], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(built.status, built.stderr).toBe(0);
    }
    expect(existsSync(join(PKG, "dist", "cli.js"))).toBe(true);
    expect(existsSync(join(PKG, "facts", "consumer-facts.json"))).toBe(true);
    const help = spawnSync(process.execPath, [join(PKG, "dist", "cli.js"), "--help"], {
      encoding: "utf8",
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Public consumer rules (3)");
    expect(help.stdout).not.toContain("--internal");
  });

  it("npm pack includes only allowed files", () => {
    if (!existsSync(join(PKG, "dist", "cli.js"))) {
      spawnSync("npm", ["run", "build:guard-package"], { cwd: ROOT, encoding: "utf8" });
    }
    const packed = spawnSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: PKG,
      encoding: "utf8",
    });
    expect(packed.status).toBe(0);
    const parsed = JSON.parse(packed.stdout) as Array<{ files: Array<{ path: string }> }>;
    const paths = parsed[0]?.files.map((f) => f.path) ?? [];
    expect(paths).toContain("dist/cli.js");
    expect(paths).toContain("facts/consumer-facts.json");
    expect(paths).toContain("README.md");
    expect(paths).toContain("LICENSE");
    expect(paths).toContain("package.json");
    expect(paths.some((p) => p.includes("Reference") || p.includes("figma"))).toBe(false);
    expect(paths.length).toBe(5);
  });

  it("isolated tarball install works outside the Skrewww repo", () => {
    if (!existsSync(join(PKG, "dist", "cli.js"))) {
      spawnSync("npm", ["run", "build:guard-package"], { cwd: ROOT, encoding: "utf8" });
    }
    const pack = spawnSync("npm", ["pack"], { cwd: PKG, encoding: "utf8" });
    expect(pack.status).toBe(0);
    const tgzName = pack.stdout.trim().split("\n").pop()!;
    const tgz = join(PKG, tgzName);
    const consumer = mkdtempSync(join(tmpdir(), "skrewww-guard-pkg-"));
    try {
      expect(consumer.startsWith(ROOT)).toBe(false);
      writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "c", private: true }), "utf8");
      const install = spawnSync("npm", ["install", tgz, "--no-fund", "--no-audit"], {
        cwd: consumer,
        encoding: "utf8",
      });
      expect(install.status, install.stderr).toBe(0);
      const bin = join(consumer, "node_modules", ".bin", "skrewww-guard");
      const help = spawnSync(bin, ["--help"], { cwd: consumer, encoding: "utf8" });
      expect(help.status).toBe(0);
      expect(help.stdout).toContain("@skrewww-component");
      // No repo registry in consumer tree
      expect(existsSync(join(consumer, "lib", "component-registry.ts"))).toBe(false);
    } finally {
      rmSync(consumer, { recursive: true, force: true });
      if (existsSync(tgz)) rmSync(tgz, { force: true });
    }
  }, 120_000);
});
