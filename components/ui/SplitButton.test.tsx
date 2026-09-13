import { CaretDown } from "@phosphor-icons/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import { SplitButton } from "@/components/ui/SplitButton";
import * as PublicUi from "@/components/ui";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";
import {
  SPLIT_BUTTON_FIGMA_COMPONENT_SET_NODE_ID,
  SPLIT_BUTTON_FIGMA_VARIANT_COUNT,
} from "@/lib/split-button-figma-metadata";

function SaveSplitFixture({
  onPrimary = vi.fn(),
  onDraft = vi.fn(),
  primaryDisabled = false,
  menuDisabled = false,
  loading = false,
  className,
}: {
  onPrimary?: () => void;
  onDraft?: () => void;
  primaryDisabled?: boolean;
  menuDisabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <SplitButton aria-label="Save options" divider="primary" className={className}>
      <Button
        type="button"
        variant="primary"
        disabled={primaryDisabled}
        loading={loading}
        onClick={onPrimary}
      >
        Save
      </Button>
      <Menu disabled={menuDisabled}>
        <MenuTrigger>
          <Button type="button" variant="primary" disabled={menuDisabled} aria-label="More save options">
            <CaretDown size={16} weight="bold" />
          </Button>
        </MenuTrigger>
        <MenuContent aria-label="More save options">
          <MenuItem onSelect={onDraft}>Save as draft</MenuItem>
          <MenuItem>Save and publish</MenuItem>
        </MenuContent>
      </Menu>
    </SplitButton>
  );
}

describe("SplitButton discovery and registry", () => {
  it("registers Split Button as a Beta Actions component", () => {
    const entry = getRegistryEntry("split-button");
    expect(entry?.name).toBe("Split Button");
    expect(entry?.category).toBe("Actions");
    expect(entry?.status).toBe("beta");
    expect(entry?.version).toBe("0.1.0-beta");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("available");
    expect(entry?.figmaNodeId).toBe(SPLIT_BUTTON_FIGMA_COMPONENT_SET_NODE_ID);
    expect(SPLIT_BUTTON_FIGMA_VARIANT_COUNT).toBe(9);
    expect(getImplementedComponentCount()).toBeGreaterThanOrEqual(50);
  });

  it("exports SplitButton publicly", () => {
    expect(PublicUi.SplitButton).toBeDefined();
  });
});

describe("SplitButton", () => {
  it("renders primary action and menu trigger as independent buttons", () => {
    render(<SaveSplitFixture />);
    expect(screen.getByRole("group", { name: "Save options" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More save options" })).toBeInTheDocument();
  });

  it("fires primary action only from the primary button", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    const onDraft = vi.fn();
    render(<SaveSplitFixture onPrimary={onPrimary} onDraft={onDraft} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onDraft).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens menu from trigger only and does not fire primary", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<SaveSplitFixture onPrimary={onPrimary} />);
    const trigger = screen.getByRole("button", { name: "More save options" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(onPrimary).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "More save options" })).toBeInTheDocument();
  });

  it("activates primary with keyboard without opening the menu", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<SaveSplitFixture onPrimary={onPrimary} />);
    const primary = screen.getByRole("button", { name: "Save" });
    primary.focus();
    await user.keyboard("{Enter}");
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens menu from keyboard on the trigger", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<SaveSplitFixture onPrimary={onPrimary} />);
    const trigger = screen.getByRole("button", { name: "More save options" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(onPrimary).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes menu on Escape", async () => {
    const user = userEvent.setup();
    render(<SaveSplitFixture />);
    const trigger = screen.getByRole("button", { name: "More save options" });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("selects a menu item without firing primary", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    const onDraft = vi.fn();
    render(<SaveSplitFixture onPrimary={onPrimary} onDraft={onDraft} />);
    await user.click(screen.getByRole("button", { name: "More save options" }));
    await user.click(screen.getByRole("menuitem", { name: "Save as draft" }));
    expect(onDraft).toHaveBeenCalledTimes(1);
    expect(onPrimary).not.toHaveBeenCalled();
  });

  it("supports disabled primary while menu remains available", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<SaveSplitFixture onPrimary={onPrimary} primaryDisabled />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "More save options" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(onPrimary).not.toHaveBeenCalled();
  });

  it("supports disabled menu trigger while primary remains available", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    render(<SaveSplitFixture onPrimary={onPrimary} menuDisabled />);
    expect(screen.getByRole("button", { name: "More save options" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps loading on the primary Button", () => {
    render(<SaveSplitFixture loading />);
    const primary = screen.getByRole("button", { name: "Save Loading" });
    expect(primary).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "More save options" })).not.toHaveAttribute(
      "aria-busy",
    );
  });

  it("keeps Tab order across primary and trigger", async () => {
    const user = userEvent.setup();
    render(<SaveSplitFixture />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "More save options" })).toHaveFocus();
  });

  it("accepts className on the split wrapper", () => {
    render(<SaveSplitFixture className="extra-split" />);
    expect(screen.getByRole("group")).toHaveClass("extra-split");
  });

  it("does not add radiogroup or selection semantics", () => {
    render(<SaveSplitFixture />);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
