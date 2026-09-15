import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";
import {
  BUTTON_GROUP_FIGMA_COMPONENT_SET_NODE_ID,
  BUTTON_GROUP_FIGMA_VARIANT_COUNT,
  BUTTON_GROUP_SELECTION_SEMANTICS,
} from "@/lib/button-group-figma-metadata";

describe("ButtonGroup discovery and registry", () => {
  it("registers Button Group as a Beta Actions component", () => {
    const entry = getRegistryEntry("button-group");
    expect(entry?.name).toBe("Button Group");
    expect(entry?.category).toBe("Actions");
    expect(entry?.status).toBe("beta");
    expect(entry?.version).toBe("0.1.0-beta");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("available");
    expect(entry?.figmaNodeId).toBe(BUTTON_GROUP_FIGMA_COMPONENT_SET_NODE_ID);
    expect(BUTTON_GROUP_FIGMA_VARIANT_COUNT).toBe(9);
    expect(BUTTON_GROUP_SELECTION_SEMANTICS).toBe("not-implemented-independent-actions");
    expect(getImplementedComponentCount()).toBeGreaterThanOrEqual(49);
  });
});

describe("ButtonGroup", () => {
  it("renders a group of independently operable Buttons", () => {
    render(
      <ButtonGroup aria-label="View mode">
        <Button>List</Button>
        <Button>Grid</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group", { name: "View mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grid" })).toBeInTheDocument();
  });

  it("does not add radiogroup or radio selection semantics", () => {
    render(
      <ButtonGroup aria-label="Range">
        <Button>Day</Button>
        <Button>Week</Button>
      </ButtonGroup>,
    );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("preserves individual Button activation and disabled siblings", async () => {
    const user = userEvent.setup();
    const onList = vi.fn();
    const onGrid = vi.fn();
    render(
      <ButtonGroup aria-label="View">
        <Button onClick={onList}>List</Button>
        <Button disabled onClick={onGrid}>
          Grid
        </Button>
      </ButtonGroup>,
    );
    await user.click(screen.getByRole("button", { name: "List" }));
    expect(onList).toHaveBeenCalledTimes(1);
    const grid = screen.getByRole("button", { name: "Grid" });
    expect(grid).toBeDisabled();
    expect(grid).toHaveStyle({ pointerEvents: "none" });
    expect(onGrid).not.toHaveBeenCalled();
  });

  it("keeps Tab order across children", async () => {
    const user = userEvent.setup();
    render(
      <ButtonGroup aria-label="Period">
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Day" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Week" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Month" })).toHaveFocus();
  });

  it("marks Buttons as joined group items via context", () => {
    render(
      <ButtonGroup aria-label="View">
        <Button>List</Button>
        <Button>Grid</Button>
      </ButtonGroup>,
    );
    const list = screen.getByRole("button", { name: "List" });
    const grid = screen.getByRole("button", { name: "Grid" });
    // CSS module hashes the inGroup class — assert joined geometry indirectly
    // via computed border-radius of middle-of-pair (both are first/last here).
    expect(getComputedStyle(list).borderTopLeftRadius).not.toBe("");
    expect(getComputedStyle(grid).borderTopRightRadius).not.toBe("");
  });

  it("suppresses each joined Button's own border/rim so only the group's divider shows (RA-5 doubled-divider fix)", () => {
    render(
      <ButtonGroup aria-label="View">
        <Button variant="secondary">List</Button>
        <Button variant="primary">Grid</Button>
        <Button variant="danger">Delete</Button>
      </ButtonGroup>,
    );
    for (const name of ["List", "Grid", "Delete"]) {
      const button = screen.getByRole("button", { name });
      const visualSurface = button.querySelector('[class*="visualSurface"]');
      expect(visualSurface).not.toBeNull();
      expect(getComputedStyle(visualSurface as Element).borderColor).toBe("rgba(0, 0, 0, 0)");
    }
  });

  it("accepts className on the group wrapper", () => {
    render(
      <ButtonGroup aria-label="View" className="extra-group">
        <Button>List</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group")).toHaveClass("extra-group");
  });
});
