import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarGrid } from "@/components/ui/CalendarGrid";

describe("CalendarGrid", () => {
  it("exposes grid structure and month label", () => {
    render(<CalendarGrid defaultValue="2026-07-14" defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /July 2026/i })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("keeps one day in the tab sequence", () => {
    render(<CalendarGrid defaultValue="2026-07-14" defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    const tabbables = screen
      .getAllByRole("button")
      .filter((button) => button.dataset.date && button.tabIndex === 0);
    expect(tabbables).toHaveLength(1);
  });

  it("selects a date on Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <CalendarGrid
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        onValueChange={onValueChange}
      />,
    );
    const day = screen.getByRole("button", { name: "14 July 2026" });
    day.focus();
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("2026-07-14");
  });

  it("supports controlled selection", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <CalendarGrid
        value="2026-07-10"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "14 July 2026" }));
    expect(onValueChange).toHaveBeenCalledWith("2026-07-14");
    rerender(
      <CalendarGrid
        value="2026-07-14"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole("gridcell", { selected: true })).toBeInTheDocument();
  });

  it("moves focus with arrow keys", () => {
    render(<CalendarGrid defaultValue="2026-07-14" defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    const grid = screen.getByRole("grid");
    const start = screen.getByRole("button", { name: "14 July 2026" });
    start.focus();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "15 July 2026" })).toHaveFocus();
  });

  it("changes month with page down", () => {
    render(<CalendarGrid defaultValue="2026-07-14" defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    const grid = screen.getByRole("grid");
    screen.getByRole("button", { name: "14 July 2026" }).focus();
    fireEvent.keyDown(grid, { key: "PageDown" });
    expect(screen.getByRole("heading", { name: /August 2026/i })).toBeInTheDocument();
  });

  it("navigates months from header buttons", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: /August 2026/i })).toBeInTheDocument();
  });

  it("disables dates outside minDate/maxDate", () => {
    render(
      <CalendarGrid
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        minDate="2026-07-10"
        maxDate="2026-07-20"
      />,
    );
    expect(screen.getByRole("button", { name: "5 July 2026" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "25 July 2026" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "15 July 2026" })).not.toBeDisabled();
  });

  it("disables dates matching an arbitrary isDateDisabled predicate", () => {
    const isWeekend = (date: string) => {
      const day = new Date(date).getUTCDay();
      return day === 0 || day === 6;
    };
    render(
      <CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} isDateDisabled={isWeekend} />,
    );
    // July 11, 2026 is a Saturday.
    expect(screen.getByRole("button", { name: "11 July 2026" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "13 July 2026" })).not.toBeDisabled();
  });

  it("does not select a disabled date on click", () => {
    const onValueChange = vi.fn();
    render(
      <CalendarGrid
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        minDate="2026-07-10"
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "5 July 2026" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("skips disabled dates when navigating with arrow keys", () => {
    const isDisabled = (date: string) => date === "2026-07-15";
    render(
      <CalendarGrid
        defaultValue="2026-07-14"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        isDateDisabled={isDisabled}
      />,
    );
    const grid = screen.getByRole("grid");
    screen.getByRole("button", { name: "14 July 2026" }).focus();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    // 15th is disabled — focus should land on the 16th, not the disabled day.
    expect(screen.getByRole("button", { name: "16 July 2026" })).toHaveFocus();
  });

  it("does not move focus onto a disabled date at a hard minDate boundary", () => {
    render(
      <CalendarGrid
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        minDate="2026-07-10"
        initialFocusDate="2026-07-10"
      />,
    );
    const grid = screen.getByRole("grid");
    const boundaryDay = screen.getByRole("button", { name: "10 July 2026" });
    boundaryDay.focus();
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    // Every date before minDate is disabled with no re-entry point going
    // backward — focus must stay on the 10th, not silently land on a
    // disabled (and therefore unfocusable) date.
    expect(boundaryDay).toHaveFocus();
  });

  it("uses a non-default locale for month and weekday labels", () => {
    render(
      <CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} locale="de-DE" />,
    );
    expect(screen.getByRole("heading", { name: /Juli 2026/i })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent(/^Mo/i);
  });

  it("reorders weekday headers when weekStartsOn is Sunday", () => {
    render(
      <CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} weekStartsOn={0} />,
    );
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent(/^Sun/i);
  });

  it("prefers formatter callback overrides over locale-derived labels", () => {
    render(
      <CalendarGrid
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        locale="de-DE"
        formatMonth={() => "Custom month label"}
        formatWeekday={(index) => `D${index}`}
      />,
    );
    expect(screen.getByRole("heading", { name: "Custom month label" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((node) => node.textContent)).toEqual([
      "D0",
      "D1",
      "D2",
      "D3",
      "D4",
      "D5",
      "D6",
    ]);
  });
});

describe("CalendarGrid drill-up subviews", () => {
  it("drills into the month grid when the header is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    expect(screen.getByRole("grid", { name: "Choose month, 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "January" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "December" })).toBeInTheDocument();
  });

  it("drills a month selection into the day grid with the correct visible month", async () => {
    const user = userEvent.setup();
    const onVisibleMonthChange = vi.fn();
    render(
      <CalendarGrid
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        onVisibleMonthChange={onVisibleMonthChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "March" }));
    expect(screen.getByRole("heading", { name: /March 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(onVisibleMonthChange).toHaveBeenCalledWith({ year: 2026, month: 3 });
  });

  it("drills up further into the year grid from the month grid's year label", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "2026" }));
    expect(screen.getByRole("grid", { name: "Choose year" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026" })).toBeInTheDocument();
  });

  it("drills a year selection back down into the month grid for that year", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "2026" }));
    await user.click(screen.getByRole("button", { name: "2020" }));
    expect(screen.getByRole("grid", { name: "Choose month, 2020" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "March" }));
    expect(screen.getByRole("heading", { name: /March 2020/i })).toBeInTheDocument();
  });

  it("disables a month entirely outside minDate/maxDate", async () => {
    const user = userEvent.setup();
    render(
      <CalendarGrid
        defaultVisibleMonth={{ year: 2026, month: 6 }}
        minDate="2026-02-01"
        maxDate="2026-11-30"
      />,
    );
    await user.click(screen.getByRole("button", { name: "June 2026" }));
    expect(screen.getByRole("button", { name: "January" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "December" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "June" })).not.toBeDisabled();
  });

  it("disables a year entirely outside minDate/maxDate", async () => {
    const user = userEvent.setup();
    render(
      <CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} minDate="2026-01-01" />,
    );
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "2026" }));
    expect(screen.getByRole("button", { name: "2016" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "2026" })).not.toBeDisabled();
  });

  it("does not select a disabled month or year on click", async () => {
    const user = userEvent.setup();
    const onVisibleMonthChange = vi.fn();
    render(
      <CalendarGrid
        defaultVisibleMonth={{ year: 2026, month: 6 }}
        minDate="2026-02-01"
        onVisibleMonthChange={onVisibleMonthChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "June 2026" }));
    await user.click(screen.getByRole("button", { name: "January" }));
    // Selection is blocked — the month grid stays open and no navigation occurs.
    expect(screen.getByRole("grid", { name: "Choose month, 2026" })).toBeInTheDocument();
    expect(onVisibleMonthChange).not.toHaveBeenCalled();
  });

  it("supports arrow-key and Home/End navigation in the month grid", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    const grid = screen.getByRole("grid", { name: "Choose month, 2026" });
    expect(screen.getByRole("button", { name: "July" })).toHaveFocus();

    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "August" })).toHaveFocus();

    fireEvent.keyDown(grid, { key: "Home" });
    expect(screen.getByRole("button", { name: "May" })).toHaveFocus();

    fireEvent.keyDown(grid, { key: "End" });
    expect(screen.getByRole("button", { name: "August" })).toHaveFocus();
  });

  it("restores focus to the 1st of the newly navigated month, not a selected date living in a different month", async () => {
    const user = userEvent.setup();
    render(
      <CalendarGrid defaultValue="2026-07-14" defaultVisibleMonth={{ year: 2026, month: 7 }} />,
    );
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "March" }));
    expect(screen.getByRole("heading", { name: /March 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 March 2026" })).toHaveFocus();
  });

  it("selects a month with Enter and restores focus to a sensible day", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    const grid = screen.getByRole("grid", { name: "Choose month, 2026" });
    fireEvent.keyDown(grid, { key: "Home" }); // focus "May"
    fireEvent.keyDown(grid, { key: "Enter" });
    expect(screen.getByRole("heading", { name: /May 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 May 2026" })).toHaveFocus();
  });

  it("supports arrow-key and Home/End navigation in the year grid", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "2026" }));
    const grid = screen.getByRole("grid", { name: "Choose year" });
    expect(screen.getByRole("button", { name: "2026" })).toHaveFocus();

    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "2027" })).toHaveFocus();

    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    fireEvent.keyDown(grid, { key: "ArrowUp" });
    expect(screen.getByRole("button", { name: "2022" })).toHaveFocus();

    fireEvent.keyDown(grid, { key: "End" });
    expect(screen.getByRole("button", { name: "2023" })).toHaveFocus();
  });

  it("selects a year with Enter and drills back down to its month grid", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "2026" }));
    const grid = screen.getByRole("grid", { name: "Choose year" });
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    fireEvent.keyDown(grid, { key: "Enter" });
    expect(screen.getByRole("grid", { name: "Choose month, 2027" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "July" })).toHaveFocus();
  });

  it("disables the further page button once a direction has no selectable years", async () => {
    const user = userEvent.setup();
    render(
      <CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} minDate="2026-01-01" />,
    );
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "2026" }));
    expect(screen.getByRole("button", { name: "Previous 12 years" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next 12 years" })).not.toBeDisabled();
  });

  it("pages the year grid forward and back with the page navigation buttons", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    await user.click(screen.getByRole("button", { name: "July 2026" }));
    await user.click(screen.getByRole("button", { name: "2026" }));
    await user.click(screen.getByRole("button", { name: "Next 12 years" }));
    expect(screen.getByRole("button", { name: "2028" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "2016" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous 12 years" }));
    expect(screen.getByRole("button", { name: "2026" })).toBeInTheDocument();
  });
});

describe("CalendarGrid range mode", () => {
  it("sets start then end, producing correct start/middle/end range states", async () => {
    const user = userEvent.setup();
    const onRangeValueChange = vi.fn();
    render(
      <CalendarGrid
        mode="range"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        onRangeValueChange={onRangeValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    expect(onRangeValueChange).toHaveBeenLastCalledWith({ start: "2026-07-14", end: undefined });
    expect(screen.getByRole("button", { name: "Start of range, 14 July 2026" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "20 July 2026" }));
    expect(onRangeValueChange).toHaveBeenLastCalledWith({ start: "2026-07-14", end: "2026-07-20" });
    expect(screen.getByRole("button", { name: "Start of range, 14 July 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End of range, 20 July 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "17 July 2026, in range" })).toBeInTheDocument();
    // Outside the range entirely — plain label, not "in range".
    expect(screen.getByRole("button", { name: "21 July 2026" })).toBeInTheDocument();
  });

  it("renders a single-day range as both start and end simultaneously", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid mode="range" defaultVisibleMonth={{ year: 2026, month: 7 }} />);

    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    await user.click(screen.getByRole("button", { name: "Start of range, 14 July 2026" }));

    expect(
      screen.getByRole("button", { name: "Start and end of range, 14 July 2026" }),
    ).toBeInTheDocument();
  });

  it("shows a live provisional preview on hover before the end is committed", async () => {
    const user = userEvent.setup();
    render(<CalendarGrid mode="range" defaultVisibleMonth={{ year: 2026, month: 7 }} />);

    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    await user.hover(screen.getByRole("button", { name: "18 July 2026" }));

    expect(
      screen.getByRole("button", {
        name: "18 July 2026, provisional end of range. Press Enter to confirm.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "16 July 2026, previewing range" })).toBeInTheDocument();
    // Not committed yet — the range hasn't actually changed.
    expect(screen.queryByRole("button", { name: "End of range, 18 July 2026" })).not.toBeInTheDocument();
  });

  it("shows the same live preview via keyboard focus, and Enter commits the end", async () => {
    render(<CalendarGrid mode="range" defaultVisibleMonth={{ year: 2026, month: 7 }} />);

    const start = screen.getByRole("button", { name: "14 July 2026" });
    start.focus();
    fireEvent.click(start);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    fireEvent.keyDown(grid, { key: "ArrowRight" });

    expect(
      screen.getByRole("button", {
        name: "16 July 2026, provisional end of range. Press Enter to confirm.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "15 July 2026, previewing range" })).toBeInTheDocument();

    fireEvent.keyDown(grid, { key: "Enter" });
    expect(screen.getByRole("button", { name: "End of range, 16 July 2026" })).toBeInTheDocument();
  });

  it("starts a fresh range when clicking within an already-complete range", async () => {
    const user = userEvent.setup();
    const onRangeValueChange = vi.fn();
    render(
      <CalendarGrid
        mode="range"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        onRangeValueChange={onRangeValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    await user.click(screen.getByRole("button", { name: "20 July 2026" }));
    // 16th is strictly inside the committed 14th-20th range.
    await user.click(screen.getByRole("button", { name: "16 July 2026, in range" }));

    expect(onRangeValueChange).toHaveBeenLastCalledWith({ start: "2026-07-16", end: undefined });
    expect(screen.getByRole("button", { name: "Start of range, 16 July 2026" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "End of range, 20 July 2026" })).not.toBeInTheDocument();
  });

  it("swaps start/end so the range stays chronological on a backwards second click", async () => {
    const user = userEvent.setup();
    const onRangeValueChange = vi.fn();
    render(
      <CalendarGrid
        mode="range"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        onRangeValueChange={onRangeValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "20 July 2026" }));
    await user.click(screen.getByRole("button", { name: "14 July 2026" }));

    // Both dates the user clicked survive, chronologically reordered — this
    // is not a "start fresh" restart (which would have dropped the 20th).
    expect(onRangeValueChange).toHaveBeenLastCalledWith({ start: "2026-07-14", end: "2026-07-20" });
    expect(screen.getByRole("button", { name: "Start of range, 14 July 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End of range, 20 July 2026" })).toBeInTheDocument();
  });

  it("does not allow a disabled date to become the range start or end", async () => {
    const user = userEvent.setup();
    const onRangeValueChange = vi.fn();
    render(
      <CalendarGrid
        mode="range"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        isDateDisabled={(date) => date === "2026-07-14"}
        onRangeValueChange={onRangeValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    expect(onRangeValueChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "10 July 2026" }));
    expect(onRangeValueChange).toHaveBeenLastCalledWith({ start: "2026-07-10", end: undefined });
    await user.click(screen.getByRole("button", { name: "14 July 2026" }));
    // Disabled midpoint can't become the end either.
    expect(onRangeValueChange).toHaveBeenLastCalledWith({ start: "2026-07-10", end: undefined });
  });

  it("still shows a disabled date inside a valid range as disabled", async () => {
    const user = userEvent.setup();
    render(
      <CalendarGrid
        mode="range"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        isDateDisabled={(date) => date === "2026-07-15"}
      />,
    );

    await user.click(screen.getByRole("button", { name: "10 July 2026" }));
    await user.click(screen.getByRole("button", { name: "20 July 2026" }));

    const midpoint = screen.getByRole("button", { name: "15 July 2026, in range" });
    expect(midpoint).toBeDisabled();
  });

  it("supports an uncontrolled defaultRangeValue", () => {
    render(
      <CalendarGrid
        mode="range"
        defaultVisibleMonth={{ year: 2026, month: 7 }}
        defaultRangeValue={{ start: "2026-07-10", end: "2026-07-14" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Start of range, 10 July 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End of range, 14 July 2026" })).toBeInTheDocument();
  });

  it("leaves single-date mode's value/selected rendering untouched when mode is unset", () => {
    render(<CalendarGrid defaultValue="2026-07-14" defaultVisibleMonth={{ year: 2026, month: 7 }} />);
    expect(screen.getByRole("button", { name: "14 July 2026" })).toBeInTheDocument();
    expect(screen.queryByText(/Start of range/)).not.toBeInTheDocument();
  });
});
