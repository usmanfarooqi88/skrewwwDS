import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import * as PublicUi from "@/components/ui";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";

describe("ToggleGroup discovery and registry", () => {
  it("registers Toggle Group as Beta Actions React-first component", () => {
    const entry = getRegistryEntry("toggle-group");
    expect(entry?.name).toBe("Toggle Group");
    expect(entry?.category).toBe("Actions");
    expect(entry?.status).toBe("beta");
    expect(entry?.version).toBe("0.1.0-beta");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("unavailable");
    expect(getImplementedComponentCount()).toBe(56);
  });

  it("exports ToggleGroup publicly and does not export SegmentedControl", () => {
    expect(PublicUi.ToggleGroup).toBeDefined();
    expect(PublicUi.ToggleGroupItem).toBeDefined();
    expect((PublicUi as Record<string, unknown>).SegmentedControl).toBeUndefined();
  });
});

describe("ToggleGroup", () => {
  it("renders a named radiogroup with radio items", () => {
    render(
      <ToggleGroup aria-label="View mode" defaultValue="list">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("radiogroup", { name: "View mode" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "false");
  });

  it("supports controlled selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState("list");
      return (
        <ToggleGroup
          aria-label="View mode"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        >
          <ToggleGroupItem value="list">List</ToggleGroupItem>
          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
        </ToggleGroup>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole("radio", { name: "Grid" }));
    expect(onValueChange).toHaveBeenCalledWith("grid");
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
  });

  it("does not clear selection when re-clicking the selected item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup aria-label="View mode" defaultValue="list" onValueChange={onValueChange}>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
    // May still fire setValue("list") — selection stays list
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
  });

  it("moves selection with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup aria-label="View mode" defaultValue="list">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );
    screen.getByRole("radio", { name: "List" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveFocus();
  });

  it("disables the group and individual items", () => {
    const { rerender } = render(
      <ToggleGroup aria-label="View mode" defaultValue="list" disabled>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("radio", { name: "List" })).toBeDisabled();
    rerender(
      <ToggleGroup aria-label="Alignment" defaultValue="left">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center" disabled>
          Center
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("radio", { name: "Center" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Left" })).not.toBeDisabled();
  });

  it("applies className on the group", () => {
    render(
      <ToggleGroup aria-label="View mode" defaultValue="list" className="extra">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveClass("extra");
  });

  it("scopes the vertical + Pill radius cap to Pill mode only via a dedicated CSS rule (RA-5 fix; real var() resolution verified in e2e/toggle-group.spec.ts, not jsdom)", () => {
    render(
      <div data-skrewww-shape="pill">
        <ToggleGroup aria-label="Density" orientation="vertical" defaultValue="compact">
          <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
        </ToggleGroup>
      </div>,
    );
    const group = screen.getByRole("radiogroup");
    // jsdom does not reliably resolve var()-based border-radius (confirmed
    // via probe), so this only asserts the structural hook the CSS rule
    // keys off: group carries both the base and vertical classes.
    expect(group.className).toMatch(/group/);
    expect(group.className).toMatch(/vertical/);
  });
});
