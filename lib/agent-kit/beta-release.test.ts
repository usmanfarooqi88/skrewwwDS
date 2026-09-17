import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildLlmsTxt, buildLlmsFullTxt } from "@/lib/llms-content";
import { changelogEntries } from "@/content/changelog";
import { buildSitemapEntries } from "@/lib/sitemap-data";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { AGENT_KIT_PRODUCT_VERSION, AGENT_KIT_RELEASE_STAGE } from "@/lib/agent-kit/beta-version";
import { readCanonicalSkill } from "@/lib/agent-kit/skill-adapter";

const root = process.cwd();

/**
 * AK-6: proves the public Beta productization surfaces actually exist and
 * are internally consistent — not that the underlying Agent Kit behavior
 * changed (that's still guarded by contract-compiler.test.ts,
 * skill.test.ts, recipe-compiler.test.ts, evaluation-scorer.test.ts).
 */

describe("AK-6 — Agent Kit is discoverable in public docs surfaces", () => {
  it("the docs page route exists", () => {
    expect(existsSync(join(root, "app", "agent-kit", "page.tsx"))).toBe(true);
  });

  it("is linked from the sitemap as a human landing page (not its machine index)", () => {
    const entries = buildSitemapEntries();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(absoluteUrl("/agent-kit"));
    expect(urls).not.toContain(absoluteUrl("/agent/index.json"));
  });

  it("is discoverable from llms.txt without dumping every contract", () => {
    const llms = buildLlmsTxt();
    expect(llms).toContain(absoluteUrl("/agent-kit"));
    expect(llms).toContain(absoluteUrl("/agent/index.json"));
    expect(llms).toContain(absoluteUrl("/agent/skill/SKILL.md"));
    // Must not enumerate individual component contracts one by one.
    expect(llms).not.toMatch(/\/agent\/contracts\/button\.json/);
  });

  it("llms-full.txt (which extends llms.txt) also carries the Agent Kit section, still without a full contract dump", () => {
    const llmsFull = buildLlmsFullTxt();
    expect(llmsFull).toContain(absoluteUrl("/agent-kit"));
    const contractPathMentions = llmsFull.match(/\/agent\/contracts\/[a-z-]+\.json/g) ?? [];
    expect(contractPathMentions.length).toBeLessThanOrEqual(1); // the one templated example, not one per component
  });

  it("has a changelog entry that follows the existing public changelog conventions", () => {
    const entry = changelogEntries.find((candidate) => candidate.id === "2026-09-agent-kit-beta");
    expect(entry).toBeDefined();
    expect(entry!.title).toMatch(/Agent Kit/i);
    expect(entry!.items.length).toBeGreaterThan(0);
    // Same discipline the file's own header comment requires of every entry.
    for (const item of entry!.items) {
      expect(item.text).not.toMatch(/\b[0-9a-f]{7,40}\b/); // no commit SHA
      expect(item.text).not.toMatch(/AK-\d/); // no internal phase jargon
    }
  });
});

describe("AK-6 — version model stays separate from component/schema/generator versions", () => {
  it("Agent Kit product version is a distinct, non-empty semver-shaped Beta string", () => {
    expect(AGENT_KIT_PRODUCT_VERSION).toMatch(/^\d+\.\d+\.\d+-beta\.\d+$/);
    expect(AGENT_KIT_RELEASE_STAGE).toBe("beta");
  });

  it("is never equal to the platform design-system version, so the two are never confused", () => {
    expect(AGENT_KIT_PRODUCT_VERSION).not.toBe(siteConfig.designSystemVersion);
  });

  it("is referenced on the public docs page", () => {
    const pageSource = readFileSync(join(root, "app", "agent-kit", "page.tsx"), "utf8");
    expect(pageSource).toContain("AGENT_KIT_PRODUCT_VERSION");
  });
});

describe("AK-6 — Skill public projection (/agent/skill/SKILL.md)", () => {
  // Reads whatever public/agent/ currently holds rather than triggering its
  // own regeneration — lib/agent-kit/retrieval.test.ts already owns
  // regenerating + asserting this file's byte-identity as part of the full
  // artifact tree; a second concurrent `generate-agent-context.ts` spawn
  // here raced with that file's own regeneration under Vitest's parallel
  // file execution and corrupted a concurrent read. Skip cleanly if
  // public/agent/ hasn't been generated at all yet in this run.
  it("is generated as a real file, byte-identical to the canonical Skill, when public/agent/ is present", () => {
    const generatedPath = join(root, "public", "agent", "skill", "SKILL.md");
    if (!existsSync(generatedPath)) return;
    expect(readFileSync(generatedPath, "utf8")).toBe(readCanonicalSkill());
  });
});

describe("AK-6 — GitHub repository references, where present, point only to the real public repository", () => {
  // The source repository went public as part of OS-1 (see
  // docs/open-source-readiness.md). Referencing it is no longer a private-repo
  // leak — it's the intended public feedback path. This guard now checks that
  // any repository reference is the real public repo at its real public
  // surfaces (Issues, security policy), not a wrong org/repo or a bare link.
  const repoUrlPattern = /github\.com\/[\w-]+\/skrewwwDS(\/[\w./-]*)?/gi;

  it("the docs page and llms surfaces only reference the real public repository, at its intended surfaces", () => {
    const pageSource = readFileSync(join(root, "app", "agent-kit", "page.tsx"), "utf8");
    const llmsFull = buildLlmsFullTxt();
    for (const text of [pageSource, llmsFull]) {
      const matches = text.match(repoUrlPattern) ?? [];
      for (const match of matches) {
        expect(match).toMatch(/^github\.com\/usmanfarooqi88\/skrewwwDS\/(issues|security\/policy)$/i);
      }
    }
  });

  it("siteConfig.repositoryUrl points at the real public repository, not a placeholder or a different org", () => {
    expect(siteConfig.repositoryUrl).toBe("https://github.com/usmanfarooqi88/skrewwwDS");
  });
});

describe("AK-6 — release checklist is durably documented", () => {
  it("docs/architecture/agent-kit.md contains a reusable Beta release checklist", () => {
    const doc = readFileSync(join(root, "docs", "architecture", "agent-kit.md"), "utf8");
    expect(doc).toMatch(/release checklist/i);
  });
});
