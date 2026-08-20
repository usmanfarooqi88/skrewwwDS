import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ICON_DANGER = "#e5484d";

function collectCssFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "public") continue;
      files.push(...collectCssFiles(full));
    } else if (entry.name.endsWith(".css")) {
      files.push(full);
    }
  }
  return files;
}

describe("feedback-error-icon (D3 Alert/Toast consumer)", () => {
  const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
  const feedbackCss = readFileSync(
    resolve(process.cwd(), "components/ui/internal/feedback-surface.module.css"),
    "utf8",
  );

  it("aliases feedback-error-icon to semantic-icon-danger (resolves #E5484D)", () => {
    expect(tokens).toMatch(/--primitive-color-danger-500:\s*#e5484d/i);
    expect(tokens).toMatch(
      /--semantic-icon-danger:\s*var\(--primitive-color-danger-500\)/,
    );
    expect(tokens).toMatch(/--feedback-error-icon:\s*var\(--semantic-icon-danger\)/);
    expect(tokens).not.toMatch(/--feedback-error-icon:\s*#e5484d/i);
    // Chain proof: feedback-error-icon → semantic-icon-danger → danger-500 → #E5484D
    expect(ICON_DANGER.toLowerCase()).toBe("#e5484d");
  });

  it("keeps Alert/Toast error icons on the shared FeedbackSurface token path", () => {
    expect(feedbackCss).toMatch(/\.error[\s\S]*?--feedback-icon:\s*var\(--feedback-error-icon\)/);
    expect(feedbackCss).toMatch(/\.icon[\s\S]*?color:\s*var\(--feedback-icon\)/);

    const alertSrc = readFileSync(resolve(process.cwd(), "components/ui/Alert.tsx"), "utf8");
    const toastSrc = readFileSync(
      resolve(process.cwd(), "components/ui/ToastProvider.tsx"),
      "utf8",
    );
    expect(alertSrc).toMatch(/FeedbackSurface/);
    expect(toastSrc).toMatch(/FeedbackSurface/);
    expect(toastSrc).toMatch(/surface="toast"/);
  });

  it("does not migrate File Upload, Link, Menu, ValidationMessage, or Button onto icon-danger", () => {
    const root = process.cwd();
    const forbidden = [
      "components/ui/file-upload.module.css",
      "components/ui/link.module.css",
      "components/ui/menu.module.css",
      "components/ui/validation-message.module.css",
      "components/ui/button.module.css",
      "components/ui/text-input.module.css",
    ];

    for (const rel of forbidden) {
      const content = readFileSync(join(root, rel), "utf8");
      expect(content.includes("var(--semantic-icon-danger)")).toBe(false);
      expect(content.includes("var(--feedback-error-icon)")).toBe(false);
    }
  });

  it("preserves semantic action/text danger and unrelated feedback error tokens", () => {
    expect(tokens).toMatch(
      /--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/,
    );
    expect(tokens).toMatch(/--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/);
    expect(tokens).toMatch(/--feedback-error-surface:\s*#fde2e1/i);
    expect(tokens).toMatch(/--feedback-error-border:\s*rgb\(217 45 62 \/ 0\.24\)/);
    expect(tokens).toMatch(
      /--feedback-error-text:\s*var\(--component-surface-content-muted\)/,
    );
    expect(tokens).toMatch(/--feedback-error-title:\s*var\(--semantic-text-primary\)/);
    expect(tokens).toMatch(/--feedback-success-icon:\s*#30a46c/i);
    expect(tokens).toMatch(/--feedback-warning-icon:\s*#f5a524/i);
    expect(tokens).toMatch(/--feedback-info-icon:\s*#3b82f6/i);
  });

  it("limits direct semantic-icon-danger runtime usage to the feedback-error-icon alias", () => {
    const root = process.cwd();
    const cssFiles = [
      ...collectCssFiles(join(root, "components")),
      ...collectCssFiles(join(root, "styles")),
      ...collectCssFiles(join(root, "app")),
    ];

    const hits: string[] = [];
    for (const file of cssFiles) {
      const rel = file.slice(root.length + 1);
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (!line.includes("var(--semantic-icon-danger)")) continue;
        // Allowed: the D3 alias declaration itself in tokens.css
        if (
          rel === "styles/tokens.css" &&
          /--feedback-error-icon:\s*var\(--semantic-icon-danger\)/.test(line)
        ) {
          continue;
        }
        hits.push(`${rel}: ${line.trim()}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
