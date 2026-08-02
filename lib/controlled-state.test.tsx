import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarGrid } from "@/components/ui/CalendarGrid";
import { DatePicker } from "@/components/ui/DatePicker";
import { Combobox } from "@/components/ui/Combobox";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { formatDisplayDate } from "@/components/ui/internal/calendar-date";

const roleOptions = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
];

describe("Controlled state closeout", () => {
  it("DatePicker infers controlled mode from value prop presence and clears without stale text", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <DatePicker label="Release date" value="2026-07-11" onValueChange={onValueChange} />,
    );

    expect(screen.getByRole("textbox")).toHaveValue(formatDisplayDate("2026-07-11"));

    rerender(<DatePicker label="Release date" value={undefined} onValueChange={onValueChange} />);
    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith("2026-07-14");
  });

  it("Select supports controlled empty string without requiring a controlled prop", () => {
    const { rerender } = render(
      <Select label="Role" options={roleOptions} value="editor" onChange={() => {}} />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Editor");

    rerender(
      <Select label="Role" options={roleOptions} value="" onChange={() => {}} placeholder="Choose role" />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Choose role");
  });

  it("SearchField fires onValueChange once when clearing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SearchField label="Search" defaultValue="card" onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("CalendarGrid reflects controlled value updates from parent", () => {
    const { rerender } = render(
      <CalendarGrid
        value="2026-07-11"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        aria-label="Choose date"
      />,
    );
    const selectedCell = screen
      .getByRole("button", { name: /11 July 2026/i })
      .closest('[role="gridcell"]');
    expect(selectedCell).toHaveAttribute("aria-selected", "true");

    rerender(
      <CalendarGrid
        value="2026-07-14"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        aria-label="Choose date"
      />,
    );
    const nextSelectedCell = screen
      .getByRole("button", { name: /14 July 2026/i })
      .closest('[role="gridcell"]');
    expect(nextSelectedCell).toHaveAttribute("aria-selected", "true");
  });

  it("Combobox keeps controlled selected value, input text, and open state independent", async () => {
    const user = userEvent.setup();
    const countryOptions = [
      { value: "us", label: "United States" },
      { value: "ca", label: "Canada" },
    ];
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <Combobox
        label="Country"
        options={countryOptions}
        value=""
        inputValue=""
        open={false}
        onValueChange={onValueChange}
        onInputValueChange={onInputValueChange}
        onOpenChange={onOpenChange}
        placeholder="Search"
      />,
    );

    const input = screen.getByRole("combobox", { name: /Country/i });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.click(input);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it("Combobox controlled empty selected value clears the visible label", () => {
    const countryOptions = [
      { value: "us", label: "United States" },
      { value: "ca", label: "Canada" },
    ];
    const { rerender } = render(
      <Combobox label="Country" options={countryOptions} value="ca" onValueChange={() => {}} />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("Canada");

    rerender(
      <Combobox
        label="Country"
        options={countryOptions}
        value=""
        onValueChange={() => {}}
        placeholder="Search"
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});
