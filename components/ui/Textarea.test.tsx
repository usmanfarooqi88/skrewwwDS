import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "@/components/ui/Textarea";

describe("Textarea", () => {
  it("associates label with textarea", () => {
    render(<Textarea label="Description" id="description-field" />);
    expect(screen.getByLabelText(/^Description/)).toHaveAttribute("id", "description-field");
  });

  it("uses native textarea semantics", () => {
    render(<Textarea label="Notes" />);
    expect(screen.getByRole("textbox")).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("marks invalid state accessibly", () => {
    render(<Textarea label="Bio" error="Bio is required." />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Bio is required.")).toBeInTheDocument();
  });

  it("distinguishes disabled and read-only", () => {
    const { rerender } = render(<Textarea label="Field" disabled defaultValue="Disabled" />);
    expect(screen.getByRole("textbox")).toBeDisabled();

    rerender(<Textarea label="Field" readOnly defaultValue="Read only" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).not.toBeDisabled();
  });

  it("applies width constraints to the control wrapper so the resize icon stays aligned", () => {
    const { container } = render(
      <Textarea label="Description" className="max-w-md" placeholder="Tell us about your project…" />,
    );
    const wrap = container.querySelector('[class*="controlWrap"]');
    expect(wrap).toHaveClass("max-w-md");
    expect(wrap).toContainElement(screen.getByRole("textbox"));
  });
});
