import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";
import {
  assertValidShadcnRegistryItem,
  buildButtonManifest,
  buildCardManifest,
  buildFoundationManifest,
  classifyFile,
  extractFoundationCss,
  extractFoundationCssFromSource,
} from "@/lib/shadcn-registry-generator";

const REPO_ROOT = process.cwd();

function readRepoFile(relPath: string): string {
  return readFileSync(join(REPO_ROOT, relPath), "utf8");
}

function buttonEntry() {
  const entry = componentRegistry.find((candidate) => candidate.slug === "button");
  if (!entry) throw new Error("button entry missing from canonical registry — fix the test fixture");
  return entry;
}

function cardEntry() {
  const entry = componentRegistry.find((candidate) => candidate.slug === "card");
  if (!entry) throw new Error("card entry missing from canonical registry — fix the test fixture");
  return entry;
}

describe("shadcn registry generator", () => {
  it("generates deterministic output for the same canonical input", () => {
    const first = JSON.stringify(buildButtonManifest());
    const second = JSON.stringify(buildButtonManifest());
    expect(first).toBe(second);

    const firstFoundation = JSON.stringify(buildFoundationManifest());
    const secondFoundation = JSON.stringify(buildFoundationManifest());
    expect(firstFoundation).toBe(secondFoundation);

    const firstCard = JSON.stringify(buildCardManifest());
    const secondCard = JSON.stringify(buildCardManifest());
    expect(firstCard).toBe(secondCard);
  });

  it("transports every canonical Button file and internal dependency exactly once", () => {
    const entry = buttonEntry();
    const expectedPaths = [...(entry.files ?? []), ...(entry.internalDependencies ?? [])];
    const manifest = buildButtonManifest();
    const actualPaths = manifest.files.map((file) => file.path);

    expect(actualPaths).toHaveLength(expectedPaths.length);
    expect(new Set(actualPaths)).toEqual(new Set(expectedPaths));
    expect(new Set(actualPaths).size).toBe(actualPaths.length);
  });

  it("copies file content byte-for-byte from the real canonical source", () => {
    const manifest = buildButtonManifest();
    for (const file of manifest.files) {
      expect(file.content).toBe(readRepoFile(file.path));
    }
  });

  it("gives every transported file an explicit, non-default type and a non-empty target", () => {
    const entry = buttonEntry();
    const transportedPaths = [...(entry.files ?? []), ...(entry.internalDependencies ?? [])];

    for (const relPath of transportedPaths) {
      const { type, target } = classifyFile(relPath);
      expect(["registry:ui", "registry:lib", "registry:file"]).toContain(type);
      expect(target.startsWith("~/")).toBe(true);
      expect(target).not.toBe("");
    }
  });

  it("fails generation for an unrecognized file path instead of defaulting", () => {
    expect(() => classifyFile("components/ui/DoesNotExist.tsx")).toThrow(/no explicit shadcn type\/target mapping/);
    expect(() => classifyFile("lib/some-future-helper.ts")).toThrow(/no explicit shadcn type\/target mapping/);
  });

  it("includes .sr-only in the extracted Foundation CSS", () => {
    const css = extractFoundationCss();
    expect(css).toContain(".sr-only");
  });

  it("throws when a Foundation extraction marker is missing", () => {
    expect(() => extractFoundationCssFromSource("body { color: red; }", ".sr-only {}")).toThrow(
      /extraction marker not found/,
    );
  });

  it("throws when Foundation extraction markers are present but out of order", () => {
    const reordered = [
      "/* ── Surface modes ── */",
      "[data-skrewww-surface='flat'] { --x: 1; }",
      ":root {",
      "--foo: 1;",
      "/* ── Form control geometry */",
      "/* ── Shape modes ── */",
      "[data-skrewww-shape='sharp'] { --y: 2; }",
    ].join("\n");

    expect(() => extractFoundationCssFromSource(reordered, ".sr-only {}")).toThrow(/marker ordering assumption violated/);
  });

  it("keeps @skrewww/foundation as a real registryDependency, canonically and in the generated manifest", () => {
    const entry = buttonEntry();
    expect(entry.registryDependencies ?? []).toContain("@skrewww/foundation");

    const manifest = buildButtonManifest();
    expect(manifest.registryDependencies).toContain("@skrewww/foundation");
  });

  it("produces manifests that satisfy the supported shadcn registry-item structural shape", () => {
    expect(() => assertValidShadcnRegistryItem(buildFoundationManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildButtonManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildCardManifest())).not.toThrow();
  });

  it("transports exactly Card.tsx + card.module.css + lib/cn.ts, nothing more", () => {
    const manifest = buildCardManifest();
    const actualPaths = manifest.files.map((file) => file.path).sort();
    expect(actualPaths).toEqual(["components/ui/Card.tsx", "components/ui/card.module.css", "lib/cn.ts"]);
  });

  it("keeps @skrewww/foundation as Card's registryDependency, canonically and in the generated manifest", () => {
    const entry = cardEntry();
    expect(entry.registryDependencies ?? []).toContain("@skrewww/foundation");

    const manifest = buildCardManifest();
    expect(manifest.registryDependencies).toContain("@skrewww/foundation");
  });

  it("documents Card's host requirements as react + react-dom, without next (unlike Button)", () => {
    const manifest = buildCardManifest();
    expect(manifest.docs).toContain("react, react-dom");
    expect(manifest.docs).not.toContain("next");
  });

  it("rejects a registry item with an empty target as invalid", () => {
    const invalid = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: "invalid",
      type: "registry:ui",
      title: "Invalid",
      description: "test fixture",
      author: "Skrewww",
      dependencies: [],
      registryDependencies: [],
      files: [{ path: "components/ui/x.tsx", content: "", type: "registry:ui", target: "" }],
    };

    expect(() => assertValidShadcnRegistryItem(invalid)).toThrow(/empty target/);
  });
});
