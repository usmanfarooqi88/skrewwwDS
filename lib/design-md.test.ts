import { readFileSync } from "node:fs";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site-config";
import { systemAgentContract } from "@/lib/agent-kit/system-contract";

const read = (path: string) => readFileSync(path, "utf8");
const document = read("DESIGN.md");
const css = postcss.parse(read("styles/tokens.css"));
const root = css.nodes.find((node) => node.type === "rule" && node.selector === ":root");

// This file deliberately supports only scalar maps in the exported YAML groups.
// Reject unexpected lines and duplicates instead of silently skipping tokens.
function projectedGroup(name: string): Record<string, string> {
  const frontmatter = document.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)![1];
  const block = frontmatter.match(new RegExp(`^${name}:\\s*\\n((?:[ \\t]+[^\\n]*\\n?)+)`, "m"))![1];
  const result: Record<string, string> = {};
  for (const line of block.trimEnd().split("\n")) {
    const match = line.match(/^\s+([\w-]+):\s*(?:"([^"\n]+)"|([^"\s]+))\s*$/);
    expect(match, line).not.toBeNull();
    expect(result).not.toHaveProperty(match![1]);
    result[match![1]] = match![2] ?? match![3];
  }
  return result;
}

function rootValue(name: string): string {
  if (root?.type !== "rule") throw new Error("Missing canonical :root");
  const declarations = root.nodes.filter((node) => node.type === "decl" && node.prop === `--${name}`);
  expect(declarations, name).toHaveLength(1);
  const declaration = declarations[0];
  if (declaration.type !== "decl") throw new Error(`Missing ${name}`);
  return declaration.value;
}

describe("DESIGN.md public derived projection", () => {
  it("exports every explicitly verified root primitive color and no other values", () => {
    if (root?.type !== "rule") throw new Error("Missing canonical :root");
    let verifiedColorFamily = false;
    let excludedAnnotation = false;
    const expected: Record<string, string> = {};
    for (const node of root.nodes) {
      if (node.type === "comment") {
        if (/^[─\s]*(?:Primitive:|Semantic\b|Component\b|Brand\b|Shape\b|Surface\b)/.test(node.text)) {
          verifiedColorFamily = /Primitive:\s*color\s*\/[^\n]*\[VERIFIED\]/.test(node.text);
          excludedAnnotation = false;
        }
        if (/\[(?:TEMPORARY|UNRESOLVED|EXPERIMENTAL)\]/.test(node.text)) excludedAnnotation = true;
      } else if (node.type === "decl" && node.prop.startsWith("--primitive-color-")) {
        if (verifiedColorFamily && !excludedAnnotation) {
          expect(node.value).toMatch(/^#[\da-f]{6}$/i);
          expected[node.prop.slice(2)] = node.value;
          // A primitive repeated in a contextual mode needs explicit review.
          const declarations: string[] = [];
          css.walkDecls(node.prop, (decl) => { declarations.push(decl.value); });
          expect(declarations).toEqual([node.value]);
        }
        excludedAnnotation = false;
      }
    }
    expect(Object.keys(expected).length).toBeGreaterThan(5);
    const primary = rootValue("semantic-action-primary").match(/^var\(--(primitive-color-[\w-]+)\)$/)![1];
    expect(expected).toHaveProperty(primary);
    expect(projectedGroup("colors")).toEqual({ primary: `{colors.${primary}}`, ...expected });
    expect(projectedGroup("rounded")).toEqual({ "radius-full": rootValue("radius-full") });
  });

  it("checks metadata, omissions, normative semantics, and source links without file fingerprints", () => {
    expect(document).toMatch(/^version:\s*alpha\s*$/m);
    expect(document).toContain(`name: ${siteConfig.shortName}`);
    expect(document).toContain("tokens are normative values for DESIGN.md consumers.");
    expect(document).toContain("Derived from canonical Skrewww sources; do not edit directly.");
    const frontmatter = document.match(/^---\s*\n([\s\S]*?)\n---/)![1];
    expect(Array.from(frontmatter.matchAll(/^(\w+):/gm), (match) => match[1])).toEqual([
      "version", "name", "description", "colors", "rounded", "omitted",
    ]);
    expect(Array.from(frontmatter.matchAll(/- section:\s*(\w+)/g), (match) => match[1])).toEqual([
      "typography", "spacing", "components",
    ]);
    expect(document).not.toMatch(/```(?:yaml|yml)/);
    expect(document).not.toMatch(/https?:\/\/[^\s)]*(?:figma|gumroad)/i);
    expect(Array.from(document.matchAll(/^## (.+)$/gm), (match) => match[1])).toEqual([
      "Overview", "Colors", "Typography", "Layout", "Elevation & Depth",
      "Shapes", "Components", "Do's and Don'ts",
    ]);
    for (const match of Array.from(document.matchAll(/\]\(([^)]+)\)/g))) {
      expect(() => read(match[1]), match[1]).not.toThrow();
    }
  });

  it("ties selected prose guidance to canonical policy facts rather than unrelated source bytes", () => {
    const policy = read("docs/architecture/spacing-foundation.md").replace(/\s+/g, " ");
    expect(policy).toContain("4px base spacing grid with an 8px-preferred macro rhythm");
    expect(document.replace(/\s+/g, " ")).toContain("a 4px base grid with an 8px-preferred macro rhythm");
    expect(systemAgentContract.shapePolicy.join(" ")).toContain("document-wide or parent-context mode");
    expect(systemAgentContract.surfacePolicy.join(" ")).toContain("ambient/parent context");
    expect(systemAgentContract.accessibilityBaseline).toContain("Never rely on color alone to convey state (error, disabled, selected).");
    expect(document).toContain("Never rely on color alone to convey state.");
  });
});
