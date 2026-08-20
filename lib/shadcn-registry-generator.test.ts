import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";
import {
  assertValidShadcnRegistryItem,
  buildButtonManifest,
  buildCardManifest,
  buildFormFieldManifest,
  buildFoundationManifest,
  buildTextInputManifest,
  buildValidationMessageManifest,
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

function textInputEntry() {
  const entry = componentRegistry.find((candidate) => candidate.slug === "text-input");
  if (!entry) throw new Error("text-input entry missing from canonical registry — fix the test fixture");
  return entry;
}

function formFieldEntry() {
  const entry = componentRegistry.find((candidate) => candidate.slug === "form-field");
  if (!entry) throw new Error("form-field entry missing from canonical registry — fix the test fixture");
  return entry;
}

function validationMessageEntry() {
  const entry = componentRegistry.find((candidate) => candidate.slug === "validation-message");
  if (!entry) throw new Error("validation-message entry missing from canonical registry — fix the test fixture");
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

    const firstTextInput = JSON.stringify(buildTextInputManifest());
    const secondTextInput = JSON.stringify(buildTextInputManifest());
    expect(firstTextInput).toBe(secondTextInput);

    const firstFormField = JSON.stringify(buildFormFieldManifest());
    const secondFormField = JSON.stringify(buildFormFieldManifest());
    expect(firstFormField).toBe(secondFormField);

    const firstValidationMessage = JSON.stringify(buildValidationMessageManifest());
    const secondValidationMessage = JSON.stringify(buildValidationMessageManifest());
    expect(firstValidationMessage).toBe(secondValidationMessage);
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

  it("includes semantic-text-danger and aliases action-danger to danger-500 in Foundation CSS", () => {
    const css = extractFoundationCss();
    expect(css).toMatch(/--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/);
    expect(css).toMatch(/--primitive-color-danger-600:\s*#cc3b37/);
    expect(css).toMatch(/--primitive-color-danger-500:\s*#e5484d/);
    expect(css).toMatch(/--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/);
    expect(css).not.toMatch(/--semantic-action-danger:\s*#d92d3e/);
    expect(css).not.toMatch(/--semantic-text-danger:[^;]*#/);
  });

  it("includes the sparse warning primitive family in Foundation CSS without inventing steps", () => {
    const css = extractFoundationCss();
    expect(css).toMatch(/--primitive-color-warning-100:\s*#fef3d6/i);
    expect(css).toMatch(/--primitive-color-warning-500:\s*#f5a524/i);
    expect(css).toMatch(/--primitive-color-warning-700:\s*#b9770e/i);
    expect(css).toMatch(/--primitive-color-warning-800:\s*#8a4f00/i);
    expect(css).toMatch(/--semantic-feedback-warning:\s*#b36a00/i);
    // Badge component locals live below the Form-control cut line and are not
    // Foundation-transported (Badge is not shadcn-distributed).
    expect(css).not.toMatch(/--badge-warning-text/);

    const steps = Array.from(css.matchAll(/--primitive-color-warning-(\d+):/g)).map((m) => m[1]);
    expect(steps.sort()).toEqual(["100", "500", "700", "800"]);
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
    expect(() => assertValidShadcnRegistryItem(buildTextInputManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildFormFieldManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildValidationMessageManifest())).not.toThrow();
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

  it("transports exactly TextInput.tsx + TextInputControl.tsx + text-input.module.css + lib/cn.ts, and declares form-field + foundation as registry dependencies (never bundling FormField/ValidationMessage files directly)", () => {
    const entry = textInputEntry();
    expect(entry.registryDependencies ?? []).toEqual(["@skrewww/form-field", "@skrewww/foundation"]);

    const manifest = buildTextInputManifest();
    const actualPaths = manifest.files.map((file) => file.path).sort();
    expect(actualPaths).toEqual([
      "components/ui/TextInput.tsx",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/form-field", "@skrewww/foundation"]);
  });

  it("transports exactly FormField.tsx + form-field.module.css + lib/cn.ts, and declares validation-message + foundation as registry dependencies", () => {
    const entry = formFieldEntry();
    expect(entry.registryDependencies ?? []).toEqual(["@skrewww/validation-message", "@skrewww/foundation"]);

    const manifest = buildFormFieldManifest();
    const actualPaths = manifest.files.map((file) => file.path).sort();
    expect(actualPaths).toEqual(["components/ui/FormField.tsx", "components/ui/form-field.module.css", "lib/cn.ts"]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/validation-message", "@skrewww/foundation"]);
    expect(manifest.files.find((file) => file.path.endsWith("form-field.module.css"))?.content).toContain(
      "--semantic-text-danger",
    );
    expect(extractFoundationCss()).toMatch(/--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/);
  });

  it("transports exactly ValidationMessage.tsx + validation-message.module.css + lib/cn.ts, and declares @phosphor-icons/react as its real npm dependency", () => {
    const entry = validationMessageEntry();
    expect(entry.dependencies ?? []).toEqual(["@phosphor-icons/react"]);

    const manifest = buildValidationMessageManifest();
    const actualPaths = manifest.files.map((file) => file.path).sort();
    expect(actualPaths).toEqual([
      "components/ui/ValidationMessage.tsx",
      "components/ui/validation-message.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
  });

  it("documents Text Input's and Form Field's host requirements as react + react-dom, without next", () => {
    expect(buildTextInputManifest().docs).toContain("react, react-dom");
    expect(buildTextInputManifest().docs).not.toContain("next");
    expect(buildFormFieldManifest().docs).toContain("react, react-dom");
    expect(buildFormFieldManifest().docs).not.toContain("next");
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
