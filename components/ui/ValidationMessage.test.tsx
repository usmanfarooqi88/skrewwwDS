import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValidationMessage } from "@/components/ui/ValidationMessage";
import {
  contrastRatio,
  parseHexColor,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/wcag-contrast";

const ERROR_TEXT = "#cc3b37";
const WHITE = "#ffffff";
const ELEVATED = "#f7f7f8";

describe("ValidationMessage", () => {
  it("hides decorative icons from assistive technology", () => {
    const { container } = render(
      <ValidationMessage type="error" announce="off">
        Error text
      </ValidationMessage>,
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not live-announce static messages by default", () => {
    render(
      <ValidationMessage type="error" announce="off">
        Static error
      </ValidationMessage>,
    );
    expect(screen.getByText("Static error")).not.toHaveAttribute("role", "alert");
  });

  it("can announce dynamic errors assertively", () => {
    render(
      <ValidationMessage type="error" announce="assertive">
        Live error
      </ValidationMessage>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Live error");
  });

  it("binds Error text and icon to component/validation-message/text, not semantic/action/danger", () => {
    const css = readFileSync(
      resolve(process.cwd(), "components/ui/validation-message.module.css"),
      "utf8",
    );
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");

    expect(css).toMatch(/\.error\s*\{[^}]*var\(--component-validation-message-text\)/);
    expect(css).toMatch(/\.iconError\s*\{[^}]*var\(--component-validation-message-text\)/);
    expect(css).not.toMatch(/\.error\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(css).not.toMatch(/\.iconError\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(css).toMatch(/\.warning\s*\{[^}]*var\(--semantic-feedback-warning\)/);
    expect(css).toMatch(/\.success\s*\{[^}]*var\(--semantic-feedback-success\)/);
    expect(css).toMatch(/\.info\s*\{[^}]*var\(--semantic-feedback-info\)/);

    expect(tokens).toMatch(
      /--component-validation-message-text:\s*var\(--primitive-color-danger-600\)/,
    );
    expect(tokens).toMatch(/--primitive-color-danger-600:\s*#cc3b37/);
    expect(tokens).toMatch(/--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/);
  });

  it("meets WCAG AA normal-text contrast for danger/600 on white and elevated surfaces", () => {
    const foreground = parseHexColor(ERROR_TEXT);
    const whiteRatio = contrastRatio(foreground, parseHexColor(WHITE));
    const elevatedRatio = contrastRatio(foreground, parseHexColor(ELEVATED));

    expect(whiteRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    expect(elevatedRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    expect(whiteRatio).toBeCloseTo(4.94, 1);
    expect(elevatedRatio).toBeCloseTo(4.62, 1);
  });
});
