import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { TextInputControl } from "@/components/ui/TextInputControl";

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
