import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "@/components/ui/Slider";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";
import {
  SLIDER_FIGMA_COMPONENT_SET_NODE_ID,
  SLIDER_FIGMA_STATES,
  SLIDER_FIGMA_VARIANT_COUNT,
} from "@/lib/slider-figma-metadata";

describe("Slider discovery and registry", () => {
  it("registers Slider as a Beta Forms component with verified Figma metadata", () => {
    const entry = getRegistryEntry("slider");
    expect(entry?.name).toBe("Slider");
    expect(entry?.category).toBe("Forms");
    expect(entry?.status).toBe("beta");
    expect(entry?.version).toBe("0.1.0-beta");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("available");
    expect(entry?.figmaNodeId).toBe(SLIDER_FIGMA_COMPONENT_SET_NODE_ID);
    expect(SLIDER_FIGMA_VARIANT_COUNT).toBe(4);
    expect(SLIDER_FIGMA_STATES).toEqual(["Default", "Hover", "Focused", "Disabled"]);
    expect(getImplementedComponentCount()).toBeGreaterThanOrEqual(48);
  });
});

describe("Slider", () => {
  it("exposes slider semantics with valuemin/max/now and a single accessible name", () => {
    render(<Slider label="Volume" defaultValue={40} min={0} max={100} />);
    const control = screen.getByRole("slider", { name: "Volume" });
    expect(control).toHaveAttribute("aria-valuemin", "0");
    expect(control).toHaveAttribute("aria-valuemax", "100");
    expect(control).toHaveAttribute("aria-valuenow", "40");
    expect(control).toHaveAttribute("aria-labelledby", expect.stringMatching(/-label$/));
    expect(screen.getAllByText("Volume")).toHaveLength(1);
  });

  it("increments and decrements with arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="Brightness" defaultValue={10} step={5} onValueChange={onValueChange} />);
    const control = screen.getByRole("slider");
    control.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(15);
    await user.keyboard("{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(15);
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
  });

  it("jumps to min/max with Home and End", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider label="Gain" defaultValue={40} min={10} max={90} onValueChange={onValueChange} />,
    );
    const control = screen.getByRole("slider");
    control.focus();
    await user.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    await user.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith(90);
  });

  it("respects controlled value until the parent updates it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="Controlled" value={20} min={0} max={100} onValueChange={onValueChange} />);
    const control = screen.getByRole("slider");
    expect(control).toHaveAttribute("aria-valuenow", "20");
    control.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(21);
    expect(control).toHaveAttribute("aria-valuenow", "20");
  });

  it("does not change when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider label="Muted" defaultValue={30} disabled onValueChange={onValueChange} />,
    );
    const control = screen.getByRole("slider");
    expect(control).toHaveAttribute("aria-disabled", "true");
    expect(control).toHaveAttribute("tabindex", "-1");
    control.focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{End}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(control).toHaveAttribute("aria-valuenow", "30");
  });

  it("snaps pointer position to step within min/max", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider
        label="Amount"
        defaultValue={0}
        min={0}
        max={100}
        step={10}
        onValueChange={onValueChange}
      />,
    );
    const control = screen.getByRole("slider");
    control.getBoundingClientRect = () =>
      ({
        width: 200,
        height: 24,
        top: 0,
        left: 0,
        bottom: 24,
        right: 200,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }) as DOMRect;

    await user.pointer({ keys: "[MouseLeft>]", target: control, coords: { clientX: 100, clientY: 12 } });
    await user.pointer({ keys: "[/MouseLeft]", target: control, coords: { clientX: 100, clientY: 12 } });
    expect(onValueChange).toHaveBeenCalled();
    const last = onValueChange.mock.calls.at(-1)?.[0] as number;
    expect(last % 10).toBe(0);
    expect(last).toBeGreaterThanOrEqual(0);
    expect(last).toBeLessThanOrEqual(100);
  });
});
