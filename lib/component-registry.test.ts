import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";

const root = process.cwd();

function extractVarRefs(css: string): string[] {
  const matches = css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g);
  return Array.from(new Set(Array.from(matches, (m) => m[1])));
}

describe("component registry — cssTokens accuracy", () => {
  it("declares exactly the custom properties actually referenced via var(--...) in each entry's own CSS files", () => {
    const violations: string[] = [];

    for (const entry of componentRegistry) {
      const cssFiles = (entry.files ?? []).filter((relPath) => relPath.endsWith(".css"));
      if (cssFiles.length === 0) continue;

      const found = new Set<string>();
      for (const relPath of cssFiles) {
        const absPath = join(root, relPath);
        if (!existsSync(absPath)) continue;
        for (const token of extractVarRefs(readFileSync(absPath, "utf8"))) {
          found.add(token);
        }
      }

      const declared = new Set(entry.cssTokens ?? []);
      const missing = Array.from(found)
        .filter((token) => !declared.has(token))
        .sort();
      if (missing.length > 0) {
        violations.push(`${entry.slug}: missing from cssTokens: ${missing.join(", ")}`);
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});

describe("component registry — Avatar Figma bindings", () => {
  const avatar = componentRegistry.find((entry) => entry.slug === "avatar");

  it("records the verified master bindings without an Avatar border dependency", () => {
    expect(avatar?.tokensUsed).toEqual([
      "component/button/primary/background",
      "component/surface/content",
      "component/surface/blur",
      "radius/full",
    ]);
    expect(avatar?.tokensUsed).not.toContain("semantic/border/default");
  });
});

describe("component registry — Card distribution metadata", () => {
  const card = componentRegistry.find((entry) => entry.slug === "card");

  it("has a real Card entry", () => {
    expect(card).toBeDefined();
  });

  it("declares no npm dependencies (react is a host requirement, not an installable package)", () => {
    expect(card?.dependencies).toEqual([]);
  });

  it("declares host requirements without next (Card has no next/link import, unlike Button)", () => {
    expect(card?.hostRequirements).toEqual(["react", "react-dom"]);
  });

  it("declares lib/cn.ts as its only internal dependency", () => {
    expect(card?.internalDependencies).toEqual(["lib/cn.ts"]);
  });

  it("declares @skrewww/foundation as a registry dependency", () => {
    expect(card?.registryDependencies).toEqual(["@skrewww/foundation"]);
  });
});

describe("component registry — Text Input distribution metadata", () => {
  const textInput = componentRegistry.find((entry) => entry.slug === "text-input");

  it("has a real Text Input entry", () => {
    expect(textInput).toBeDefined();
  });

  it("declares no npm dependencies", () => {
    expect(textInput?.dependencies).toEqual([]);
  });

  it("declares host requirements without next", () => {
    expect(textInput?.hostRequirements).toEqual(["react", "react-dom"]);
  });

  it("declares TextInputControl and lib/cn.ts as internal dependencies", () => {
    expect(textInput?.internalDependencies).toEqual(["components/ui/TextInputControl.tsx", "lib/cn.ts"]);
  });

  it("declares @skrewww/form-field as a real code dependency, not merely conceptual, plus @skrewww/foundation", () => {
    expect(textInput?.registryDependencies).toEqual(["@skrewww/form-field", "@skrewww/foundation"]);
  });
});

describe("component registry — Form Field distribution metadata", () => {
  const formField = componentRegistry.find((entry) => entry.slug === "form-field");

  it("has a real Form Field entry", () => {
    expect(formField).toBeDefined();
  });

  it("declares no npm dependencies", () => {
    expect(formField?.dependencies).toEqual([]);
  });

  it("declares host requirements without next", () => {
    expect(formField?.hostRequirements).toEqual(["react", "react-dom"]);
  });

  it("declares lib/cn.ts as its only internal dependency", () => {
    expect(formField?.internalDependencies).toEqual(["lib/cn.ts"]);
  });

  it("declares @skrewww/validation-message as a real code dependency, plus @skrewww/foundation", () => {
    expect(formField?.registryDependencies).toEqual(["@skrewww/validation-message", "@skrewww/foundation"]);
  });
});

describe("component registry — Validation Message distribution metadata", () => {
  const validationMessage = componentRegistry.find((entry) => entry.slug === "validation-message");

  it("has a real Validation Message entry", () => {
    expect(validationMessage).toBeDefined();
  });

  it("declares @phosphor-icons/react as its real npm dependency (first nonempty dependencies array in this registry)", () => {
    expect(validationMessage?.dependencies).toEqual(["@phosphor-icons/react"]);
  });

  it("declares host requirements without next", () => {
    expect(validationMessage?.hostRequirements).toEqual(["react", "react-dom"]);
  });

  it("declares lib/cn.ts as its only internal dependency", () => {
    expect(validationMessage?.internalDependencies).toEqual(["lib/cn.ts"]);
  });

  it("declares @skrewww/foundation as its only registry dependency", () => {
    expect(validationMessage?.registryDependencies).toEqual(["@skrewww/foundation"]);
  });
});
