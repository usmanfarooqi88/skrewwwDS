import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Radio } from "@/components/ui/Radio";
import { RadioGroup } from "@/components/ui/RadioGroup";

describe("Radio", () => {
  it("uses native radio semantics", () => {
    render(<Radio name="size" value="md" label="Medium" />);
    expect(screen.getByRole("radio", { name: "Medium" })).toBeInTheDocument();
  });
});

describe("RadioGroup", () => {
  it("shares a name across options", () => {
    render(
      <RadioGroup
        label="Plan"
        defaultValue="pro"
        options={[
          { value: "starter", label: "Starter" },
          { value: "pro", label: "Pro" },
        ]}
      />,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]).toHaveAttribute("name", radios[1]?.getAttribute("name"));
  });

  it("allows only one selected option", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup
        label="Plan"
        defaultValue="starter"
        options={[
          { value: "starter", label: "Starter" },
          { value: "pro", label: "Pro" },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "Starter" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Pro" }));
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Starter" })).not.toBeChecked();
  });

  it("exposes an accessible group label", () => {
    render(
      <RadioGroup
        label="Shipping"
        options={[{ value: "standard", label: "Standard" }]}
      />,
    );
    expect(screen.getByRole("group", { name: "Shipping" })).toBeInTheDocument();
  });

  it("supports disabled options", () => {
    render(
      <RadioGroup
        label="Tier"
        options={[
          { value: "free", label: "Free" },
          { value: "enterprise", label: "Enterprise", disabled: true },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "Enterprise" })).toBeDisabled();
  });

  it("links group errors with aria-describedby", () => {
    render(
      <RadioGroup
        label="Method"
        error="Select a method."
        options={[{ value: "standard", label: "Standard" }]}
      />,
    );
    expect(screen.getByRole("group")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Select a method.")).toBeInTheDocument();
  });

  it("announces required groups accessibly", () => {
    render(
      <RadioGroup
        label="Channel"
        required
        options={[{ value: "email", label: "Email" }]}
      />,
    );
    expect(screen.getByText("(required)")).toHaveClass("sr-only");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("group")).toHaveAttribute("aria-required", "true");
  });

  it("binds the visible required indicator to semantic-text-danger and keeps invalid chrome on action-danger", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ui/radio.module.css"), "utf8");

    expect(css).toMatch(/\.required\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).not.toMatch(/\.required\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(css).toMatch(/\.input\[aria-invalid="true"\]\s*\{[^}]*var\(--semantic-action-danger\)/);
  });
});
