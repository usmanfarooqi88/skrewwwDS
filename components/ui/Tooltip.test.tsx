import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Tooltip } from "@/components/ui/Tooltip";

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on keyboard focus", () => {
    render(
      <Tooltip content="Save changes">
        <button type="button">Save</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Save" });
    act(() => {
      fireEvent.focus(trigger);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Save changes");
    expect(trigger).toHaveAttribute("aria-describedby");
  });

  it("opens on pointer hover after delay", async () => {
    render(
      <Tooltip content="Copy example" openDelay={200}>
        <button type="button" aria-label="Copy example">
          Copy
        </button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Copy example" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Copy example");
  });

  it("closes on blur", async () => {
    render(
      <Tooltip content="Dismiss me">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Trigger" });
    await act(async () => {
      trigger.focus();
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await act(async () => {
      trigger.blur();
      vi.advanceTimersByTime(100);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes on pointer leave", async () => {
    render(
      <Tooltip content="Hover label" openDelay={0} closeDelay={0}>
        <button type="button">Hover</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Hover" });
    fireEvent.mouseEnter(trigger);
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(
      <Tooltip content="Escape closes me">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    await act(async () => {
      screen.getByRole("button", { name: "Trigger" }).focus();
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not move focus to the tooltip", async () => {
    render(
      <Tooltip content="Supplementary">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Trigger" });
    await act(async () => {
      trigger.focus();
    });

    expect(document.activeElement).toBe(trigger);
    expect(screen.getByRole("tooltip")).not.toHaveAttribute("tabindex");
  });

  it("preserves trigger accessible name", async () => {
    render(
      <Tooltip content="Copy code example">
        <button type="button" aria-label="Copy code example">
          Copy
        </button>
      </Tooltip>,
    );

    expect(screen.getByRole("button", { name: "Copy code example" })).toBeInTheDocument();
  });

  // Regression guard: Tooltip composes a caller-supplied ref with its own via
  // cloneElement. Reading element.ref directly (instead of child.props.ref)
  // is the exact API React 19 deprecated — but React only installs the
  // warning getter on an element when it actually carries a ref, so the
  // trigger child must supply one (matching real composed-ref usage) or this
  // test would pass regardless of the bug. No other test in this file
  // attaches an explicit ref to its trigger child, so the warning (which
  // fires once per element-type name for the module's life) can't have been
  // pre-consumed here.
  it("does not access the deprecated element.ref API when triggered", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const callerRef = createRef<HTMLButtonElement>();
    render(
      <Tooltip content="Save changes">
        <button type="button" ref={callerRef}>
          Save
        </button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Save" });
    act(() => {
      fireEvent.focus(trigger);
    });

    expect(callerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(
      error.mock.calls.some((call) => String(call[0]).includes("element.ref")),
    ).toBe(false);
    error.mockRestore();
  });
});

describe("Tooltip reduced motion", () => {
  it("renders tooltip content when open", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(
      <Tooltip content="Visible label">
        <button type="button">Open</button>
      </Tooltip>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Visible label");
  });
});
