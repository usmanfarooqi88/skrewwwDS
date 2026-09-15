import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";
import {
  assertValidShadcnRegistryItem,
  buildButtonManifest,
  buildCardManifest,
  buildCheckboxManifest,
  buildDividerManifest,
  buildFormFieldManifest,
  buildFoundationManifest,
  buildLinkManifest,
  buildProgressBarManifest,
  buildRadioManifest,
  buildSkeletonManifest,
  buildSpinnerManifest,
  buildSwitchManifest,
  buildTextareaManifest,
  buildPaginationManifest,
  buildAvatarManifest,
  buildBreadcrumbManifest,
  buildRadioGroupManifest,
  buildSliderManifest,
  buildStepperManifest,
  buildTableManifest,
  buildTextInputManifest,
  buildValidationMessageManifest,
  buildBadgeManifest,
  buildTagManifest,
  buildListItemManifest,
  buildTimelineManifest,
  buildEmptyStateManifest,
  buildAlertManifest,
  buildToastManifest,
  buildButtonGroupManifest,
  buildToggleGroupManifest,
  buildAccordionManifest,
  buildTabsManifest,
  buildSearchFieldManifest,
  buildCreditCardFieldManifest,
  buildNumberInputManifest,
  buildFileUploadManifest,
  buildPopoverManifest,
  buildTooltipManifest,
  buildDialogManifest,
  buildDrawerManifest,
  buildMenuManifest,
  buildSplitButtonManifest,
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

  it("includes semantic-icon-danger aliased to danger-500 in Foundation CSS", () => {
    const css = extractFoundationCss();
    expect(css).toMatch(/--semantic-icon-danger:\s*var\(--primitive-color-danger-500\)/);
    expect(css).toMatch(/--semantic-icon-muted:\s*var\(--primitive-color-neutral-400\)/);
    expect(css).not.toMatch(/--semantic-icon-default:/);
    expect(css).not.toMatch(/--semantic-icon-danger:[^;]*#/);
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

  it("includes Validation Message typed text tokens and sparse success/info-700 primitives in Foundation CSS", () => {
    const css = extractFoundationCss();
    expect(css).toMatch(/--primitive-color-success-700:\s*#1f7a4d/i);
    expect(css).toMatch(/--primitive-color-info-700:\s*#1d4ed8/i);
    expect(css).toMatch(
      /--component-validation-message-error-text:\s*var\(--primitive-color-danger-600\)/,
    );
    expect(css).toMatch(
      /--component-validation-message-warning-text:\s*var\(--primitive-color-warning-800\)/,
    );
    expect(css).toMatch(
      /--component-validation-message-success-text:\s*var\(--primitive-color-success-700\)/,
    );
    expect(css).toMatch(
      /--component-validation-message-info-text:\s*var\(--primitive-color-info-700\)/,
    );
    expect(css).toMatch(
      /--component-validation-message-text:\s*var\(--primitive-color-danger-600\)/,
    );
    expect(css).toMatch(/--semantic-feedback-success:\s*#1a8b4c/i);
    expect(css).toMatch(/--semantic-feedback-info:\s*#2563c7/i);
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
    expect(() => assertValidShadcnRegistryItem(buildSpinnerManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildDividerManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildLinkManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildCheckboxManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildProgressBarManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildSkeletonManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildRadioManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildSwitchManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildTextareaManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildPaginationManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildAvatarManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildBreadcrumbManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildRadioGroupManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildSliderManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildStepperManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildTableManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildBadgeManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildTagManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildListItemManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildTimelineManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildEmptyStateManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildAlertManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildToastManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildButtonGroupManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildToggleGroupManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildAccordionManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildTabsManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildSearchFieldManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildCreditCardFieldManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildNumberInputManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildFileUploadManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildPopoverManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildTooltipManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildDialogManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildDrawerManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildMenuManifest())).not.toThrow();
    expect(() => assertValidShadcnRegistryItem(buildSplitButtonManifest())).not.toThrow();
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

  it("transports Spinner with Foundation spinner geometry tokens", () => {
    const manifest = buildSpinnerManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Spinner.tsx",
      "components/ui/spinner.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(extractFoundationCss()).toMatch(/--spinner-size-md:\s*1\.25rem/);
    expect(extractFoundationCss()).toMatch(/--spinner-animation-duration:\s*0\.8s/);
  });

  it("transports Divider with Foundation divider geometry tokens", () => {
    const manifest = buildDividerManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Divider.tsx",
      "components/ui/divider.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(extractFoundationCss()).toMatch(/--divider-color:\s*var\(--semantic-border-default\)/);
    expect(extractFoundationCss()).toMatch(/--divider-thickness:\s*1px/);
  });

  it("transports Link without site-config and with local link geometry in CSS", () => {
    const manifest = buildLinkManifest();
    const paths = manifest.files.map((file) => file.path).sort();
    expect(paths).toEqual([
      "components/ui/Link.tsx",
      "components/ui/internal/link-utils.ts",
      "components/ui/link.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.docs).toContain("next");
    const joined = manifest.files.map((file) => file.content).join("\n");
    expect(joined).not.toMatch(/site-config/);
    expect(joined).toMatch(/--link-text-default:\s*var\(--semantic-action-primary\)/);
    expect(joined).not.toMatch(/\/Users\//);
  });

  it("transports Checkbox with foundation-only registry dependency (Tier-1 Stable)", () => {
    const manifest = buildCheckboxManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Checkbox.tsx",
      "components/ui/checkbox.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(manifest.docs).toContain("react, react-dom");
    expect(manifest.docs).not.toContain("next");
    expect(JSON.stringify(manifest)).not.toMatch(/hostRequirements/);
  });

  it("transports Progress Bar with foundation-only registry dependency (Tier-1 Stable)", () => {
    const manifest = buildProgressBarManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/ProgressBar.tsx",
      "components/ui/progress-bar.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
  });

  it("transports Skeleton with foundation-only registry dependency (Tier-1 Stable)", () => {
    const manifest = buildSkeletonManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Skeleton.tsx",
      "components/ui/skeleton.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
  });

  it("transports Radio with foundation-only registry dependency (Tier-2 Stable)", () => {
    const manifest = buildRadioManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Radio.tsx",
      "components/ui/radio.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
  });

  it("transports Switch with use-controllable helper (Tier-2 Stable)", () => {
    const manifest = buildSwitchManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Switch.tsx",
      "components/ui/switch.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(classifyFile("lib/use-controllable.ts")).toEqual({
      type: "registry:lib",
      target: "~/lib/use-controllable.ts",
    });
    expect(JSON.stringify(manifest)).not.toMatch(/hostRequirements/);
  });

  it("transports Textarea with form-field registryDeps, shared text-input CSS, and public SVG asset", () => {
    const manifest = buildTextareaManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Textarea.tsx",
      "components/ui/text-input.module.css",
      "components/ui/textarea.module.css",
      "lib/cn.ts",
      "public/right-bottom-icon.svg",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/form-field", "@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(manifest.files.find((file) => file.path === "public/right-bottom-icon.svg")).toEqual(
      expect.objectContaining({
        type: "registry:file",
        target: "~/public/right-bottom-icon.svg",
      }),
    );
    expect(JSON.stringify(manifest)).not.toMatch(/hostRequirements/);
    expect(JSON.stringify(manifest)).not.toMatch(/FormField\.tsx/);
  });

  it("transports Pagination with link-utils and next host docs", () => {
    const manifest = buildPaginationManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Pagination.tsx",
      "components/ui/internal/link-utils.ts",
      "components/ui/pagination.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(manifest.docs).toContain("next");
    expect(JSON.stringify(manifest)).not.toMatch(/hostRequirements/);
  });

  it("transports Avatar with Phosphor npm dependency (Stable leaf)", () => {
    const manifest = buildAvatarManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Avatar.tsx",
      "components/ui/avatar.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(JSON.stringify(manifest)).not.toMatch(/hostRequirements/);
  });

  it("transports Breadcrumb with Link registryDependency and Phosphor npm", () => {
    const manifest = buildBreadcrumbManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Breadcrumb.tsx",
      "components/ui/breadcrumb.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/link", "@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(JSON.stringify(manifest)).not.toMatch(/Link\.tsx/);
  });

  it("transports Radio Group with radio + validation-message registryDeps (no CSS duplication)", () => {
    const manifest = buildRadioGroupManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/RadioGroup.tsx",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual([
      "@skrewww/radio",
      "@skrewww/validation-message",
      "@skrewww/foundation",
    ]);
    expect(manifest.dependencies).toEqual([]);
    expect(manifest.files.some((file) => file.path.endsWith(".css"))).toBe(false);
  });

  it("transports Slider (selected Beta) with use-controllable", () => {
    const manifest = buildSliderManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Slider.tsx",
      "components/ui/slider.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(componentRegistry.find((e) => e.slug === "slider")?.status).toBe("beta");
  });

  it("transports Stepper (selected Beta) with Phosphor, without Data Table leakage", () => {
    const manifest = buildStepperManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Stepper.tsx",
      "components/ui/stepper.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(JSON.stringify(manifest)).not.toMatch(/DataTable|data-table/);
  });

  it("transports Table (selected Beta) as basic table only", () => {
    const manifest = buildTableManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Table.tsx",
      "components/ui/table.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(manifest.name).toBe("table");
    expect(manifest.files.some((file) => /data-table/i.test(file.path))).toBe(false);
  });

  // CE-3H — safe compound batch
  it("transports Badge with Phosphor npm dep + shared feedback-types.ts helper", () => {
    const manifest = buildBadgeManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Badge.tsx",
      "components/ui/badge.module.css",
      "components/ui/internal/feedback-types.ts",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("transports Tag with Phosphor npm dep, no shared helpers", () => {
    const manifest = buildTagManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Tag.tsx",
      "components/ui/tag.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("transports List Item with the already-mapped link-utils.ts helper", () => {
    const manifest = buildListItemManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/ListItem.tsx",
      "components/ui/internal/link-utils.ts",
      "components/ui/list-item.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
  });

  it("transports Timeline with its own internal TimelineItemRow subcomponent (one registry item)", () => {
    const manifest = buildTimelineManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Timeline.tsx",
      "components/ui/internal/TimelineItemRow.tsx",
      "components/ui/internal/timeline-item-row.module.css",
      "components/ui/timeline.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(manifest.name).toBe("timeline");
  });

  it("transports Empty State with Button + Link registryDependencies, no re-transported Button/Link files", () => {
    const manifest = buildEmptyStateManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/EmptyState.tsx",
      "components/ui/empty-state.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/button", "@skrewww/link", "@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(JSON.stringify(manifest)).not.toMatch(/Button\.tsx|Link\.tsx/);
  });

  it("transports Alert with the shared FeedbackSurface helper cluster (incl. transitive lib/cn.ts, no own CSS)", () => {
    const manifest = buildAlertManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Alert.tsx",
      "components/ui/internal/FeedbackSurface.tsx",
      "components/ui/internal/feedback-icons.tsx",
      "components/ui/internal/feedback-surface.module.css",
      "components/ui/internal/feedback-types.ts",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(manifest.files.some((file) => file.path === "components/ui/alert.module.css")).toBe(false);
  });

  it("transports Toast with the same shared FeedbackSurface helper cluster as Alert", () => {
    const manifest = buildToastManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/ToastProvider.tsx",
      "components/ui/internal/FeedbackSurface.tsx",
      "components/ui/internal/feedback-icons.tsx",
      "components/ui/internal/feedback-surface.module.css",
      "components/ui/internal/feedback-types.ts",
      "components/ui/toast.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("transports Button Group with the shared button-group-context.ts helper", () => {
    const manifest = buildButtonGroupManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/ButtonGroup.tsx",
      "components/ui/button-group-context.ts",
      "components/ui/button-group.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
  });

  it("transports Toggle Group with its keyboard helper + use-controllable (no npm dep)", () => {
    const manifest = buildToggleGroupManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/ToggleGroup.tsx",
      "components/ui/internal/toggle-group-keyboard.ts",
      "components/ui/toggle-group.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
  });

  it("transports Accordion with use-controllable + Phosphor, inline context needs no separate file", () => {
    const manifest = buildAccordionManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Accordion.tsx",
      "components/ui/accordion.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("transports Tabs with tab-keyboard.ts + use-controllable (no npm dep)", () => {
    const manifest = buildTabsManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Tabs.tsx",
      "components/ui/internal/tab-keyboard.ts",
      "components/ui/tabs.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
  });

  // CE-3I — form/composite batch
  it("transports Search Field with form-field registryDep + already-mapped TextInputControl (no Popover)", () => {
    const manifest = buildSearchFieldManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/SearchField.tsx",
      "components/ui/TextInputControl.tsx",
      "components/ui/search-field.module.css",
      "components/ui/text-input.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/form-field", "@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(JSON.stringify(manifest)).not.toMatch(/Popover|Combobox|Select\.tsx/);
  });

  it("transports Credit Card Field with validation-message registryDep + its own format helper", () => {
    const manifest = buildCreditCardFieldManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/CreditCardField.tsx",
      "components/ui/credit-card-field.module.css",
      "lib/cn.ts",
      "lib/credit-card-field-format.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/validation-message", "@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(JSON.stringify(manifest)).not.toMatch(/ValidationMessage\.tsx/);
  });

  it("transports Number Input with form-field registryDep, TextInputControl (transitive lib/cn.ts), and its own value helper", () => {
    const manifest = buildNumberInputManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/NumberInput.tsx",
      "components/ui/TextInputControl.tsx",
      "components/ui/number-input.module.css",
      "components/ui/text-input.module.css",
      "lib/cn.ts",
      "lib/number-input-value.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/form-field", "@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("transports File Upload with form-field registryDep + its own file-list/validation helpers (no re-transported FormField)", () => {
    const manifest = buildFileUploadManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/FileUpload.tsx",
      "components/ui/file-upload.module.css",
      "components/ui/internal/file-upload-file-list.ts",
      "components/ui/internal/file-upload-validation.ts",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/form-field", "@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(JSON.stringify(manifest)).not.toMatch(/FormField\.tsx/);
  });

  // CE-3J — overlay/navigation batch
  it("transports Popover with the full overlay helper stack (Portal/escape/outside-pointer/floating-position/focus)", () => {
    const manifest = buildPopoverManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Popover.tsx",
      "components/ui/internal/OverlayScopeContext.tsx",
      "components/ui/internal/Portal.tsx",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/focus-utils.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/popover-position.ts",
      "components/ui/internal/useFloatingPosition.ts",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/useLatestRef.ts",
      "components/ui/internal/useOutsidePointer.ts",
      "components/ui/internal/useOverlayEscape.ts",
      "components/ui/popover.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("transports Tooltip with its own portal (react-dom createPortal, not the shared Portal.tsx) + position/controller helpers", () => {
    const manifest = buildTooltipManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Tooltip.tsx",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/tooltip-position.ts",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/useLatestRef.ts",
      "components/ui/internal/useOverlayEscape.ts",
      "components/ui/internal/useTooltipController.ts",
      "components/ui/tooltip.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(JSON.stringify(manifest)).not.toMatch(/internal\/Portal\.tsx/);
  });

  it("transports Dialog with the full modal helper stack (focus trap, scroll lock, background inert, overlay-types)", () => {
    const manifest = buildDialogManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Dialog.tsx",
      "components/ui/dialog.module.css",
      "components/ui/internal/OverlayScopeContext.tsx",
      "components/ui/internal/Portal.tsx",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/focus-utils.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/overlay-types.ts",
      "components/ui/internal/useBackgroundInert.ts",
      "components/ui/internal/useBodyScrollLock.ts",
      "components/ui/internal/useFocusTrap.ts",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/useLatestRef.ts",
      "components/ui/internal/useOverlayEscape.ts",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("transports Drawer with the identical modal helper stack to Dialog", () => {
    const manifest = buildDrawerManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Drawer.tsx",
      "components/ui/drawer.module.css",
      "components/ui/internal/OverlayScopeContext.tsx",
      "components/ui/internal/Portal.tsx",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/focus-utils.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/overlay-types.ts",
      "components/ui/internal/useBackgroundInert.ts",
      "components/ui/internal/useBodyScrollLock.ts",
      "components/ui/internal/useFocusTrap.ts",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/useLatestRef.ts",
      "components/ui/internal/useOverlayEscape.ts",
      "lib/cn.ts",
      "lib/use-controllable.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("transports Menu with a @skrewww/popover registryDependency, no re-transported Popover.tsx", () => {
    const manifest = buildMenuManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/Menu.tsx",
      "components/ui/internal/menu-typeahead.ts",
      "components/ui/menu.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/popover", "@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(JSON.stringify(manifest)).not.toMatch(/Popover\.tsx|popover-position\.ts/);
  });

  it("transports Split Button reusing button-group-context.ts + button-group.module.css verbatim, no @skrewww/menu registryDep (no real Menu import)", () => {
    const manifest = buildSplitButtonManifest();
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      "components/ui/SplitButton.tsx",
      "components/ui/button-group-context.ts",
      "components/ui/button-group.module.css",
      "lib/cn.ts",
    ]);
    expect(manifest.registryDependencies).toEqual(["@skrewww/foundation"]);
    expect(manifest.dependencies).toEqual([]);
    expect(JSON.stringify(manifest)).not.toMatch(/@skrewww\/menu|Menu\.tsx/);
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
