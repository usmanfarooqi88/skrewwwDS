import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_REGISTRY_SCHEMA_VERSION,
  getImplementedComponentCount,
  getImplementedRegistryEntries,
} from "@/lib/component-registry";
import { compareReadmeInventory, parseReadmeImplementedTable } from "@/lib/readme-inventory";
import { getProjectStatusFacts } from "@/lib/project-status-facts";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";
import { buildValidationMessageManifest } from "@/lib/shadcn-registry-generator";
import { tokenColorMap } from "@/lib/data";
import tailwindConfig from "../tailwind.config";

const root = process.cwd();

function readRootFile(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("project configuration", () => {
  it("keeps package.json and package-lock root metadata aligned", () => {
    const pkg = JSON.parse(readRootFile("package.json"));
    const lock = JSON.parse(readRootFile("package-lock.json"));
    const rootLock = lock.packages?.[""];
    expect(rootLock?.name).toBe(pkg.name);
    expect(rootLock?.version).toBe(pkg.version);
    expect(rootLock?.engines?.node).toBe(pkg.engines?.node);
  });

  it("declares a Node runtime policy", () => {
    const pkg = JSON.parse(readRootFile("package.json"));
    expect(pkg.engines?.node).toBe(">=22.13.0 <23 || >=24 <25");
    expect(readRootFile(".nvmrc").trim()).toBe("24.14.0");
    expect(readRootFile(".node-version").trim()).toBe("24.14.0");
  });

  it("keeps README inventory synchronized with the registry", () => {
    const readme = readRootFile("README.md");
    const errors = compareReadmeInventory(parseReadmeImplementedTable(readme));
    expect(errors, errors.join("\n")).toEqual([]);
  });

  it("derives implemented component count from the registry", () => {
    const facts = getProjectStatusFacts();
    expect(facts.implementedComponentCount).toBe(getImplementedComponentCount());
    expect(getImplementedRegistryEntries()).toHaveLength(facts.implementedComponentCount);
  });

  it("includes Menu and Combobox in implemented inventory", () => {
    const names = getImplementedRegistryEntries().map((entry) => entry.name);
    expect(names).toContain("Menu");
    expect(names).toContain("Combobox");
  });

  it("preserves redirect aliases", () => {
    expect([...REDIRECTED_COMPONENT_SLUGS]).toEqual(["form-field-wrapper", "accordion-item"]);
    const nextConfig = readRootFile("next.config.js");
    expect(nextConfig).toContain("/components/form-field-wrapper");
    expect(nextConfig).toContain("/components/accordion-item");
  });

  it("isolates Playwright build output from dev .next", () => {
    const pkg = JSON.parse(readRootFile("package.json"));
    expect(pkg.scripts["build:e2e"]).toContain(".next-playwright");
    expect(pkg.scripts["start:e2e"]).toContain(".next-playwright");
    expect(pkg.scripts["clean:e2e"]).toContain(".next-playwright");
    expect(readRootFile("next.config.js")).toContain("NEXT_DIST_DIR");
    expect(readRootFile("playwright.config.ts")).toContain("build:e2e");
    expect(readRootFile("playwright.config.ts")).toContain("PLAYWRIGHT_REUSE_SERVER");
    expect(readRootFile(".gitignore")).toContain(".next-playwright/");
  });

  it("uses default .next for production build scripts", () => {
    const pkg = JSON.parse(readRootFile("package.json"));
    // "build" gained "generate:registry" (writes public/r/*.json — see
    // docs/architecture/shadcn-distribution.md) and "generate:agent-context"
    // (writes public/agent/*.json — see docs/architecture/agent-kit.md)
    // pre-steps, but still targets the default .next dir, same as before;
    // the real invariant this test guards is the second assertion below.
    expect(pkg.scripts.build).toBe(
      "npm run generate:registry && npm run generate:agent-context && next build",
    );
    expect(pkg.scripts["build:e2e"]).not.toContain("npm run build");
  });

  it("does not treat tsbuildinfo as source", () => {
    expect(readRootFile(".gitignore")).toContain("*.tsbuildinfo");
    expect(readRootFile("README.md")).toContain("*.tsbuildinfo");
    expect(readRootFile("tsconfig.json")).not.toContain("tsconfig.tsbuildinfo");
  });

  it("documents token source policy", () => {
    expect(existsSync(join(root, "docs/architecture/token-source-of-truth.md"))).toBe(true);
    expect(existsSync(join(root, "docs/architecture/file-upload-discovery.md"))).toBe(true);
    expect(existsSync(join(root, "docs/architecture/data-table-discovery.md"))).toBe(true);
    expect(existsSync(join(root, "docs/architecture/table-foundation.md"))).toBe(true);
  });

  it("keeps canonical developer onboarding and contributing docs linked", () => {
    expect(existsSync(join(root, "docs/getting-started.md"))).toBe(true);
    expect(existsSync(join(root, "docs/contributing.md"))).toBe(true);
    expect(existsSync(join(root, "CONTRIBUTING.md"))).toBe(true);
    const readme = readRootFile("README.md");
    expect(readme).toContain("docs/getting-started.md");
    expect(readme).toContain("docs/contributing.md");
    expect(readRootFile("CONTRIBUTING.md")).toContain("docs/contributing.md");
    expect(readRootFile("docs/getting-started.md")).toContain("contributing.md");
  });

  it("guards brand 500/600/700 across tokens.css, Tailwind, and lib/data", () => {
    const tokens = readRootFile("styles/tokens.css");
    const brandPalette = (
      tailwindConfig.theme?.extend?.colors as {
        brand?: Record<string, string | undefined>;
      }
    )?.brand;
    const steps = [
      { step: "500", dataKey: "color/brand/500", figma: "#6c4cf2" },
      { step: "600", dataKey: "color/brand/600", figma: "#5638d6" },
      { step: "700", dataKey: "color/brand/700", figma: "#4229ad" },
    ] as const;

    for (const { step, dataKey, figma } of steps) {
      const match = tokens.match(
        new RegExp(`--primitive-color-brand-${step}:\\s*(#[0-9a-fA-F]{6})`),
      );
      expect(match?.[1], `tokens.css brand-${step}`).toBeDefined();
      const tokenHex = match![1].toLowerCase();
      expect(tokenHex).toBe(figma);
      expect(brandPalette?.[step]?.toLowerCase()).toBe(tokenHex);
      expect(tokenColorMap[dataKey]?.toLowerCase()).toBe(tokenHex);
    }

    // Button Primary interaction fills already match live Figma 600/700 and stay component-scoped
    expect(tokens).toMatch(/--component-button-primary-fill-hover:\s*#5638d6/i);
    expect(tokens).toMatch(/--component-button-primary-fill-pressed:\s*#4229ad/i);
    expect(tokens).toMatch(
      /--semantic-action-primary-hover:\s*var\(--primitive-color-brand-600\)/,
    );
    expect(tokens).toMatch(
      /--semantic-action-primary-pressed:\s*var\(--primitive-color-brand-700\)/,
    );
  });

  it("declares the sparse Figma danger primitive family and no extra steps", () => {
    const tokens = readRootFile("styles/tokens.css");
    const declared: Record<string, string> = {};
    const re = /--primitive-color-danger-(\d+):\s*(#[0-9a-fA-F]{6})/g;
    let match: RegExpExecArray | null = re.exec(tokens);
    while (match) {
      declared[match[1]] = match[2].toLowerCase();
      match = re.exec(tokens);
    }

    expect(declared).toEqual({
      "100": "#fde2e1",
      "500": "#e5484d",
      "600": "#cc3b37",
      "700": "#b3261e",
    });
    expect(declared).not.toHaveProperty("50");
    expect(declared).not.toHaveProperty("200");
    expect(declared).not.toHaveProperty("300");
    expect(declared).not.toHaveProperty("400");
    expect(declared).not.toHaveProperty("800");
    expect(declared).not.toHaveProperty("900");
  });

  it("declares the sparse Figma warning primitive family and no extra steps", () => {
    const tokens = readRootFile("styles/tokens.css");
    const declared: Record<string, string> = {};
    const re = /--primitive-color-warning-(\d+):\s*(#[0-9a-fA-F]{6})/g;
    let match: RegExpExecArray | null = re.exec(tokens);
    while (match) {
      declared[match[1]] = match[2].toLowerCase();
      match = re.exec(tokens);
    }

    expect(declared).toEqual({
      "100": "#fef3d6",
      "500": "#f5a524",
      "700": "#b9770e",
      "800": "#8a4f00",
    });
    expect(declared).not.toHaveProperty("50");
    expect(declared).not.toHaveProperty("200");
    expect(declared).not.toHaveProperty("300");
    expect(declared).not.toHaveProperty("400");
    expect(declared).not.toHaveProperty("600");
    expect(declared).not.toHaveProperty("900");
  });

  it("declares sparse Figma success-700 and info-700 primitives without inventing extra steps", () => {
    const tokens = readRootFile("styles/tokens.css");

    const success: Record<string, string> = {};
    const successRe = /--primitive-color-success-(\d+):\s*(#[0-9a-fA-F]{6})/g;
    let successMatch: RegExpExecArray | null = successRe.exec(tokens);
    while (successMatch) {
      success[successMatch[1]] = successMatch[2].toLowerCase();
      successMatch = successRe.exec(tokens);
    }

    const info: Record<string, string> = {};
    const infoRe = /--primitive-color-info-(\d+):\s*(#[0-9a-fA-F]{6})/g;
    let infoMatch: RegExpExecArray | null = infoRe.exec(tokens);
    while (infoMatch) {
      info[infoMatch[1]] = infoMatch[2].toLowerCase();
      infoMatch = infoRe.exec(tokens);
    }

    expect(success).toEqual({ "700": "#1f7a4d" });
    expect(info).toEqual({ "700": "#1d4ed8" });
  });

  it("keeps standing instructions free of stale Calendar/docs-site claims", () => {
    const claude = readRootFile("skrewww-claude-project-instructions.md");
    const figma = readRootFile("skrewww-figma-practices-instructions.md");
    const rules = readRootFile("skrewww-component-build-rules.md");
    const standing = [claude, figma, rules].join("\n").toLowerCase();

    expect(standing).not.toMatch(/calendar is (still )?missing/);
    expect(standing).not.toMatch(/only (a )?date picker input exists/);
    expect(standing).not.toMatch(/calendar only has a date picker input/);
    expect(standing).not.toMatch(/no documentation site (has been|is) built/);
    expect(standing).not.toMatch(/most component pages are empty/);
    expect(standing).not.toMatch(/data (grid|table) is implemented/);
    expect(standing).not.toMatch(/table uses role=["']?grid/);
    expect(standing).not.toMatch(/table and data (grid|table) are (the same|interchangeable)/);
    // Forbid asserting the docs site is still future work (allow instructional "do not claim …").
    expect(standing).not.toMatch(
      /(?<!do not claim that the )documentation (website|site) is still a future/,
    );

    // Unqualified historical Figma totals must not be presented as current.
    expect(figma.toLowerCase()).not.toMatch(
      /(?<!historical snapshot[\s\S]{0,800})119 variables across four collections/,
    );
    expect(figma).toMatch(/Historical snapshot/i);
    expect(figma).toMatch(/verification pending/i);
    expect(figma).toContain("docs/project-status.md");
    expect(claude).toContain("docs/project-status.md");
    expect(rules).toContain("docs/project-status.md");
    expect(rules.toLowerCase()).toMatch(/figma parity pending/);
  });

  it("keeps standing instructions consistent on Table, Data Table, and docs site", () => {
    const claude = readRootFile("skrewww-claude-project-instructions.md");
    const figma = readRootFile("skrewww-figma-practices-instructions.md");

    expect(claude).toMatch(/Calendar Day/);
    expect(claude).toMatch(/Calendar Grid/);
    expect(claude).toMatch(/Date Picker/);
    expect(claude).toMatch(/Table/);
    expect(claude).toMatch(/native HTML/);
    expect(claude).toMatch(/Does \*\*not\*\* use `role="grid"`|does \*\*not\*\* use `role="grid"`/i);
    // Data Table implementation landed 2026-07-15 (DataTableSortHeader + useDataTableSort).
    expect(claude.toLowerCase()).toMatch(/data table[\s\S]{0,200}\*\*implemented\*\*|\*\*implemented\*\*[\s\S]{0,80}data table/);
    expect(claude.toLowerCase()).toMatch(/usedatatablesort/);
    expect(claude.toLowerCase()).toMatch(/compose table/);
    expect(claude.toLowerCase()).toMatch(/documentation repository is already implemented/);
    expect(claude.toLowerCase()).toMatch(/do \*\*not\*\* list calendar as a current react implementation gap|do not list calendar as a current react implementation gap/);
    // Canonical naming decision (2026-07-13): Data Table, deliberately not Data Grid.
    expect(claude).toMatch(/Canonical name \*\*Data Table\*\*/);
    expect(claude.toLowerCase()).toMatch(/not "data grid"/);

    expect(figma.toLowerCase()).toMatch(/page existence is confirmed/);
    expect(figma.toLowerCase()).toMatch(/mcp is currently \*\*unavailable\*\*|figma mcp is currently \*\*unavailable\*\*/);
    expect(figma.toLowerCase()).toMatch(/skrewww\.com[\s\S]{0,80}confirmed live/);
    expect(figma.toLowerCase()).toMatch(/documentation repository is \*\*built\*\*|react\/next\.js documentation repository is \*\*built\*\*/);
    expect(figma.toLowerCase()).toMatch(/data table[\s\S]{0,120}\*\*implemented\*\*/);
    expect(figma.toLowerCase()).toMatch(/compose table/);
  });

  it("documents domain policy with skrewww.com as the single confirmed live domain", () => {
    const readme = readRootFile("README.md");
    const sourceOfTruth = readRootFile("docs/architecture/source-of-truth.md");
    expect(readme).toContain("skrewww.com");
    expect(readme).toContain("NEXT_PUBLIC_SITE_URL");
    expect(sourceOfTruth).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("resolves site origin from NEXT_PUBLIC_SITE_URL in production, falling back to the confirmed live domain", () => {
    const siteConfigSource = readRootFile("lib/site-config.ts");
    expect(siteConfigSource).toContain("NEXT_PUBLIC_SITE_URL");
    expect(siteConfigSource).toContain("PRODUCTION_FALLBACK_ORIGIN");
    expect(siteConfigSource).toContain("https://skrewww.com");
  });

  it("keeps Skrewww 1.0 platform version metadata synchronized", () => {
    const pkg = JSON.parse(readRootFile("package.json"));
    const facts = getProjectStatusFacts();
    expect(pkg.version).toBe("1.0.0");
    expect(siteConfig.designSystemVersion).toBe("1.0.0");
    expect(siteConfig.documentationVersion).toBe("1.0.0");
    expect(facts.packageVersion).toBe("1.0.0");
    expect(facts.designSystemVersion).toBe(pkg.version);
    expect(facts.documentationVersion).toBe(pkg.version);
    expect(facts.registrySchemaVersion).toBe("1.4.0");
    expect(CANONICAL_REGISTRY_SCHEMA_VERSION).toBe("1.0.0");
  });

  it("tracks mixed Stable and Beta component maturity at platform 1.0", () => {
    const implemented = getImplementedRegistryEntries();
    expect(implemented).toHaveLength(48);
    const stable = implemented.filter((entry) => entry.status === "stable");
    const beta = implemented.filter((entry) => entry.status === "beta");
    expect(stable.length).toBe(27);
    expect(beta.length).toBe(21);
    expect(stable.every((entry) => entry.version === "1.0.0")).toBe(true);
    expect(beta.every((entry) => entry.version.includes("beta"))).toBe(true);
    expect(beta.every((entry) => entry.version !== "1.0.0")).toBe(true);
  });

  it("preserves the supported /r install surface and Phosphor transport", () => {
    expect(readRootFile("scripts/generate-shadcn-registry.ts")).toContain("validation-message.json");
    expect(readRootFile("scripts/generate-shadcn-registry.ts")).toContain("text-input.json");
    expect(readRootFile("scripts/generate-shadcn-registry.ts")).toContain("spinner.json");
    expect(readRootFile("scripts/generate-shadcn-registry.ts")).toContain("divider.json");
    expect(readRootFile("scripts/generate-shadcn-registry.ts")).toContain("link.json");
    const validationMessage = getImplementedRegistryEntries().find(
      (entry) => entry.slug === "validation-message",
    );
    expect(validationMessage?.dependencies).toEqual(["@phosphor-icons/react"]);
    expect(buildValidationMessageManifest().dependencies).toEqual(["@phosphor-icons/react"]);
    expect(buildValidationMessageManifest().name).toBe("validation-message");
  });
});
