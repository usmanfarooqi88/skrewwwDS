import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/Menu";
import * as PublicUi from "@/components/ui";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";

function BasicMenu({
  onSelect = vi.fn(),
  loop = false,
  open,
  onOpenChange,
}: {
  onSelect?: () => void;
  loop?: boolean;
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
}) {
  return (
    <Menu loop={loop} open={open} onOpenChange={onOpenChange}>
      <MenuTrigger>
        <Button type="button">Actions</Button>
      </MenuTrigger>
      <MenuContent aria-label="Actions">
        <MenuItem onSelect={onSelect}>Edit profile</MenuItem>
        <MenuItem disabled onSelect={onSelect}>
          Disabled item
        </MenuItem>
        <MenuItem onSelect={onSelect}>Duplicate</MenuItem>
      </MenuContent>
    </Menu>
  );
}

describe("Menu discovery and registry", () => {
  it("registers Menu as the canonical public component", () => {
    const entry = getRegistryEntry("menu");
    expect(entry?.name).toBe("Menu");
    expect(entry?.hasImplementation).toBe(true);
    expect(getRegistryEntry("dropdown-menu")).toBeUndefined();
  });

  it("does not duplicate Dropdown Menu as a separate registry entry", () => {
    expect(getImplementedComponentCount()).toBeGreaterThanOrEqual(37);
  });

  it("exports Menu compound components publicly", () => {
    expect(PublicUi.Menu).toBeDefined();
    expect(PublicUi.MenuTrigger).toBeDefined();
    expect(PublicUi.MenuContent).toBeDefined();
    expect(PublicUi.MenuItem).toBeDefined();
  });
});

describe("Menu trigger semantics", () => {
  it("uses a native button with menu popup semantics", async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("type", "button");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls");
  });

  it("preserves consumer click handlers", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Menu>
        <MenuTrigger>
          <Button type="button" onClick={onClick}>
            Actions
          </Button>
        </MenuTrigger>
        <MenuContent aria-label="Actions">
          <MenuItem>One</MenuItem>
        </MenuContent>
      </Menu>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Menu semantics", () => {
  it("uses role=menu without role=dialog", async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu", { name: "Actions" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange exactly once per toggle", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<BasicMenu onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

describe("Menu items", () => {
  it("activates once from pointer and closes by default", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicMenu onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit profile" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not activate disabled items", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicMenu onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Disabled item" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("activates from Enter and Space", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicMenu onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Edit profile" })).toHaveFocus();
    });
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe("Menu keyboard and focus", () => {
  it("opens with ArrowDown and focuses the first enabled item", async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Edit profile" })).toHaveFocus();
    });
  });

  it("opens with ArrowUp and focuses the last enabled item", async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await user.keyboard("{ArrowUp}");
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
    });
  });

  it("supports Home and End", async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Edit profile" })).toHaveFocus();
    });
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "Edit profile" })).toHaveFocus();
  });

  it("restores trigger focus on Escape", async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("closes on Tab without trapping focus", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <BasicMenu />
        <button type="button">Next control</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.keyboard("{Tab}");
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Actions" })).not.toHaveFocus();
  });
});

describe("Menu groups and separators", () => {
  it("renders non-focusable separators and group labels", async () => {
    const user = userEvent.setup();
    render(
      <Menu>
        <MenuTrigger>
          <Button type="button">Actions</Button>
        </MenuTrigger>
        <MenuContent aria-label="Actions">
          <MenuGroup label="Project">
            <MenuItem>Rename</MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuLabel>More</MenuLabel>
          <MenuItem>Archive</MenuItem>
        </MenuContent>
      </Menu>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Project" })).toBeInTheDocument();
  });
});

describe("Menu typeahead", () => {
  it("focuses matching items from printable keys", async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Edit profile" })).toHaveFocus();
    });
    await user.keyboard("d");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
  });
});
