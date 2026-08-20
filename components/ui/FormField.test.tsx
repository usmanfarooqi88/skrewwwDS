import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { TextInputControl } from "@/components/ui/TextInputControl";
import {
  contrastRatio,
  parseHexColor,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/wcag-contrast";

describe("FormField", () => {
  it("links label and control", () => {
    render(
      <FormField label="Email" controlId="email-control">
        {({ controlId }) => <TextInputControl id={controlId} />}
      </FormField>,
    );
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute("id", "email-control");
  });

  it("links description through aria-describedby", () => {
    render(
      <FormField label="Username" supportingText="Must be unique.">
        {({ controlId, describedBy }) => (
          <TextInputControl id={controlId} aria-describedby={describedBy} />
        )}
      </FormField>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("-supporting"),
    );
  });

  it("links validation through aria-describedby and invalid state", () => {
    render(
      <FormField label="Password" error="Too short.">
        {({ controlId, describedBy, invalid }) => (
          <TextInputControl
            id={controlId}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </FormField>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain("-error");
    expect(screen.getByText("Too short.")).toBeInTheDocument();
    expect(screen.getByText("Too short.").closest("p")?.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("replaces supporting text with ValidationMessage when error is set", () => {
    render(
      <FormField label="API key" supportingText="Visible to your team." error="Enter a valid API key.">
        {({ controlId }) => <TextInputControl id={controlId} />}
      </FormField>,
    );
    expect(screen.getByText("Enter a valid API key.")).toBeInTheDocument();
    expect(screen.queryByText("Visible to your team.")).not.toBeInTheDocument();
  });

  it("announces required fields accessibly", () => {
    render(
      <FormField label="Name" required>
        {({ controlId }) => <TextInputControl id={controlId} required />}
      </FormField>,
    );
    expect(screen.getByText("(required)")).toHaveClass("sr-only");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("binds the visible required indicator to semantic-text-danger", () => {
    const css = readFileSync(
      resolve(process.cwd(), "components/ui/form-field.module.css"),
      "utf8",
    );
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");

    expect(css).toMatch(/\.required\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).not.toMatch(/\.required\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(tokens).toMatch(/--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/);
    expect(tokens).toMatch(/--primitive-color-danger-600:\s*#cc3b37/);
    expect(tokens).toMatch(/--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/);
  });

  it("meets WCAG AA normal-text contrast for semantic-text-danger on white and elevated surfaces", () => {
    const foreground = parseHexColor("#cc3b37");
    expect(contrastRatio(foreground, parseHexColor("#ffffff"))).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT,
    );
    expect(contrastRatio(foreground, parseHexColor("#f7f7f8"))).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT,
    );
  });

  it("uses stable control ids when provided", () => {
    render(
      <FormField label="Code" controlId="stable-id">
        {({ controlId }) => <TextInput hideLabel label="Code" id={controlId} />}
      </FormField>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "stable-id");
  });
});
