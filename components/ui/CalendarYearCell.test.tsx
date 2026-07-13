import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarYearCell } from "@/components/ui/CalendarYearCell";

describe("CalendarYearCell", () => {
  it("uses native button semantics", () => {
    render(<CalendarYearCell year={2026} />);
    const button = screen.getByRole("button", { name: "2026" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("marks the year containing today independently from selection styling", () => {
    render(<CalendarYearCell year={2026} today />);
    expect(screen.getByRole("button", { name: "2026" })).toHaveAttribute("aria-current", "date");
  });

  it("prevents selection when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CalendarYearCell year={2030} disabled onYearSelect={onSelect} />);
    const button = screen.getByRole("button", { name: "2030" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onYearSelect with the year number on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CalendarYearCell year={2027} onYearSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "2027" }));
    expect(onSelect).toHaveBeenCalledWith(2027);
  });

  it("calls onFocusYear on focus", () => {
    const onFocusYear = vi.fn();
    render(<CalendarYearCell year={2028} onFocusYear={onFocusYear} tabIndex={0} />);
    screen.getByRole("button", { name: "2028" }).focus();
    expect(onFocusYear).toHaveBeenCalledWith(2028);
  });
});
