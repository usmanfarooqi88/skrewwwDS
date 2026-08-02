import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DatePicker } from "@/components/ui/DatePicker";
import { formatDisplayDate } from "@/components/ui/internal/calendar-date";
import * as PublicUi from "@/components/ui";

describe("DatePicker", () => {
  it("opens the calendar popover from the calendar button", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" />);
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(screen.getByRole("grid", { name: "Choose date" })).toBeInTheDocument();
  });

  it("does not open the calendar popover when clicking the text field", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" />);
    await user.click(screen.getByRole("textbox", { name: "Release date" }));
    expect(screen.queryByRole("grid", { name: "Choose date" })).not.toBeInTheDocument();
  });

  it("submits canonical YYYY-MM-DD through a hidden input", () => {
    const { container } = render(
      <DatePicker label="Release date" name="release-date" defaultValue="2026-07-11" />,
    );
    const hidden = container.querySelector('input[type="hidden"][name="release-date"]');
    expect(hidden).toHaveValue("2026-07-11");
  });

  it("supports controlled value changes from the calendar", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker label="Release date" defaultValue="2026-07-11" onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("2026-07-14");
  });

  it("syncs the text field when selecting a date in the popover", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" defaultValue="2026-07-11" />);
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    expect(screen.getByRole("textbox", { name: "Release date" })).toHaveValue(
      formatDisplayDate("2026-07-14"),
    );
  });

  it("commits a typed valid date and syncs the popover month", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker label="Release date" onValueChange={onValueChange} />);

    const input = screen.getByRole("textbox", { name: /Release date/i });
    await user.clear(input);
    await user.type(input, formatDisplayDate("2026-08-20"));
    fireEvent.blur(input);

    expect(onValueChange).toHaveBeenCalledWith("2026-08-20");
    expect(input).toHaveValue(formatDisplayDate("2026-08-20"));

    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(screen.getByRole("heading", { name: /August 2026/i })).toBeInTheDocument();
  });

  it("shows a visible error for malformed typed text", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" />);

    const input = screen.getByRole("textbox", { name: /Release date/i });
    await user.type(input, "11/07/2026");
    fireEvent.blur(input);

    expect(screen.getByText(/Enter a date like/i)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a visible error for a well-formed but out-of-range date", async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        label="Release date"
        minDate="2026-07-01"
        maxDate="2026-07-31"
      />,
    );

    const input = screen.getByRole("textbox", { name: /Release date/i });
    await user.type(input, formatDisplayDate("2026-08-01"));
    fireEvent.blur(input);

    expect(screen.getByText(/allowed range/i)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a visible error for a disabled date", async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        label="Release date"
        isDateDisabled={(date) => date === "2026-07-04"}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Release date/i });
    await user.type(input, formatDisplayDate("2026-07-04"));
    fireEvent.blur(input);

    expect(screen.getByText(/not available/i)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("clears the selection when the field is cleared", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker
        label="Release date"
        defaultValue="2026-07-11"
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Release date/i });
    await user.clear(input);
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });
    expect(input).toHaveValue("");
  });

  it("shows a required-field error when cleared on a required picker", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" required defaultValue="2026-07-11" />);

    const input = screen.getByRole("textbox", { name: /Release date/i });
    await user.clear(input);
    fireEvent.blur(input);

    expect(screen.getByText("This field is required.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("commits typed dates on Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker label="Release date" onValueChange={onValueChange} />);

    const input = screen.getByRole("textbox", { name: /Release date/i });
    await user.type(input, `${formatDisplayDate("2026-07-11")}{Enter}`);

    expect(onValueChange).toHaveBeenCalledWith("2026-07-11");
  });

  it("closes on Escape and keeps the trigger focusable", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" defaultValue="2026-07-11" />);
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(screen.getByRole("grid", { name: "Choose date" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("grid", { name: "Choose date" })).not.toBeInTheDocument();
  });

  it("restores focus to the calendar button after closing with Escape", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" defaultValue="2026-07-11" />);
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open calendar" })).toHaveFocus();
  });

  it("does not expose internal calendar utilities publicly", () => {
    expect(Object.keys(PublicUi)).not.toContain("parseCalendarDate");
    expect(Object.keys(PublicUi)).not.toContain("parseDisplayDate");
    expect(Object.keys(PublicUi)).not.toContain("useCalendarKeyboard");
  });

  it("links validation state to the trigger", () => {
    render(<DatePicker label="Due date" error="Choose a valid date." />);
    expect(screen.getByRole("textbox", { name: "Due date" })).toHaveAttribute("aria-invalid", "true");
  });

  it("applies width constraints to the control wrapper so the calendar icon stays aligned", () => {
    const { container } = render(
      <DatePicker label="Release date" className="max-w-md" defaultValue="2026-07-11" />,
    );
    const root = container.querySelector('[class*="root"]');
    expect(root).toHaveClass("max-w-md");
    expect(root).toContainElement(screen.getByRole("button", { name: "Open calendar" }));
  });

  it("uses a non-default locale for typed and displayed dates", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" locale="de-DE" />);

    const input = screen.getByRole("textbox", { name: /Release date/i });
    const german = formatDisplayDate("2026-07-11", "de-DE");
    await user.type(input, german);
    fireEvent.blur(input);

    expect(input).toHaveValue(german);
  });

  it("passes weekStartsOn through to the calendar popover", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Release date" weekStartsOn={0} />);
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent(/^Sun/i);
  });

  it("uses custom formatDate and parseDate callbacks when provided", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker
        label="Release date"
        onValueChange={onValueChange}
        formatDate={(date) => `ISO:${date}`}
        parseDate={(text) => (text.startsWith("ISO:") ? text.slice(4) : null)}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Release date/i });
    await user.type(input, "ISO:2026-07-11");
    fireEvent.blur(input);

    expect(onValueChange).toHaveBeenCalledWith("2026-07-11");
    expect(input).toHaveValue("ISO:2026-07-11");
  });

  it("syncs when a controlled value clears to undefined", () => {
    const { rerender } = render(
      <DatePicker
        label="Release date"
        value="2026-07-11"
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByRole("textbox", { name: /Release date/i })).toHaveValue(
      formatDisplayDate("2026-07-11"),
    );

    rerender(
      <DatePicker
        label="Release date"
        value={undefined}
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByRole("textbox", { name: /Release date/i })).toHaveValue("");
  });

  it("warns in dev when only one formatter callback half is provided", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <DatePicker
        label="Release date"
        formatDate={(date) => date}
      />,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("formatDate and parseDate must both be provided"),
    );
    warn.mockRestore();
  });
});
