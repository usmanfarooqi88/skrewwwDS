import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "@/components/ui/Combobox";
import * as PublicUi from "@/components/ui";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";

function comboboxCss() {
  return readFileSync(resolve(process.cwd(), "components/ui/combobox.module.css"), "utf8");
}

function tokensCss() {
  return readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
}

function comboboxSource() {
  return readFileSync(resolve(process.cwd(), "components/ui/Combobox.tsx"), "utf8");
}

const countries = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom", disabled: true },
];

describe("Combobox discovery and registry", () => {
  it("registers Combobox as the canonical searchable list component", () => {
    expect(getRegistryEntry("combobox")?.name).toBe("Combobox");
    expect(getRegistryEntry("autocomplete")).toBeUndefined();
    expect(getRegistryEntry("searchable-select")).toBeUndefined();
  });

  it("exports Combobox publicly", () => {
    expect(PublicUi.Combobox).toBeDefined();
    expect(getImplementedComponentCount()).toBeGreaterThanOrEqual(39);
  });
});

describe("Combobox semantics", () => {
  it("uses an editable combobox input with list autocomplete", () => {
    render(<Combobox label="Country" options={countries} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-haspopup", "listbox");
  });

  it("opens a listbox without dialog semantics", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    expect(screen.getByRole("listbox", { name: "Country" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("wires aria-controls directly to the listbox id", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    const listbox = screen.getByRole("listbox", { name: "Country" });
    expect(input).toHaveAttribute("aria-controls", listbox.id);
  });
});

describe("Combobox filtering", () => {
  it("filters options while typing", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.type(input, "Ca");
    expect(screen.getByRole("option", { name: "Canada" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "United States" })).not.toBeInTheDocument();
  });

  it("shows a no-results row when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    await user.type(screen.getByRole("combobox", { name: "Country" }), "zzz");
    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});

describe("Combobox selection and input sync", () => {
  it("selects from pointer and keeps focus in the input", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox label="Country" options={countries} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "Canada" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("ca");
    expect(input).toHaveValue("Canada");
    expect(input).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    const canada = screen.getByRole("option", { name: "Canada" });
    expect(canada).toHaveAttribute("aria-selected", "true");
    expect(canada.querySelector("svg")).toBeNull();
    expect(canada).toHaveTextContent("Canada");
  });

  it("selects with Enter while keeping input focus", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    await user.type(input, "Ca");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Canada");
    expect(input).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select disabled options", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox label="Country" options={countries} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox", { name: "Country" }));
    await user.click(screen.getByRole("option", { name: "United Kingdom" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("reverts unmatched blur text to the committed label", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} defaultValue="ca" />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.clear(input);
    await user.type(input, "Unknown");
    await user.tab();
    expect(input).toHaveValue("Canada");
  });
});

describe("Combobox keyboard model", () => {
  it("uses aria-activedescendant while the input retains DOM focus", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveFocus();
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();
  });

  it("closes on Escape without clearing the input", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} defaultValue="ca" />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("Canada");
  });

  it("closes on Tab without trapping focus", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Combobox label="Country" options={countries} />
        <button type="button">Next control</button>
      </div>,
    );
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    await user.keyboard("{Tab}");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
    expect(input).not.toHaveFocus();
  });
});

describe("Combobox controlled state", () => {
  it("supports controlled empty selected value", () => {
    const { rerender } = render(
      <Combobox label="Country" options={countries} value="ca" onValueChange={() => {}} />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("Canada");
    rerender(
      <Combobox label="Country" options={countries} value="" onValueChange={() => {}} placeholder="Search" />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("fires onInputValueChange once while typing", async () => {
    const user = userEvent.setup();
    const onInputValueChange = vi.fn();
    render(
      <Combobox label="Country" options={countries} onInputValueChange={onInputValueChange} />,
    );
    await user.type(screen.getByRole("combobox", { name: "Country" }), "C");
    expect(onInputValueChange).toHaveBeenCalledTimes(1);
    expect(onInputValueChange).toHaveBeenLastCalledWith("C");
  });
});

describe("Combobox form integration", () => {
  it("submits the selected option value through a hidden input", () => {
    const { container } = render(
      <form>
        <Combobox label="Country" name="country" options={countries} defaultValue="ca" />
      </form>,
    );
    const hidden = container.querySelector('input[type="hidden"][name="country"]') as HTMLInputElement;
    expect(hidden.value).toBe("ca");
  });

  it("restores defaults when the native form resets", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="country-form">
        <Combobox label="Country" name="country" options={countries} defaultValue="ca" />
        <button type="reset">Reset</button>
      </form>,
    );
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.clear(input);
    await user.type(input, "Unknown");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(input).toHaveValue("Canada");
  });

  it("validates required selection through the visible combobox input", () => {
    render(<Combobox label="Country" required options={countries} placeholder="Search" />);
    const input = screen.getByRole("combobox", { name: /Country/i }) as HTMLInputElement;
    expect(input.required).toBeFalsy();
    expect(input.validationMessage.length).toBeGreaterThan(0);
  });
});

describe("Combobox no-results accessibility", () => {
  it("uses a polite status region without option semantics", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    await user.type(screen.getByRole("combobox", { name: "Country" }), "zzz");
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("No results found.");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("associates the status region while open", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    const status = screen.getByRole("status");
    expect(input.getAttribute("aria-describedby")).toContain(status.id);
  });
});

describe("Combobox blur policy", () => {
  it("commits a unique exact label match on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox label="Country" options={countries} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.clear(input);
    await user.type(input, "canada");
    await user.tab();
    expect(input).toHaveValue("Canada");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("ca");
  });

  it("does not commit duplicate labels on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const duplicateOptions = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Alpha" },
    ];
    render(<Combobox label="Team" options={duplicateOptions} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Team" });
    await user.type(input, "Alpha");
    await user.tab();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("");
  });

  it("does not commit disabled options on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox label="Country" options={countries} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.type(input, "United Kingdom");
    await user.tab();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("");
  });
});

describe("Combobox pointer active sync", () => {
  it("updates aria-activedescendant on pointer enter without moving focus", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Country" options={countries} />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    const canada = screen.getByRole("option", { name: "Canada" });
    await user.hover(canada);
    expect(input).toHaveFocus();
    expect(input.getAttribute("aria-activedescendant")).toBe(canada.id);
  });
});

describe("Combobox Figma metadata", () => {
  it("stores the Figma source URL and component-set node id", async () => {
    const metadata = await import("@/lib/combobox-figma-metadata");
    expect(metadata.COMBOBOX_FIGMA_FILE_URL).toContain("figma.com/design/");
    expect(metadata.COMBOBOX_FIGMA_START_NODE_ID).toBe("2002:2365");
    expect(metadata.COMBOBOX_FIGMA_COMPONENT_SET_NODE_ID).toBe("2024:2480");
    expect(getRegistryEntry("combobox")?.figmaSourceUrl).toBe(metadata.COMBOBOX_FIGMA_FILE_URL);
    expect(getRegistryEntry("combobox")?.figmaNodeId).toBe(metadata.COMBOBOX_FIGMA_COMPONENT_SET_NODE_ID);
  });
});

describe("Combobox controlled-state matrix", () => {
  const handlers = {
    onValueChange: vi.fn(),
    onInputValueChange: vi.fn(),
    onOpenChange: vi.fn(),
  };

  it("supports value-only control", () => {
    const { rerender } = render(
      <Combobox label="Country" options={countries} value="ca" onValueChange={handlers.onValueChange} />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("Canada");
    rerender(
      <Combobox label="Country" options={countries} value="" onValueChange={handlers.onValueChange} />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("supports input-only control without overwriting typed text from selected value sync", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Country"
        options={countries}
        value="ca"
        inputValue="Typed"
        onValueChange={handlers.onValueChange}
        onInputValueChange={handlers.onInputValueChange}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("Typed");
    await user.type(screen.getByRole("combobox"), "!");
    expect(handlers.onInputValueChange).toHaveBeenCalled();
  });

  it("supports open-only control callbacks", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Country"
        options={countries}
        open={false}
        onOpenChange={handlers.onOpenChange}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Country" }));
    expect(handlers.onOpenChange).toHaveBeenCalledWith(true);
  });
});

describe("Combobox option surface contract", () => {
  it("aliases hover/active/selected fills to the Menu row-highlight token", () => {
    const tokens = tokensCss();
    expect(tokens).toMatch(
      /--combobox-option-active-surface:\s*var\(--menu-item-hover-surface\)/,
    );
    expect(tokens).toMatch(
      /--combobox-option-selected-surface:\s*var\(--menu-item-hover-surface\)/,
    );
    expect(tokens).not.toMatch(
      /--combobox-option-active-surface:\s*var\(--semantic-surface-elevated\)/,
    );
    expect(tokens).not.toMatch(
      /--combobox-option-selected-surface:\s*var\(--semantic-surface-subtle\)/,
    );
    expect(tokens).toMatch(
      /\[data-skrewww-surface="glass"\][\s\S]*?--menu-item-hover-surface:\s*rgb\(255 255 255 \/ 0\.2\)/,
    );
  });

  it("keeps Default transparent, Hover/Active on row highlight, Selected overlay + 500, Disabled unfilled", () => {
    const css = comboboxCss();
    expect(css).toMatch(/\.option\s*\{[^}]*background:\s*transparent/);
    expect(css).toMatch(
      /\.option:hover:not\(\.optionDisabled\)\s*\{[^}]*background-color:\s*var\(--combobox-option-active-surface\)/,
    );
    expect(css).toMatch(
      /\.optionActive\s*\{[^}]*background-color:\s*var\(--combobox-option-active-surface\)/,
    );
    expect(css).toMatch(
      /\.optionActive\s*\{[^}]*outline:\s*2px solid var\(--semantic-focus-ring\)/,
    );
    expect(css).toMatch(/\.optionSelected\s*\{[^}]*font-weight:\s*500/);
    expect(css).toMatch(
      /\.optionSelected\s*\{[^}]*background-color:\s*var\(--combobox-option-selected-surface\)/,
    );
    expect(css).toMatch(
      /\.optionSelected\s*\{[^}]*background-image:\s*var\(--component-surface-gradient-overlay\)/,
    );
    expect(css).toMatch(
      /\.optionSelected:hover:not\(\.optionDisabled\),\s*\.optionSelected\.optionActive\s*\{[^}]*background-color:\s*var\(--combobox-option-selected-surface\)/,
    );
    expect(css).toMatch(
      /\.optionSelected:hover:not\(\.optionDisabled\),\s*\.optionSelected\.optionActive\s*\{[^}]*background-image:\s*var\(--component-surface-gradient-overlay\)/,
    );
    expect(css).toMatch(/\.optionDisabled\s*\{[^}]*color:\s*var\(--combobox-option-disabled-text\)/);
    expect(css).toMatch(/\.optionDisabled\s*\{[^}]*cursor:\s*not-allowed/);
    expect(css).not.toMatch(/\.optionDisabled\s*\{[^}]*background/);
  });

  it("gives the listbox panel Surface blur and never blurs option rows", () => {
    const css = comboboxCss();
    expect(css).toMatch(
      /\.listboxPopover\.listboxPopover\s*\{[^}]*backdrop-filter:\s*var\(--component-surface-backdrop-filter\)/,
    );
    expect(css).toMatch(
      /\[data-skrewww-surface="glass"\] \.listboxPopover\.listboxPopover\s*\{[^}]*backdrop-filter:\s*var\(--glass-backdrop-filter-lg\)/,
    );
    expect(css).not.toMatch(/\.option[^{]*\{[^}]*backdrop-filter/);
  });

  it("aliases the listbox shell to Menu panel tokens instead of Popover elevation/rim", () => {
    const tokens = tokensCss();
    const css = comboboxCss();
    expect(tokens).toMatch(/--combobox-popup-surface:\s*var\(--menu-surface\)/);
    expect(tokens).toMatch(/--combobox-popup-border:\s*var\(--menu-border\)/);
    expect(tokens).toMatch(/--combobox-popup-elevation:\s*var\(--menu-elevation\)/);
    expect(tokens).toMatch(/--combobox-popup-radius:\s*var\(--menu-radius\)/);
    expect(tokens).not.toMatch(/--combobox-popup-surface:\s*var\(--popover-surface\)/);
    expect(tokens).not.toMatch(/--combobox-popup-elevation:\s*var\(--popover-elevation\)/);
    expect(tokens).not.toMatch(/--combobox-popup-border:\s*var\(--popover-border\)/);
    expect(css).toMatch(/box-shadow:\s*var\(--combobox-popup-elevation\)/);
    expect(css).toMatch(
      /\.listboxPopover\.listboxPopover\s*\{[^}]*background-image:\s*var\(--component-surface-gradient-overlay\)/,
    );
    expect(css).not.toMatch(/component-card-border-highlight/);
  });

  it("does not invent a checkmark and keeps aria-selected on option rows", () => {
    const source = comboboxSource();
    expect(source).toMatch(/aria-selected=\{option\.value === selectedValue\}/);
    expect(source).toMatch(/aria-activedescendant/);
    expect(source).toMatch(/\{option\.label\}/);
    expect(source).not.toMatch(/checkmark|CheckCircle|aria-checked/);
  });

  it("documents Menu row-highlight in Combobox registry metadata", () => {
    const entry = getRegistryEntry("combobox");
    expect(entry?.reactLastUpdated).toBe("2026-08-31");
    expect(entry?.tokensUsed).toEqual([
      "component/radius/control",
      "combobox/popup-surface",
      "menu/surface",
      "menu/border",
      "component/menu/item-hover",
      "combobox/option-active-surface",
      "combobox/option-selected-surface",
      "semantic/focus-ring",
    ]);
    expect(entry?.relatedTokens?.some((token) => token.label === "component/menu/item-hover")).toBe(
      true,
    );
  });
});
