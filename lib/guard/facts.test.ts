import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractSourceFacts } from "@/lib/guard/facts";
import { resolveInternalComponentSlug } from "@/lib/guard/provenance";
import type { JsxElementFact } from "@/lib/guard/types";

const FIXTURES_DIR = join(process.cwd(), "lib/guard/__fixtures__");

function loadFixture(relativePath: string) {
  const path = join(FIXTURES_DIR, relativePath);
  const content = readFileSync(path, "utf8");
  return extractSourceFacts({ path: relativePath, content });
}

function requireOk(result: ReturnType<typeof extractSourceFacts>) {
  if (!result.ok) {
    throw new Error(`Expected successful extraction, got parse errors: ${JSON.stringify(result.errors)}`);
  }
  return result;
}

/** Resolves a JsxElementFact's tag to a real Skrewww slug, or undefined if not a recognized Skrewww import. */
function slugFor(element: JsxElementFact): string | undefined {
  if (element.resolution.kind !== "imported") return undefined;
  return resolveInternalComponentSlug(element.resolution.import);
}

describe("extractSourceFacts — valid fixtures", () => {
  it("direct-import.tsx: resolves a directly-imported Button to the real 'button' slug", () => {
    const result = requireOk(loadFixture("valid/direct-import.tsx"));
    expect(result.imports).toEqual([
      expect.objectContaining({ localName: "Button", importedName: "Button", moduleSpecifier: "@/components/ui/Button", kind: "named" }),
    ]);
    expect(result.jsxElements).toHaveLength(1);
    expect(slugFor(result.jsxElements[0])).toBe("button");
    expect(result.jsxElements[0].attributes).toEqual([
      { valueKind: "static-string", name: "variant", value: "primary", range: expect.anything() },
    ]);
  });

  it("aliased-import.tsx: an aliased import still resolves to the real 'button' slug via the JSX call site's local name", () => {
    const result = requireOk(loadFixture("valid/aliased-import.tsx"));
    expect(result.imports).toEqual([
      expect.objectContaining({ localName: "PrimaryAction", importedName: "Button", moduleSpecifier: "@/components/ui/Button", kind: "named-aliased" }),
    ]);
    expect(result.jsxElements).toHaveLength(1);
    expect(result.jsxElements[0].resolution).toEqual(
      expect.objectContaining({ kind: "imported", import: expect.objectContaining({ localName: "PrimaryAction" }) }),
    );
    expect(slugFor(result.jsxElements[0])).toBe("button");
  });

  it("barrel-import.tsx: barrel-imported components (Button, Card) both resolve to their real slugs", () => {
    const result = requireOk(loadFixture("valid/barrel-import.tsx"));
    expect(result.imports.map((i) => i.localName)).toEqual(["Button", "Card"]);
    const slugs = result.jsxElements.map(slugFor).sort();
    expect(slugs).toEqual(["button", "card"]);
  });

  it("boolean-prop.tsx: extracts boolean-shorthand attributes distinctly from static-string ones", () => {
    const result = requireOk(loadFixture("valid/boolean-prop.tsx"));
    const attrs = result.jsxElements[0].attributes;
    expect(attrs).toContainEqual(expect.objectContaining({ valueKind: "static-string", name: "variant", value: "primary" }));
    expect(attrs).toContainEqual(expect.objectContaining({ valueKind: "boolean-shorthand", name: "loading" }));
    expect(attrs).toContainEqual(expect.objectContaining({ valueKind: "boolean-shorthand", name: "fullWidth" }));
  });

  it("multiple-components.tsx: three distinct Skrewww components in one file all resolve independently", () => {
    const result = requireOk(loadFixture("valid/multiple-components.tsx"));
    const slugs = result.jsxElements.map(slugFor).sort();
    expect(slugs).toEqual(["badge", "button", "card"]);
  });

  it("native-elements.tsx: lowercase tags are classified intrinsic, never resolved against imports", () => {
    const result = requireOk(loadFixture("valid/native-elements.tsx"));
    const intrinsics = result.jsxElements.filter((el) => el.resolution.kind === "intrinsic");
    expect(intrinsics.map((el) => (el.resolution as { tagName: string }).tagName).sort()).toEqual(["div", "span"]);
    const imported = result.jsxElements.filter((el) => el.resolution.kind === "imported");
    expect(imported).toHaveLength(1);
    expect(slugFor(imported[0])).toBe("button");
  });
});

describe("extractSourceFacts — adversarial edge cases", () => {
  it("spread-props.tsx: a spread attribute never expands, and coexists with an explicit literal attribute", () => {
    const result = requireOk(loadFixture("edge-cases/spread-props.tsx"));
    const element = result.jsxElements[0];
    expect(element.hasSpreadAttributes).toBe(true);
    expect(element.attributes).toEqual([
      { valueKind: "spread", range: expect.anything() },
      { valueKind: "static-string", name: "variant", value: "primary", range: expect.anything() },
    ]);
    // The rule-safety guarantee this fixture exists to prove: nothing
    // about the spread's actual contents is ever claimed.
    expect(element.attributes.find((a) => a.valueKind === "spread")).not.toHaveProperty("name");
  });

  it("wrapper-component.tsx: the inner Button {...props} resolves to real Skrewww provenance; the outer MyButton call site stays local-or-unresolved and is never traced into", () => {
    const result = requireOk(loadFixture("edge-cases/wrapper-component.tsx"));
    expect(result.jsxElements).toHaveLength(2);

    const inner = result.jsxElements.find((el) => el.resolution.kind === "imported");
    expect(inner).toBeDefined();
    expect(slugFor(inner!)).toBe("button");
    expect(inner!.hasSpreadAttributes).toBe(true);

    const outer = result.jsxElements.find((el) => el.resolution.kind === "local-or-unresolved");
    expect(outer).toBeDefined();
    expect((outer!.resolution as { tagName: string }).tagName).toBe("MyButton");
    // The outer call site's own attribute ("fakeProp") is visible as a
    // structural fact, but it is attached to the unresolved MyButton
    // element, never merged into the inner, real Button element.
    expect(outer!.attributes).toEqual([
      expect.objectContaining({ valueKind: "static-string", name: "fakeProp", value: "x" }),
    ]);
  });

  it("local-button-name.tsx: a locally-declared component sharing the name 'Button' never resolves as the real Skrewww Button", () => {
    const result = requireOk(loadFixture("edge-cases/local-button-name.tsx"));
    expect(result.imports).toEqual([]); // nothing imported at all
    const outer = result.jsxElements.find((el) => (el as JsxElementFact & { resolution: { tagName?: string } }).resolution.tagName === "Button");
    expect(outer).toBeDefined();
    expect(outer!.resolution.kind).toBe("local-or-unresolved");
  });

  it("local-button-import.tsx: Button imported from a non-Skrewww path resolves to no slug", () => {
    const result = requireOk(loadFixture("edge-cases/local-button-import.tsx"));
    expect(result.imports).toEqual([
      expect.objectContaining({ localName: "Button", moduleSpecifier: "./local-button" }),
    ]);
    expect(result.jsxElements[0].resolution.kind).toBe("imported"); // structurally resolved to the import...
    expect(slugFor(result.jsxElements[0])).toBeUndefined(); // ...but provenance correctly rejects the non-Skrewww module path
  });

  it("dynamic-prop-value.tsx: a JsxExpression-valued attribute is marked dynamic, name still known, value never claimed", () => {
    const result = requireOk(loadFixture("edge-cases/dynamic-prop-value.tsx"));
    const attrs = result.jsxElements[0].attributes;
    expect(attrs).toContainEqual(expect.objectContaining({ valueKind: "static-string", name: "variant", value: "primary" }));
    const dynamic = attrs.find((a) => a.valueKind === "dynamic");
    expect(dynamic).toEqual({ valueKind: "dynamic", name: "size", range: expect.anything() });
    expect(dynamic).not.toHaveProperty("value");
  });

  it("malformed-source.tsx: a genuine syntax error is reported as a typed parse error, never silently recovered from", () => {
    const result = loadFixture("edge-cases/malformed-source.tsx");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].kind).toBe("parse-error");
    expect(typeof result.errors[0].message).toBe("string");
    expect(result.errors[0].message.length).toBeGreaterThan(0);
  });

  it("default-and-namespace-import.tsx: default and namespace imports extract with the correct synthetic importedName", () => {
    const result = requireOk(loadFixture("edge-cases/default-and-namespace-import.tsx"));
    expect(result.imports).toContainEqual(
      expect.objectContaining({ localName: "Button", importedName: "Button", kind: "named" }),
    );
    expect(result.imports).toContainEqual(
      expect.objectContaining({ localName: "DefaultThing", importedName: "default", kind: "default" }),
    );
    expect(result.imports).toContainEqual(
      expect.objectContaining({ localName: "NS", importedName: "*", kind: "namespace" }),
    );
  });

  it("member-expression-jsx.tsx: <UI.Button /> is represented as member-expression, never resolved or misclassified", () => {
    const result = requireOk(loadFixture("edge-cases/member-expression-jsx.tsx"));
    expect(result.jsxElements).toHaveLength(1);
    expect(result.jsxElements[0].resolution).toEqual({ kind: "member-expression", text: "UI.Button" });
  });
});

describe("extractSourceFacts — determinism", () => {
  it("produces deeply-equal facts across repeated runs on the same source, for every fixture", () => {
    const fixtures = [
      "valid/direct-import.tsx",
      "valid/aliased-import.tsx",
      "valid/barrel-import.tsx",
      "valid/boolean-prop.tsx",
      "valid/multiple-components.tsx",
      "valid/native-elements.tsx",
      "edge-cases/spread-props.tsx",
      "edge-cases/wrapper-component.tsx",
      "edge-cases/local-button-name.tsx",
      "edge-cases/local-button-import.tsx",
      "edge-cases/dynamic-prop-value.tsx",
      "edge-cases/malformed-source.tsx",
      "edge-cases/default-and-namespace-import.tsx",
      "edge-cases/member-expression-jsx.tsx",
    ];
    for (const fixture of fixtures) {
      const first = loadFixture(fixture);
      const second = loadFixture(fixture);
      expect(second).toEqual(first);
    }
  });

  it("source ranges are stable byte offsets translated to line/column, not machine-specific absolute paths", () => {
    const result = requireOk(loadFixture("valid/direct-import.tsx"));
    expect(result.path).toBe("valid/direct-import.tsx"); // caller-provided logical path, never absolute
    expect(result.imports[0].range.start).toEqual({ line: expect.any(Number), column: expect.any(Number) });
  });
});
