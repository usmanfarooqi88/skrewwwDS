import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { NumberInput } from "@/components/ui/NumberInput";
import * as PublicUi from "@/components/ui";
import {
  commitNumberDraft,
  parseNumberDraft,
  stepNumber,
} from "@/lib/number-input-value";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";

describe("number-input value helpers", () => {
  it("parses empty, valid, and intermediate drafts", () => {
    expect(parseNumberDraft("")).toEqual({ kind: "empty" });
    expect(parseNumberDraft("-")).toEqual({ kind: "intermediate" });
    expect(parseNumberDraft("1.")).toEqual({ kind: "intermediate" });
    expect(parseNumberDraft("12.5")).toEqual({ kind: "valid", value: 12.5 });
  });

  it("commits with clamp/snap and steps from empty", () => {
    expect(commitNumberDraft("15", 0, 10, 1, 5)).toBe(10);
    expect(commitNumberDraft("-", 0, 10, 1, 5)).toBe(5);
    expect(commitNumberDraft("", 0, 10, 1, 5)).toBe(null);
    expect(stepNumber(null, 1, 0, 10, 1)).toBe(0);
    expect(stepNumber(5, 1, 0, 10, 1)).toBe(6);
    expect(stepNumber(0, -1, 0, 10, 1)).toBe(0);
  });
});

describe("NumberInput discovery and registry", () => {
  it("registers Number Input as Beta Forms React-first component", () => {
    const entry = getRegistryEntry("number-input");
    expect(entry?.name).toBe("Number Input");
    expect(entry?.category).toBe("Forms");
    expect(entry?.status).toBe("beta");
    expect(entry?.version).toBe("0.1.0-beta");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("unavailable");
    expect(getImplementedComponentCount()).toBe(55);
  });

  it("exports NumberInput publicly", () => {
    expect(PublicUi.NumberInput).toBeDefined();
  });
});

describe("NumberInput", () => {
  it("renders a labeled spinbutton with type=text", () => {
    render(<NumberInput label="Quantity" />);
    const input = screen.getByRole("spinbutton", { name: "Quantity" });
    expect(input).toHaveAttribute("type", "text");
    expect(input).not.toHaveAttribute("type", "number");
    expect(screen.getByRole("button", { name: "Increment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrement" })).toBeInTheDocument();
  });

  it("supports uncontrolled defaultValue including zero and empty", () => {
    const { unmount } = render(<NumberInput label="Quantity" defaultValue={0} />);
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toHaveValue("0");
    unmount();
    render(<NumberInput label="Score" defaultValue={null} showSteppers={false} />);
    expect(screen.getByRole("spinbutton", { name: "Score" })).toHaveValue("");
  });

  it("emits controlled updates for typing including negatives and decimals", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState<number | null>(null);
      return (
        <NumberInput
          label="Amount"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
          min={-100}
          max={100}
          step={0.5}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("spinbutton", { name: "Amount" });
    await user.type(input, "-1.5");
    expect(onValueChange).toHaveBeenCalledWith(-1.5);
    expect(input).toHaveValue("-1.5");
  });

  it("clamps on blur without fighting intermediate typing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState<number | null>(1);
      return (
        <NumberInput
          label="Quantity"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
          min={0}
          max={10}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("spinbutton", { name: "Quantity" });
    await user.clear(input);
    await user.type(input, "15");
    expect(onValueChange).toHaveBeenCalledWith(15);
    fireEvent.blur(input);
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(10);
    expect(input).toHaveValue("10");
  });

  it("increments and decrements with steppers and arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState<number | null>(5);
      return (
        <NumberInput
          label="Quantity"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
          min={0}
          max={10}
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(6);
    await user.click(screen.getByRole("button", { name: "Decrement" }));
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(5);
    const input = screen.getByRole("spinbutton", { name: "Quantity" });
    await user.click(input);
    await user.keyboard("{ArrowUp}");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(6);
  });

  it("disables and supports readOnly", () => {
    const { rerender } = render(<NumberInput label="Quantity" defaultValue={3} disabled />);
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increment" })).toBeDisabled();
    rerender(<NumberInput label="Quantity" defaultValue={3} readOnly />);
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Increment" })).toBeDisabled();
  });

  it("links error text", () => {
    render(<NumberInput label="Quantity" error="Enter a valid number." />);
    expect(screen.getByText("Enter a valid number.")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("does not invent currency APIs", () => {
    const entry = getRegistryEntry("number-input");
    const names = entry?.apiProps.map((prop) => prop.name) ?? [];
    expect(names).not.toContain("currency");
    expect(names).not.toContain("locale");
    expect(names).not.toContain("precision");
  });
});
