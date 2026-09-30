import { describe, expect, it } from "vitest";
import { checkBuiltFile } from "@/lib/react-package/output-checks";

const rules = (file: string, content: string) => checkBuiltFile(file, content).map((v) => v.rule);

describe("@skrewww/react output checks", () => {
  it("flags next imports in JS and declarations", () => {
    expect(rules("dist/index.js", 'import Link from "next/link";')).toContain("next import");
    expect(rules("dist/index.js", 'import("next/navigation")')).toContain("next import");
    expect(rules("dist/x.d.ts", 'import type { Metadata } from "next";')).toContain("next import");
  });

  it("flags repository aliases in declarations and JS", () => {
    expect(rules("dist/types/Button.d.ts", 'import { cn } from "@/lib/cn";')).toContain("repository alias (@/lib)");
    expect(rules("dist/types/Button.d.ts", 'export * from "@/components/ui/Card";')).toContain("repository alias (@/components)");
    expect(rules("dist/index.js", 'import x from "@/styles/tokens.css";')).toContain("repository alias (@/styles)");
  });

  it("flags recharts, @vercel, @next and server-only imports", () => {
    expect(rules("dist/index.js", 'import { Bar } from "recharts";')).toContain("recharts import");
    expect(rules("dist/index.js", 'import { Analytics } from "@vercel/analytics";')).toContain("@vercel import");
    expect(rules("dist/index.js", 'import x from "@next/third-parties/google";')).toContain("@next import");
    expect(rules("dist/index.js", 'import "server-only";')).toContain("server-only import");
  });

  it("does not flag prose, identifiers or allowed externals", () => {
    const ok = [
      'import { jsx } from "react/jsx-runtime";',
      'import { Check } from "@phosphor-icons/react/dist/ssr";',
      "// the next item, next to the button; nextjs is mentioned in a comment",
      "const nextPage = 2; const recharts_note = 'chart';",
      'export * from "./types/components/ui/Button";',
    ].join("\n");
    expect(checkBuiltFile("dist/index.js", ok)).toEqual([]);
  });

  it("does not apply code rules to CSS", () => {
    expect(checkBuiltFile("dist/styles.css", '/* from "next" and "@/lib/" */')).toEqual([]);
  });
});
