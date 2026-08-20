import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Link } from "@/components/ui/Link";
import {
  contrastRatio,
  parseHexColor,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/wcag-contrast";

describe("Link", () => {
  it("renders a semantic anchor for internal links", () => {
    render(<Link href="/components/button">Button docs</Link>);
    const link = screen.getByRole("link", { name: "Button docs" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/components/button");
  });

  it("applies safe rel for external blank targets", () => {
    render(
      <Link href="https://example.com" target="_blank">
        External
      </Link>,
    );
    const link = screen.getByRole("link", { name: "External" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("hides decorative icons from assistive technology", () => {
    const { container } = render(
      <Link href="/components" trailingIcon={<span data-testid="icon">↗</span>}>
        Docs
      </Link>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("does not assign role=link to native anchors", () => {
    render(<Link href="/components">Docs</Link>);
    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute("role", "link");
  });

  it("binds danger labels to semantic-text-danger while icons keep pre-batch currentColor inheritance", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ui/link.module.css"), "utf8");
    const source = readFileSync(resolve(process.cwd(), "components/ui/Link.tsx"), "utf8");

    expect(css).toMatch(/\.danger\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(css).toMatch(/\.danger \.label\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).toMatch(/\.danger:hover\s*\{[^}]*var\(--semantic-action-danger-hover\)/);
    expect(css).toMatch(/\.danger:hover \.label\s*\{[^}]*var\(--semantic-action-danger-hover\)/);
    expect(css).not.toMatch(/\.danger[^{]*\.icon/);
    expect(css).not.toMatch(/--semantic-icon-muted/);
    expect(css).not.toMatch(/\.danger:active/);
    expect(css).not.toMatch(/:disabled/);
    expect(css).not.toMatch(/aria-disabled/);
    expect(source).not.toMatch(/\bdisabled\b/);
  });

  it("meets WCAG AA normal-text contrast for danger labels on white and elevated surfaces", () => {
    const foreground = parseHexColor("#cc3b37");
    expect(contrastRatio(foreground, parseHexColor("#ffffff"))).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT,
    );
    expect(contrastRatio(foreground, parseHexColor("#f7f7f8"))).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT,
    );
  });
});
