import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarMonthCell } from "@/components/ui/CalendarMonthCell";

describe("CalendarMonthCell", () => {
  it("uses native button semantics", () => {
    render(<CalendarMonthCell month={7} label="July" />);
    const button = screen.getByRole("button", { name: "July" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("marks the month containing today independently from selection styling", () => {
    render(<CalendarMonthCell month={7} label="July" today />);
    expect(screen.getByRole("button", { name: "July" })).toHaveAttribute("aria-current", "date");
  });

  it("prevents selection when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CalendarMonthCell month={12} label="December" disabled onMonthSelect={onSelect} />);
    const button = screen.getByRole("button", { name: "December" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onMonthSelect with the month number on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CalendarMonthCell month={3} label="March" onMonthSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "March" }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("calls onFocusMonth on focus", () => {
    const onFocusMonth = vi.fn();
    render(<CalendarMonthCell month={5} label="May" onFocusMonth={onFocusMonth} tabIndex={0} />);
    screen.getByRole("button", { name: "May" }).focus();
    expect(onFocusMonth).toHaveBeenCalledWith(5);
  });
});
