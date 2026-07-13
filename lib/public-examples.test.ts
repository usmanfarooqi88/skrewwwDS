import { describe, expect, it } from "vitest";
import * as PublicUi from "@/components/ui";
import {
  componentRegistry,
  getImplementedRegistryEntries,
} from "@/lib/component-registry";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";

const PUBLIC_EXPORTS = new Set(Object.keys(PublicUi));

const FORBIDDEN_MODULE_SUFFIXES = [
  "/TextInputControl",
  "/TextareaControl",
  "/SelectControl",
  "/internal/",
] as const;

const IMPORT_FROM_REGEX =
  /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'](@\/components\/ui(?:\/[^"']+)?)["']/g;
const IMPORT_DEFAULT_REGEX =
  /import\s+(\w+)\s+from\s+["'](@\/components\/ui(?:\/[^"']+)?)["']/g;

function collectSkrewwwImports(source: string): Array<{ names: string[]; module: string }> {
  const results: Array<{ names: string[]; module: string }> = [];

  const namedMatches = Array.from(source.matchAll(IMPORT_FROM_REGEX));
  for (const match of namedMatches) {
    const names = match[1]
      .split(",")
      .map((part: string) => part.trim().split(/\s+as\s+/)[0]?.trim())
      .filter(Boolean) as string[];
    results.push({ names, module: match[2] });
  }

  const defaultMatches = Array.from(source.matchAll(IMPORT_DEFAULT_REGEX));
  for (const match of defaultMatches) {
    results.push({ names: [match[1]], module: match[2] });
  }

  return results;
}

function assertPublicExample(source: string, location: string) {
  expect(source.trim().length, `${location} must not be empty`).toBeGreaterThan(0);

  for (const { names, module } of collectSkrewwwImports(source)) {
    for (const suffix of FORBIDDEN_MODULE_SUFFIXES) {
      expect(
        module.includes(suffix),
        `${location} imports forbidden module ${module}`,
      ).toBe(false);
    }

    if (module === "@/components/ui") {
      for (const name of names) {
        expect(
          PUBLIC_EXPORTS.has(name),
          `${location} imports non-public export "${name}" from @/components/ui`,
        ).toBe(true);
      }
      continue;
    }

    const fileName = module.split("/").pop() ?? module;
    expect(
      PUBLIC_EXPORTS.has(fileName),
      `${location} imports implementation file ${module} instead of the public barrel export "${fileName}"`,
    ).toBe(true);
  }
}

describe("Public code examples", () => {
  it("uses only public exports in registry reactExample strings", () => {
    for (const entry of componentRegistry) {
      assertPublicExample(entry.reactExample, `registry:${entry.slug}`);
    }
  });

  it("requires a non-empty reactExample for every implemented component", () => {
    for (const entry of getImplementedRegistryEntries()) {
      expect(entry.reactExample.trim().length, entry.slug).toBeGreaterThan(0);
      assertPublicExample(entry.reactExample, `implemented:${entry.slug}`);
    }
  });

  it("does not publish react examples on redirect alias slugs", () => {
    for (const slug of REDIRECTED_COMPONENT_SLUGS) {
      const entry = componentRegistry.find((item) => item.slug === slug);
      expect(entry, `redirect slug ${slug} should not remain in registry`).toBeUndefined();
    }
  });
});
