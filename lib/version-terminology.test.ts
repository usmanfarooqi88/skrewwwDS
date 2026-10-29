import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { changelogEntries } from "@/content/changelog";
import { buildLlmsFullTxt } from "@/lib/llms-content";
import { softwareApplicationJsonLd } from "@/lib/structured-data";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public version terminology", () => {
  it("labels the platform release as a documentation identifier, not a product version", () => {
    const llms = buildLlmsFullTxt();
    expect(llms).toMatch(/Documentation platform release: 1\.0\.0/);
    expect(llms).toMatch(/versioned separately from components and packages/);
    expect(llms).not.toMatch(/Design system version:/);
  });

  it("does not present the platform release as a product softwareVersion in structured data", () => {
    expect(softwareApplicationJsonLd()).not.toHaveProperty("softwareVersion");
  });

  it("prefixes the homepage version with 'Docs' so it is not read as a package version", () => {
    expect(read("app/page.tsx")).toMatch(/Docs v\{siteConfig\.designSystemVersion\}/);
  });

  it("no longer says every component is Beta in the README", () => {
    expect(read("README.md")).not.toMatch(/individual entries remain Beta until promoted/);
  });
});

describe("shadcn terminology", () => {
  const files = [
    "README.md",
    "app/agent-kit/page.tsx",
    "docs/getting-started.md",
    "docs/architecture/shadcn-distribution.md",
  ];

  it("never calls the shadcn registry directory official or community-registry-directory 'listed'", () => {
    for (const file of files) {
      const text = read(file);
      expect(text, file).not.toMatch(/official shadcn community registry directory/i);
      expect(text, file).not.toMatch(/listed in the official shadcn/i);
    }
    const changelog = JSON.stringify(changelogEntries);
    expect(changelog).not.toMatch(/official shadcn community registry directory/i);
  });

  it("describes the directory index entry, the Awesome shadcn/ui list and non-endorsement as separate statements", () => {
    const readme = read("README.md");
    expect(readme).toMatch(/registry\s+is indexed in the shadcn registry directory/);
    expect(readme).toMatch(/listed in the community-curated\s+\[Awesome shadcn\/ui\]/);
    expect(readme).toMatch(/neither is an endorsement by shadcn/i);

    const entry = changelogEntries.find((e) => e.id === "2026-09-shadcn-directory-listing");
    expect(entry?.title).toBe("Indexed in the shadcn registry directory");
    expect(entry?.summary).toMatch(/not an endorsement by shadcn/);

    const agentKit = read("app/agent-kit/page.tsx");
    expect(agentKit).toMatch(/indexed in the shadcn registry directory/);
    expect(agentKit).toMatch(/not an endorsement by shadcn/);
  });
});
