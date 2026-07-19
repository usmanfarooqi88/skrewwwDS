import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "@/components/ui/Select";

describe("Select", () => {
  const options = [
    { value: "viewer", label: "Viewer" },
    { value: "editor", label: "Editor" },
  ];

  it("associates label with the visible combobox trigger", () => {
    render(<Select label="Role" id="role-field" options={options} />);
    expect(screen.getByLabelText(/^Role/)).toHaveAttribute("id", "role-field");
  });

  it("uses combobox semantics with a hidden native select for forms", () => {
    const { container } = render(<Select label="Role" options={options} />);
    expect(screen.getByRole("combobox")).toBeInstanceOf(HTMLButtonElement);
    expect(container.querySelector('select[aria-hidden="true"]')).toBeInstanceOf(
      HTMLSelectElement,
    );
  });

  it("renders only one visible field", () => {
    const { container } = render(
      <Select label="Role" placeholder="Choose role" options={options} className="max-w-xs" />,
    );
    const wrap = container.querySelector('[class*="controlWrap"]');
    expect(wrap?.querySelectorAll("button")).toHaveLength(1);
    expect(wrap?.querySelector('[class*="trigger"]')).toBeVisible();
  });

  it("renders placeholder option without selecting it as a real value", () => {
    const { container } = render(<Select label="Role" placeholder="Choose role" options={options} />);
    const select = container.querySelector('select[aria-hidden="true"]') as HTMLSelectElement;
    expect(select.value).toBe("");
    const placeholderOption = select.querySelector('option[value=""]');
    expect(placeholderOption).toHaveTextContent("Choose role");
    expect(placeholderOption).toHaveAttribute("disabled");
    expect(placeholderOption).toHaveAttribute("hidden");
  });

  it("marks invalid state accessibly", () => {
    render(<Select label="Role" error="Choose a role." options={options} />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });

  it("hides decorative caret from assistive technology", () => {
    const { container } = render(<Select label="Role" options={options} />);
    expect(container.querySelector('[aria-hidden="true"] svg')).toBeTruthy();
  });

  it("positions the caret inside the constrained control wrapper", () => {
    const { container } = render(
      <Select label="Role" options={options} className="max-w-xs" />,
    );
    const wrap = container.querySelector('[class*="controlWrap"]');
    const caret = container.querySelector('[class*="caret"]');
    expect(wrap).toHaveClass("max-w-xs");
    expect(wrap).toContainElement(caret as HTMLElement);
  });

  it("opens the listbox below the trigger", async () => {
    const user = userEvent.setup();
    render(<Select label="Role" placeholder="Choose role" options={options} className="max-w-xs" />);
    const trigger = screen.getByRole("combobox");
    const triggerRect = trigger.getBoundingClientRect();
    await user.click(trigger);
    const listbox = screen.getByRole("listbox");
    const popover = listbox.closest('[data-skrewww-popover-fit="trigger"]');
    const listboxRect = popover?.getBoundingClientRect();
    expect(listboxRect?.top ?? 0).toBeGreaterThanOrEqual(triggerRect.bottom);
    expect(listboxRect?.width ?? 0).toBeCloseTo(triggerRect.width, 0);
    expect(listboxRect?.left ?? 0).toBeCloseTo(triggerRect.left, 0);
  });

  it("keeps required select invalid until a real option is chosen", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form data-testid="role-form">
        <Select label="Role" required placeholder="Choose role" options={options} />
      </form>,
    );
    const select = container.querySelector('select[aria-hidden="true"]') as HTMLSelectElement;
    const validationInput = container.querySelector(
      '[class*="validationInput"]',
    ) as HTMLInputElement;
    expect(select.required).toBe(false);
    expect(validationInput).toBeInTheDocument();
    expect(select.value).toBe("");
    expect(validationInput.value).toBe("");
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-required", "true");
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Editor" }));
    expect(select.value).toBe("editor");
    expect(validationInput.value).toBe("editor");
  });

  it("allows controlled reset back to placeholder value", () => {
    const { rerender } = render(
      <Select label="Role" placeholder="Choose role" options={options} value="editor" onChange={() => {}} />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Editor");
    rerender(
      <Select label="Role" placeholder="Choose role" options={options} value="" onChange={() => {}} />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Choose role");
  });

  it("never logs a 'value without onChange' warning in uncontrolled usage (no value/onChange passed)", async () => {
    // Regression guard: the internal aria-hidden native <select> mirror
    // used to forward the raw `onChange` prop directly, which is undefined
    // for the common uncontrolled case — combined with its always-present
    // `value`, that logged React's controlled-field warning on every
    // uncontrolled Select. commitValue already dispatches the consumer's
    // onChange manually, so the mirror itself must stay a permanent no-op.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<Select label="Role" placeholder="Choose role" options={options} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Editor" }));
    expect(screen.getByRole("combobox")).toHaveTextContent("Editor");

    for (const call of errorSpy.mock.calls) {
      expect(String(call[0])).not.toMatch(/value.*prop.*without.*onChange.*handler/i);
    }
    errorSpy.mockRestore();
  });
});
