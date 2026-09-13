import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";
import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import {
  CANONICAL_SKILL_PATH,
  CLAUDE_ADAPTER_SKILL_PATH,
  readCanonicalSkill,
} from "@/lib/agent-kit/skill-adapter";

const SKILL_LINE_BUDGET = 500;
const root = process.cwd();

describe("Skrewww UI Skill — canonical file structure", () => {
  it("exists at the documented canonical path", () => {
    expect(existsSync(join(root, CANONICAL_SKILL_PATH))).toBe(true);
  });

  it("has valid frontmatter with a name and non-empty description", () => {
    const content = readCanonicalSkill();
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).not.toBeNull();
    const frontmatter = frontmatterMatch![1];
    expect(frontmatter).toMatch(/^name:\s*skrewww-ui\s*$/m);
    expect(frontmatter).toMatch(/^description:\s*.{40,}$/m);
  });

  it("stays within the 500-line Skill budget", () => {
    const content = readCanonicalSkill();
    const lineCount = content.split("\n").length;
    expect(lineCount).toBeLessThanOrEqual(SKILL_LINE_BUDGET);
  });

  it("contains the load-bearing verification instruction", () => {
    // Normalize markdown line-wrapping (a single newline inside a
    // paragraph is not a sentence break) before matching, since the
    // canonical file is hand-wrapped prose, not machine-generated.
    const normalized = readCanonicalSkill().replace(/\s+/g, " ");
    expect(normalized).toMatch(/do not rely on memorized skrewww apis/i);
    expect(normalized).toMatch(/read the relevant current contract/i);
  });
});

describe("Skrewww UI Skill — does not embed a manually maintained catalog", () => {
  it("does not enumerate individual component slugs from the registry", () => {
    const content = readCanonicalSkill().toLowerCase();
    // A real catalog would name most/all real component slugs. Fail if the
    // Skill happens to mention more than a small illustrative handful.
    const mentioned = componentRegistry.filter((entry) =>
      new RegExp(`\\b${entry.slug.replace(/-/g, "[- ]")}\\b`, "i").test(content),
    );
    expect(mentioned.length).toBeLessThan(5);
  });

  it("does not hardcode the current volatile Stable/Beta/prop counts", () => {
    const content = readCanonicalSkill();
    const { index } = compileAllContracts({
      sourceGitSha: "0".repeat(40),
      sourceGitCommitTimestamp: "2026-01-01T00:00:00Z",
    });

    // These numbers change as components mature — the Skill must read them
    // from index.json at task time, never state them as fixed prose.
    expect(content).not.toMatch(new RegExp(`\\b${index.stableCount}\\s+stable\\b`, "i"));
    expect(content).not.toMatch(new RegExp(`\\b${index.betaCount}\\s+beta\\b`, "i"));
    expect(content).not.toMatch(new RegExp(`\\b${index.totalApiProps}\\s+(api\\s+)?props?\\b`, "i"));
    expect(content).not.toMatch(new RegExp(`\\b${index.totalComponents}\\s+components?\\b`, "i"));
  });

  it("does not embed a token catalog or a props table", () => {
    const content = readCanonicalSkill();
    // A real token/props catalog would contain many `component/` or
    // `semantic/` token-shaped strings. The Skill may mention the concept
    // ("tokens.used") but must not paste an actual list.
    const tokenShapedMatches = content.match(/\b(component|semantic)\/[a-z-]+\/[a-z-]+\b/gi) ?? [];
    expect(tokenShapedMatches.length).toBe(0);
  });
});

describe("Skrewww UI Skill — does not implement out-of-scope phases", () => {
  it("does not introduce an MCP server or Guard enforcement in the repo", () => {
    const prohibitedPaths = [
      "agent/mcp",
      "agent/guard",
      "lib/agent-kit/mcp-server.ts",
      "lib/agent-kit/guard.ts",
    ];
    for (const relativePath of prohibitedPaths) {
      expect(existsSync(join(root, relativePath))).toBe(false);
    }
  });

  it("does not add new contract-schema fields for states, slots, composition, or forbiddenPatterns", () => {
    const schemaSource = readFileSync(join(root, "lib/agent-kit/contract-schema.ts"), "utf8");
    for (const forbiddenField of ["states:", "slots:", "composition:", "forbiddenPatterns:"]) {
      expect(schemaSource).not.toContain(forbiddenField);
    }
  });
});

describe("Skrewww UI Skill — Recipes integration (AK-4)", () => {
  it("documents Recipe discovery paths without embedding a Recipe catalog", () => {
    const content = readCanonicalSkill();
    expect(content).toContain("recipes/index.json");
    expect(content).toContain("recipes/<recipe-id>.json");
    expect(content).toMatch(/component contract.*Recipe|contracts always beat Recipes/i);
    // Must not paste pilot Recipe ids as a maintained catalog.
    const pilotIds = [
      "validated-text-field",
      "destructive-confirmation",
      "loading-and-inline-feedback",
      "search-no-results",
      "forms-and-feedback",
    ];
    const mentioned = pilotIds.filter((id) => content.includes(id));
    expect(mentioned.length).toBe(0);
  });

  it("states component-contract-over-Recipe precedence", () => {
    const normalized = readCanonicalSkill().replace(/\s+/g, " ");
    expect(normalized).toMatch(/component contracts always beat recipes/i);
  });
});

describe("Skrewww UI Skill — no local path or secret leakage", () => {
  it("never mentions this machine's absolute filesystem path", () => {
    const content = readCanonicalSkill();
    expect(content).not.toMatch(/\/Users\//);
    expect(content).not.toMatch(/\/home\/[a-z]/);
  });

  it("never references an env var or credential-shaped token", () => {
    const content = readCanonicalSkill();
    expect(content).not.toMatch(/\bprocess\.env\b/);
    expect(content).not.toMatch(/\b(api[_-]?key|secret|token)\s*[:=]\s*["'][A-Za-z0-9]/i);
  });
});

describe("Claude adapter — byte-identical, never a second rulebook", () => {
  it("installing the adapter produces a file byte-identical to the canonical Skill", () => {
    execFileSync("npx", ["tsx", "scripts/install-agent-skill.ts"], { cwd: root, stdio: "pipe" });

    const canonical = readCanonicalSkill();
    const adapterPath = join(root, CLAUDE_ADAPTER_SKILL_PATH);
    expect(existsSync(adapterPath)).toBe(true);

    const adapter = readFileSync(adapterPath, "utf8");
    expect(adapter).toBe(canonical);
  }, 30_000);
});

describe("Consumption proof — Skill's documented lookup paths are real", () => {
  it("documents the exact generated output paths the compiler actually writes", () => {
    const content = readCanonicalSkill();
    // The Skill presents these as a directory tree (public/agent/ once,
    // with index.json/system.json/contracts/ as children), not as three
    // repeated full paths — check the tree's own root plus each real
    // output name/dir, rather than requiring a concatenated substring.
    expect(content).toContain("public/agent/");
    expect(content).toMatch(/\bindex\.json\b/);
    expect(content).toMatch(/\bsystem\.json\b/);
    expect(content).toContain("contracts/<slug>.json");
    expect(content).toContain("recipes/index.json");
    expect(content).toContain("feature-kits/index.json");
  });

  it("a slug from index.json resolves to a real compiled contract with matching identity", () => {
    const { index, contracts } = compileAllContracts({
      sourceGitSha: "0".repeat(40),
      sourceGitCommitTimestamp: "2026-01-01T00:00:00Z",
    });

    expect(index.components.length).toBeGreaterThan(0);
    const sampleEntry = index.components[0];

    const contract = contracts.find((c) => c.slug === sampleEntry.slug);
    expect(contract).toBeDefined();
    expect(contract!.name).toBe(sampleEntry.name);
    expect(contract!.status).toBe(sampleEntry.status);
    expect(contract!.api.properties.map((p) => p.name)).toEqual(sampleEntry.apiPropertyNames);
  });

  it("references the real npm script name for on-demand generation", () => {
    const content = readCanonicalSkill();
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts).toHaveProperty("generate:agent-context");
    expect(content).toContain("npm run generate:agent-context");

    expect(pkg.scripts).toHaveProperty("install:agent-skill");
    expect(content).toContain("npm run install:agent-skill");
  });
});
