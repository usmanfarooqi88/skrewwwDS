import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "@/components/ui/Checkbox";

describe("Checkbox", () => {
  it("uses native checkbox semantics", () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeInTheDocument();
  });

  it("associates label text with the input", () => {
    render(<Checkbox label="Subscribe" id="subscribe" />);
    expect(screen.getByLabelText("Subscribe")).toHaveAttribute("id", "subscribe");
  });

  it("supports uncontrolled checked state", () => {
    render(<Checkbox label="Checked" defaultChecked />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("supports controlled checked state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Toggle me" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalled();
  });

  it("sets indeterminate on the native element", () => {
    render(<Checkbox label="Partial" indeterminate />);
    expect(screen.getByRole("checkbox")).toHaveProperty("indeterminate", true);
  });

  it("supports disabled state", () => {
    render(<Checkbox label="Disabled" disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("supports error relationship via aria-invalid", () => {
    render(
      <Checkbox label="Permission" aria-invalid aria-describedby="permission-error" />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute("aria-describedby", "permission-error");
  });

  it("binds invalid border/fill chrome to BASE semantic-action-danger (D3)", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ui/checkbox.module.css"), "utf8");
    expect(css).toMatch(
      /\.input\[aria-invalid="true"\]\s*\{[^}]*border-color:\s*var\(--semantic-action-danger\)/,
    );
    expect(css).toMatch(
      /\.input\[aria-invalid="true"\]:checked[\s\S]*?background:\s*var\(--semantic-action-danger\)/,
    );
    expect(css).toMatch(
      /\.input\[aria-invalid="true"\]:indeterminate[\s\S]*?background:\s*var\(--semantic-action-danger\)/,
    );
  });
});
