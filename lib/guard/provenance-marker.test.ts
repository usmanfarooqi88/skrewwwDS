import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractSourceFacts } from "@/lib/guard/facts";
import {
  extractSkrewwwComponentMarker,
  formatSkrewwwComponentMarker,
  withSkrewwwComponentMarker,
} from "@/lib/guard/provenance-marker";
import { evaluateComponentNonexistentSlug } from "@/lib/guard/rules/component-nonexistent-slug";
import { runGuard } from "@/lib/guard/run";
import { buildButtonManifest } from "@/lib/shadcn-registry-generator";

describe("origin marker provenance", () => {
  it("registry transport injects marker into owned TSX only", () => {
    const manifest = buildButtonManifest();
    const button = manifest.files.find((f) => f.path.endsWith("Button.tsx"));
    expect(button?.content.startsWith(formatSkrewwwComponentMarker("button"))).toBe(true);
    expect(extractSkrewwwComponentMarker(button!.content)).toBe("button");
    const css = manifest.files.find((f) => f.path.endsWith(".css"));
    expect(css?.content.includes("@skrewww-component")).toBe(false);
  });

  it("withSkrewwwComponentMarker is idempotent", () => {
    const once = withSkrewwwComponentMarker('"use client";\n', "button");
    const twice = withSkrewwwComponentMarker(once, "button");
    expect(twice).toBe(once);
  });

  it("packaged mode: marker + unknown slug → violation; unmarked local Button → no finding", () => {
    const tmp = mkdtempSync(join(tmpdir(), "g-pr-"));
    try {
      mkdirSync(join(tmp, "components", "ui"), { recursive: true });
      writeFileSync(
        join(tmp, "components", "ui", "Button.tsx"),
        `${formatSkrewwwComponentMarker("button")}\nexport function Button(){return null}\n`,
        "utf8",
      );
      writeFileSync(
        join(tmp, "components", "ui", "Local.tsx"),
        `export function Button(){return null}\n`,
        "utf8",
      );
      writeFileSync(
        join(tmp, "components", "ui", "Ghost.tsx"),
        `${formatSkrewwwComponentMarker("not-a-real-slug")}\nexport function Ghost(){return null}\n`,
        "utf8",
      );
      writeFileSync(
        join(tmp, "tsconfig.json"),
        JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] } } }),
        "utf8",
      );
      writeFileSync(
        join(tmp, "ok.tsx"),
        `import { Button } from "@/components/ui/Button";\nexport const X = () => <Button />;\n`,
        "utf8",
      );
      writeFileSync(
        join(tmp, "local.tsx"),
        `import { Button } from "@/components/ui/Local";\nexport const X = () => <Button />;\n`,
        "utf8",
      );
      writeFileSync(
        join(tmp, "bad.tsx"),
        `import { Ghost } from "@/components/ui/Ghost";\nexport const X = () => <Ghost />;\n`,
        "utf8",
      );

      const factsPath = join(process.cwd(), "lib/guard/generated/consumer-facts.json");
      const ok = runGuard({
        target: "ok.tsx",
        projectRoot: tmp,
        mode: "consumer",
        factSource: "packaged",
        consumerFactsPath: factsPath,
      });
      expect(ok.exitCode).toBe(0);

      const local = runGuard({
        target: "local.tsx",
        projectRoot: tmp,
        mode: "consumer",
        factSource: "packaged",
        consumerFactsPath: factsPath,
      });
      expect(local.exitCode).toBe(0);
      expect(local.diagnostics).toEqual([]);

      const bad = runGuard({
        target: "bad.tsx",
        projectRoot: tmp,
        mode: "consumer",
        factSource: "packaged",
        consumerFactsPath: factsPath,
      });
      expect(bad.exitCode).toBe(1);
      expect(bad.diagnostics[0]?.ruleId).toBe("component/nonexistent-slug");
      expect(bad.diagnostics[0]?.subject.id).toBe("not-a-real-slug");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("packaged mode missing facts → exit 2 (no silent fallback to registry)", () => {
    const result = runGuard({
      target: "lib/guard/__fixtures__/valid/direct-import.tsx",
      projectRoot: process.cwd(),
      mode: "consumer",
      factSource: "packaged",
      consumerFactsPath: join(process.cwd(), "does-not-exist-facts.json"),
    });
    expect(result.exitCode).toBe(2);
    expect(result.executionErrors.some((e) => e.message.includes("not found"))).toBe(true);
  });

  it("internal-paths mode unchanged for existing fixtures", () => {
    const content = readFileSync(
      join(process.cwd(), "lib/guard/__fixtures__/g1/nonexistent-component.tsx"),
      "utf8",
    );
    const facts = extractSourceFacts({
      path: "lib/guard/__fixtures__/g1/nonexistent-component.tsx",
      content,
    });
    const evals = evaluateComponentNonexistentSlug(facts, { provenanceMode: "internal-paths" });
    expect(evals.some((e) => e.status === "violation")).toBe(true);
  });
});
