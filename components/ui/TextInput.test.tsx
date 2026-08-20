import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextInput } from "@/components/ui/TextInput";

describe("TextInput", () => {
  it("associates the label with the input", () => {
    render(<TextInput label="Email address" id="email-field" />);
    const input = screen.getByLabelText("Email address");
    expect(input).toHaveAttribute("id", "email-field");
  });

  it("links supporting text through aria-describedby", () => {
    render(
      <TextInput
        label="Username"
        id="username"
        supportingText="Must be unique."
      />,
    );
    const input = screen.getByRole("textbox", { name: "Username" });
    expect(input).toHaveAttribute("aria-describedby", "username-supporting");
    expect(screen.getByText("Must be unique.")).toHaveAttribute("id", "username-supporting");
  });

  it("links error text and sets aria-invalid", () => {
    render(
      <TextInput label="Password" id="password" error="Password is too short." />,
    );
    const input = screen.getByRole("textbox", { name: "Password" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "password-error");
    expect(screen.getByText("Password is too short.")).toBeInTheDocument();
  });

  it("communicates required state accessibly", () => {
    render(<TextInput label="Email" id="email" required />);
    const input = screen.getByLabelText(/^Email/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-required", "true");
    expect(screen.getByText("(required)")).toHaveClass("sr-only");
  });

  it("applies disabled state natively", () => {
    render(<TextInput label="Invite code" id="invite" disabled defaultValue="OFF" />);
    expect(screen.getByRole("textbox", { name: "Invite code" })).toBeDisabled();
  });

  it("applies width constraints to the control wrapper so icons stay aligned", () => {
    const { container } = render(
      <TextInput label="Search" className="max-w-md" placeholder="Find components" />,
    );
    const wrap = container.querySelector('[class*="controlWrap"]');
    expect(wrap).toHaveClass("max-w-md");
    expect(wrap).toContainElement(screen.getByRole("textbox"));
  });

  it("binds invalid border and focus ring to BASE semantic-action-danger (D3 chrome)", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ui/text-input.module.css"), "utf8");
    expect(css).toMatch(
      /\.input\[aria-invalid="true"\]\s*\{[^}]*border-color:\s*var\(--semantic-action-danger\)/,
    );
    expect(css).toMatch(
      /\.input\[aria-invalid="true"\]:focus-visible\s*\{[^}]*box-shadow:[^;]*var\(--semantic-action-danger\)/,
    );
    expect(css).not.toMatch(
      /\.input\[aria-invalid="true"\]\s*\{[^}]*[^-\w]color:\s*var\(--semantic-action-danger\)/,
    );
  });
});
