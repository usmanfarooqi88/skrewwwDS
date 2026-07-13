import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarDay } from "@/components/ui/CalendarDay";

describe("CalendarDay", () => {
  it("uses native button semantics", () => {
    render(<CalendarDay date="2026-07-14" />);
    const button = screen.getByRole("button", { name: "14 July 2026" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("marks today independently from selection styling", () => {
    render(<CalendarDay date="2026-07-11" today />);
    expect(screen.getByRole("button", { name: /11 July 2026/ })).toHaveAttribute(
      "aria-current",
      "date",
    );
  });

  it("prevents selection when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CalendarDay date="2026-07-20" disabled onDateSelect={onSelect} />);
    const button = screen.getByRole("button", { name: "20 July 2026" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("hides decorative day numerals from the accessible name", () => {
    render(<CalendarDay date="2026-07-14" />);
    expect(screen.getByRole("button", { name: "14 July 2026" })).toBeInTheDocument();
  });

  it("formats accessible labels with a non-default locale", () => {
    render(<CalendarDay date="2026-07-14" locale="de-DE" />);
    expect(screen.getByRole("button", { name: "14. Juli 2026" })).toBeInTheDocument();
  });
});
