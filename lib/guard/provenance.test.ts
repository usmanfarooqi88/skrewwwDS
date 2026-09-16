import { describe, expect, it } from "vitest";
import { classifyInternalImportProvenance, resolveInternalComponentSlug } from "@/lib/guard/provenance";
import type { ImportFact } from "@/lib/guard/types";

const RANGE = { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };

function fact(overrides: Partial<ImportFact>): ImportFact {
  return {
    localName: "Button",
    importedName: "Button",
    moduleSpecifier: "@/components/ui/Button",
    kind: "named",
    range: RANGE,
    ...overrides,
  };
}

describe("classifyInternalImportProvenance", () => {
  it("classifies a direct component-file import", () => {
    expect(classifyInternalImportProvenance("@/components/ui/Button")).toEqual({
      kind: "internal-ui-direct",
      fileBaseName: "Button",
    });
  });

  it("classifies the barrel import", () => {
    expect(classifyInternalImportProvenance("@/components/ui")).toEqual({ kind: "internal-ui-barrel" });
  });

  it("rejects a user's own app-composition path (RequestForm-shaped)", () => {
    expect(classifyInternalImportProvenance("@/components/reference-app/RequestForm")).toEqual({ kind: "unknown" });
  });

  it("rejects a relative, non-Skrewww local import", () => {
    expect(classifyInternalImportProvenance("./local-button")).toEqual({ kind: "unknown" });
  });

  it("rejects a third-party package import", () => {
    expect(classifyInternalImportProvenance("some-library")).toEqual({ kind: "unknown" });
  });

  it("rejects an internal-helper subdirectory path (not a public component file)", () => {
    expect(classifyInternalImportProvenance("@/components/ui/internal/TreeItem")).toEqual({ kind: "unknown" });
  });
});

describe("resolveInternalComponentSlug", () => {
  it("resolves a direct import of a real component to its real slug", () => {
    expect(resolveInternalComponentSlug(fact({}))).toBe("button");
  });

  it("resolves an aliased local name via the barrel using the ORIGINAL imported name, not the alias", () => {
    expect(
      resolveInternalComponentSlug(
        fact({ localName: "PrimaryAction", importedName: "Button", moduleSpecifier: "@/components/ui" }),
      ),
    ).toBe("button");
  });

  it("returns undefined for an import from a non-Skrewww path, regardless of local name", () => {
    expect(
      resolveInternalComponentSlug(fact({ moduleSpecifier: "@/components/reference-app/RequestForm" })),
    ).toBeUndefined();
    expect(resolveInternalComponentSlug(fact({ moduleSpecifier: "./local-button" }))).toBeUndefined();
  });

  it("returns undefined for an invented component name imported from a real Skrewww-shaped path", () => {
    expect(
      resolveInternalComponentSlug(
        fact({ localName: "CommandPalette", importedName: "CommandPalette", moduleSpecifier: "@/components/ui/CommandPalette" }),
      ),
    ).toBeUndefined();
  });

  it("returns undefined for a default or namespace import THROUGH THE BARREL — 'default'/'*' name no single real component file", () => {
    expect(
      resolveInternalComponentSlug(fact({ importedName: "default", kind: "default", moduleSpecifier: "@/components/ui" })),
    ).toBeUndefined();
    expect(
      resolveInternalComponentSlug(fact({ localName: "UI", importedName: "*", kind: "namespace", moduleSpecifier: "@/components/ui" })),
    ).toBeUndefined();
  });

  it("resolves via the module path alone for a DIRECT file import, regardless of import kind — the path unambiguously names one file", () => {
    // Structural resolution, not a semantic-validity claim: this repo's
    // real Button.tsx has no default export, so `import Button from
    // "@/components/ui/Button"` would be a real TypeScript error in
    // practice — G-0 never type-checks, only extracts structure, so it
    // still resolves the file the path names. A future rule (not G-0's
    // job) could separately flag "wrong import kind for this file" if
    // ever needed.
    expect(
      resolveInternalComponentSlug(fact({ importedName: "default", kind: "default", moduleSpecifier: "@/components/ui/Button" })),
    ).toBe("button");
  });
});
