import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
import {
  contrastRatio,
  parseHexColor,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/wcag-contrast";

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

describe("Menu Glass panel contract", () => {
  it("binds Menu panel Glass fill/border/blur independently of Popover md mix", () => {
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
    const menuCss = readFileSync(resolve(process.cwd(), "components/ui/menu.module.css"), "utf8");
    const popoverCss = readFileSync(resolve(process.cwd(), "components/ui/popover.module.css"), "utf8");

    // Flat panel aliases stay solid semantic surface/border; blur off.
    expect(tokens).toMatch(/--menu-surface:\s*var\(--semantic-surface-default\)/);
    expect(tokens).toMatch(/--menu-border:\s*var\(--semantic-border-default\)/);
    expect(tokens).toMatch(/--menu-backdrop-filter:\s*none/);

    // Glass: exact Figma panel-surface 12% / panel-border 24% / blur lg 16px.
    expect(tokens).toMatch(
      /\[data-skrewww-surface="glass"\][\s\S]*?--menu-surface:\s*rgb\(255 255 255 \/ 0\.12\)/,
    );
    expect(tokens).toMatch(
      /\[data-skrewww-surface="glass"\][\s\S]*?--menu-border:\s*rgb\(255 255 255 \/ 0\.24\)/,
    );
    expect(tokens).toMatch(
      /\[data-skrewww-surface="glass"\][\s\S]*?--menu-elevation:\s*none/,
    );
    expect(tokens).toMatch(
      /--glass-backdrop-filter-lg:[\s\S]*?--menu-backdrop-filter:\s*var\(--glass-backdrop-filter-lg\)/,
    );
    expect(tokens).toMatch(
      /\[data-skrewww-surface="glass"\][\s\S]*?--menu-item-hover-surface:\s*rgb\(255 255 255 \/ 0\.2\)/,
    );

    // Menu shell consumes the Menu tokens (not Card gradient rim).
    expect(menuCss).toMatch(/background-color:\s*var\(--menu-surface\)/);
    expect(menuCss).toMatch(/border:\s*1px solid var\(--menu-border\)/);
    expect(menuCss).toMatch(/backdrop-filter:\s*var\(--menu-backdrop-filter\)/);
    expect(menuCss).toMatch(
      /\[data-skrewww-surface="glass"\][\s\S]*?backdrop-filter:\s*var\(--glass-backdrop-filter-lg\)/,
    );
    expect(menuCss).toMatch(/\.content\.content/);
    expect(menuCss).not.toMatch(/component-card-border-highlight/);

    // Hover items must not grow their own blur.
    expect(menuCss).toMatch(
      /\.item:hover:not\(\.itemDisabled\)\s*\{[^}]*background:\s*var\(--menu-item-hover-surface\)/,
    );
    expect(menuCss).not.toMatch(/\.item[^{]*\{[^}]*backdrop-filter/);

    // Popover Glass recipe stays md/12px color-mix — Menu must not mutate it.
    expect(popoverCss).toMatch(
      /\[data-skrewww-surface="glass"\] \.popover\s*\{[^}]*glass-mix-md/,
    );
    expect(popoverCss).toMatch(
      /\[data-skrewww-surface="glass"\] \.popover\s*\{[^}]*glass-backdrop-filter-md/,
    );
    expect(popoverCss).not.toMatch(/menu-surface|menu-backdrop-filter|menu-border/);
  });

  it("does not expose a Selected MenuItem API", () => {
    const source = readFileSync(resolve(process.cwd(), "components/ui/Menu.tsx"), "utf8");
    expect(source).toMatch(/export type MenuItemProps/);
    expect(source).not.toMatch(/selected\??:/);
    expect(source).not.toMatch(/aria-selected/);
  });
});

describe("Menu destructive text contract", () => {
  it("aliases menu-item-destructive-text to semantic-text-danger and keeps disabled winning over destructive", () => {
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
    const css = readFileSync(resolve(process.cwd(), "components/ui/menu.module.css"), "utf8");

    expect(tokens).toMatch(/--menu-item-destructive-text:\s*var\(--semantic-text-danger\)/);
    expect(tokens).not.toMatch(/--menu-item-destructive-text:\s*var\(--semantic-action-danger\)/);
    expect(tokens).toMatch(/--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/);
    expect(tokens).toMatch(/--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/);
    expect(css).toMatch(
      /\.itemDestructive:not\(\.itemDisabled\)\s*\{[^}]*var\(--menu-item-destructive-text\)/,
    );
    expect(css).toMatch(/\.itemDisabled\s*\{[^}]*var\(--menu-item-disabled-text\)/);
    expect(css).toMatch(/\.itemIcon\s*\{[^}]*var\(--menu-item-icon\)/);
    expect(css).not.toMatch(/\.itemDestructive\s*\{/);
  });

  it("applies both destructive and disabled classes when both props are set and stays non-interactive", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Menu>
        <MenuTrigger>
          <Button type="button">Actions</Button>
        </MenuTrigger>
        <MenuContent aria-label="Actions">
          <MenuItem destructive disabled onSelect={onSelect}>
            Delete (disabled)
          </MenuItem>
        </MenuContent>
      </Menu>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const item = screen.getByRole("menuitem", { name: "Delete (disabled)" });
    expect(item.className).toMatch(/itemDestructive/);
    expect(item.className).toMatch(/itemDisabled/);
    expect(item).toHaveAttribute("aria-disabled", "true");
    await user.click(item);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("meets WCAG AA normal-text contrast for danger/600 on white and elevated surfaces", () => {
    const foreground = parseHexColor("#cc3b37");
    expect(contrastRatio(foreground, parseHexColor("#ffffff"))).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT,
    );
    expect(contrastRatio(foreground, parseHexColor("#f7f7f8"))).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT,
    );
  });
});
