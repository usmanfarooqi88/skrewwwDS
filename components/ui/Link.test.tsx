import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Link } from "@/components/ui/Link";
import {
  contrastRatio,
  parseHexColor,
  WCAG_AA_NORMAL_TEXT,
  WCAG_AA_UI_COMPONENT,
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

  it("supports leading and trailing decorative icons", () => {
    const { container } = render(
      <Link
        href="/components"
        leadingIcon={<span data-testid="leading">←</span>}
        trailingIcon={<span data-testid="trailing">→</span>}
      >
        Docs
      </Link>,
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(screen.getByTestId("leading")).toBeTruthy();
    expect(screen.getByTestId("trailing")).toBeTruthy();
  });

  it("does not assign role=link to native anchors", () => {
    render(<Link href="/components">Docs</Link>);
    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute("role", "link");
  });

  it("binds Danger Default/Hover/Active to Figma-locked text and icon roles", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ui/link.module.css"), "utf8");
    const source = readFileSync(resolve(process.cwd(), "components/ui/Link.tsx"), "utf8");
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");

    // Default: label text-danger; root/icon semantic-icon-danger (not action-danger)
    expect(css).toMatch(/\.danger\s*\{[^}]*var\(--semantic-icon-danger\)/);
    expect(css).toMatch(/\.danger \.label\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).not.toMatch(/\.danger\s*\{[^}]*var\(--semantic-action-danger\)/);

    // Hover: converge on accessible text-danger (#CC3B37) — not TEMP action-danger-hover
    expect(css).toMatch(/\.danger:hover\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).toMatch(/\.danger:hover \.label\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).not.toMatch(/--semantic-action-danger-hover/);
    expect(css).not.toMatch(/#b82433/i);

    // Pressed: primitive danger/700 (#B3261E); :active after :hover for precedence
    const hoverIdx = css.indexOf(".danger:hover");
    const activeIdx = css.indexOf(".danger:active");
    expect(activeIdx).toBeGreaterThan(hoverIdx);
    expect(css).toMatch(/\.danger:active\s*\{[^}]*var\(--primitive-color-danger-700\)/);
    expect(css).toMatch(/\.danger:active \.label\s*\{[^}]*var\(--primitive-color-danger-700\)/);
    expect(css).not.toMatch(/--semantic-action-danger-pressed/);
    expect(tokens).toMatch(/--primitive-color-danger-700:\s*#b3261e/i);

    // Zero Default visual delta for icon role: icon-danger === danger-500 === #E5484D
    expect(tokens).toMatch(
      /--semantic-icon-danger:\s*var\(--primitive-color-danger-500\)/,
    );
    expect(tokens).toMatch(/--primitive-color-danger-500:\s*#e5484d/i);
    expect(tokens).toMatch(/--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/);
    expect(tokens).toMatch(/--primitive-color-danger-600:\s*#cc3b37/i);

    // Preserve architecture / non-goals
    expect(css).not.toMatch(/\.danger[^{]*\.icon/);
    expect(css).not.toMatch(/--semantic-icon-muted/);
    expect(css).not.toMatch(/:disabled/);
    expect(css).not.toMatch(/aria-disabled/);
    expect(source).not.toMatch(/\bdisabled\b/);
    expect(source).toMatch(/leadingIcon/);
    expect(source).toMatch(/trailingIcon/);
    expect(css).toMatch(/text-decoration:\s*underline/);
    expect(css).toMatch(/\.link:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--semantic-focus-ring\)/);
    expect(css).toMatch(/outline-offset:\s*2px/);
  });

  it("binds Primary/default and Subtle :active pressed states after :hover", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ui/link.module.css"), "utf8");
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");

    expect(css).toMatch(/\.default\s*\{[^}]*var\(--link-text-default\)/);
    expect(css).toMatch(/\.default:hover\s*\{[^}]*var\(--link-text-hover\)/);
    expect(css).toMatch(/\.default:active\s*\{[^}]*var\(--primitive-color-brand-700\)/);
    expect(css.indexOf(".default:active")).toBeGreaterThan(css.indexOf(".default:hover"));

    expect(css).toMatch(/\.subtle\s*\{[^}]*var\(--semantic-text-secondary\)/);
    expect(css).toMatch(/\.subtle:hover\s*\{[^}]*var\(--link-text-hover\)/);
    expect(css).toMatch(/\.subtle:active\s*\{[^}]*var\(--semantic-text-primary\)/);
    expect(css.indexOf(".subtle:active")).toBeGreaterThan(css.indexOf(".subtle:hover"));

    // Live token resolutions (do not invent Figma hex literals that differ from tokens.css)
    expect(tokens).toMatch(/--primitive-color-brand-700:\s*#42299c/i);
    expect(tokens).toMatch(
      /--semantic-text-primary:\s*var\(--primitive-color-neutral-900\)/,
    );
    expect(tokens).toMatch(/--primitive-color-neutral-900:\s*#17181b/i);

    // Danger R1 untouched by Primary/Subtle pressed rules
    expect(css).toMatch(/\.danger:active\s*\{[^}]*var\(--primitive-color-danger-700\)/);
    expect(css).toMatch(/\.danger \.label\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).toMatch(/\.danger\s*\{[^}]*var\(--semantic-icon-danger\)/);
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

  it("meets WCAG AA non-text contrast for danger icon chrome (#E5484D)", () => {
    const foreground = parseHexColor("#e5484d");
    expect(contrastRatio(foreground, parseHexColor("#ffffff"))).toBeGreaterThanOrEqual(
      WCAG_AA_UI_COMPONENT,
    );
    expect(contrastRatio(foreground, parseHexColor("#f7f7f8"))).toBeGreaterThanOrEqual(
      WCAG_AA_UI_COMPONENT,
    );
  });

  it("meets WCAG AA normal-text contrast for Danger Pressed #B3261E", () => {
    const foreground = parseHexColor("#b3261e");
    expect(contrastRatio(foreground, parseHexColor("#ffffff"))).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT,
    );
  });

  it("meets WCAG AA normal-text contrast for Primary Pressed brand-700 and Subtle Pressed text-primary", () => {
    expect(
      contrastRatio(parseHexColor("#42299c"), parseHexColor("#ffffff")),
    ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    expect(
      contrastRatio(parseHexColor("#17181b"), parseHexColor("#ffffff")),
    ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });
});
