import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import * as PublicUi from "@/components/ui";

function BasicPopover({
  focusMode = "trigger" as const,
  open,
  onOpenChange,
}: {
  focusMode?: "trigger" | "content";
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
}) {
  return (
    <Popover focusMode={focusMode} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger>
        <Button type="button">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Popover title</PopoverTitle>
        <PopoverBody>
          <button type="button">Inside popover</button>
        </PopoverBody>
        <PopoverClose />
      </PopoverContent>
    </Popover>
  );
}

describe("Popover semantics", () => {
  it("uses a semantic-neutral container for simple unnamed supplementary content", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>
          <Button type="button">Show note</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverBody>
            <p>Short supplementary note without a landmark role.</p>
          </PopoverBody>
        </PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Show note" }));
    const content = document.getElementById(
      screen.getByRole("button", { name: "Show note" }).getAttribute("aria-controls")!,
    );
    expect(content).toBeTruthy();
    expect(content).not.toHaveAttribute("role");
  });

  it("uses role=dialog only when named", async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    expect(screen.getByRole("dialog", { name: "Popover title" })).toBeInTheDocument();
  });
});

describe("Popover", () => {
  it("toggles from trigger and exposes aria-expanded", async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);

    const trigger = screen.getByRole("button", { name: "Open popover" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.getByRole("dialog", { name: "Popover title" })).toBeInTheDocument();
  });

  it("closes with Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    const trigger = screen.getByRole("button", { name: "Open popover" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes from explicit close control", async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    await user.click(screen.getByRole("button", { name: "Close popover" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on outside pointer without moving focus to trigger", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <BasicPopover />
        <button type="button">Outside target</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Open popover" }));
    await user.click(screen.getByRole("button", { name: "Outside target" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Outside target" })).toHaveFocus();
  });

  it("does not close when clicking inside content", async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    await user.click(screen.getByRole("button", { name: "Inside popover" }));
    expect(screen.getByRole("dialog", { name: "Popover title" })).toBeInTheDocument();
  });

  it("keeps focus on trigger in trigger focus mode", async () => {
    const user = userEvent.setup();
    render(<BasicPopover focusMode="trigger" />);
    const trigger = screen.getByRole("button", { name: "Open popover" });
    await user.click(trigger);
    expect(trigger).toHaveFocus();
  });

  it("moves focus into content in content focus mode", async () => {
    const user = userEvent.setup();
    render(<BasicPopover focusMode="content" />);
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    expect(screen.getByRole("button", { name: "Inside popover" })).toHaveFocus();
  });

  it("supports controlled open state requests", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<BasicPopover open onOpenChange={onOpenChange} />);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog", { name: "Popover title" })).toBeInTheDocument();
  });

  it("does not export internal overlay utilities", () => {
    expect(Object.keys(PublicUi)).not.toContain("Portal");
    expect(Object.keys(PublicUi)).not.toContain("useBackgroundInert");
    expect(Object.keys(PublicUi)).not.toContain("registerOverlay");
  });

  // Regression guard: PopoverTrigger composes a caller-supplied ref with its
  // own via cloneElement. Reading element.ref directly (instead of
  // child.props.ref) is the exact API React 19 deprecated — but React only
  // installs the warning getter on an element when it actually carries a
  // ref, so the trigger's child must supply one (matching real composed-ref
  // usage) or this test would pass regardless of the bug. React also warns
  // only once per element-type name for the module's life, so this uses a
  // bare native <button> — every other trigger in this file wraps its child
  // in the shared <Button> component, so "button" is guaranteed untouched
  // here; reusing an already-warned type would silently mask a regression.
  it("does not access the deprecated element.ref API when opened", async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const callerRef = createRef<HTMLButtonElement>();
    render(
      <Popover>
        <PopoverTrigger>
          <button type="button" ref={callerRef}>
            Open popover
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverBody>Content</PopoverBody>
        </PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    expect(callerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(
      error.mock.calls.some((call) => String(call[0]).includes("element.ref")),
    ).toBe(false);
    error.mockRestore();
  });
});

describe("PopoverAnchor", () => {
  it("registers an anchor ref without toggle behavior", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover open={false} onOpenChange={onOpenChange}>
        <PopoverAnchor>
          <input aria-label="Country" />
        </PopoverAnchor>
        <PopoverContent aria-label="Options">
          <PopoverBody>Results</PopoverBody>
        </PopoverContent>
      </Popover>,
    );

    const input = screen.getByRole("textbox", { name: "Country" });
    await user.click(input);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // Regression guard: PopoverAnchor composes a caller-supplied ref with its
  // own via cloneElement — the second of Popover.tsx's two original
  // element.ref call sites, and specifically what Combobox composes. Reading
  // element.ref directly (instead of child.props.ref) is the exact API
  // React 19 deprecated — but React only installs the warning getter on an
  // element when it actually carries a ref, so the anchor's child must
  // supply one (matching real composed-ref usage) or this test would pass
  // regardless of the bug. React also warns only once per element-type name
  // for the module's life: the "Popover" describe block's regression guard
  // above already consumes the warning for a ref-bearing native "button", so
  // this uses a ref-bearing native <input> instead — untouched by any ref
  // anywhere else in this file.
  it("does not access the deprecated element.ref API when registering the anchor", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const callerRef = createRef<HTMLInputElement>();
    render(
      <Popover open={false}>
        <PopoverAnchor>
          <input aria-label="Country" ref={callerRef} />
        </PopoverAnchor>
        <PopoverContent aria-label="Options">
          <PopoverBody>Results</PopoverBody>
        </PopoverContent>
      </Popover>,
    );

    expect(callerRef.current).toBeInstanceOf(HTMLInputElement);
    expect(
      error.mock.calls.some((call) => String(call[0]).includes("element.ref")),
    ).toBe(false);
    error.mockRestore();
  });
});

describe("Popover shell tokens stay independent of selectable-list panels", () => {
  it("composes the Card-family rich overlay locally and keeps Select/Date Picker lock tokens", () => {
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
    const css = readFileSync(resolve(process.cwd(), "components/ui/popover.module.css"), "utf8");
    const selectCss = readFileSync(resolve(process.cwd(), "components/ui/select.module.css"), "utf8");
    const datePickerCss = readFileSync(
      resolve(process.cwd(), "components/ui/date-picker.module.css"),
      "utf8",
    );
    const tooltipCss = readFileSync(resolve(process.cwd(), "components/ui/tooltip.module.css"), "utf8");

    expect(tokens).toMatch(/--popover-padding:\s*0\.75rem/);
    expect(tokens).toMatch(/--popover-surface:\s*var\(--semantic-surface-default\)/);
    expect(tokens).toMatch(/--popover-border:\s*var\(--semantic-border-default\)/);
    expect(tokens).toMatch(
      /--popover-elevation:\s*0 var\(--primitive-shadow-blur-4\) var\(--primitive-shadow-blur-4\)/,
    );

    expect(css).toMatch(/component-card-surface/);
    expect(css).toMatch(/component-card-border-gradient/);
    expect(css).toMatch(/box-shadow:\s*none/);
    expect(css).toMatch(/backdrop-filter:\s*var\(--component-surface-backdrop-filter\)/);
    expect(css).not.toMatch(/glass-mix-md|glass-backdrop-filter-md/);
    expect(css).not.toMatch(/menu-surface|combobox-popup|menu-elevation/);
    expect(css).not.toMatch(/component-surface-gradient-overlay/);

    expect(css).toMatch(
      /\.arrow[\s\S]*?background:\s*var\(--component-card-surface\)/,
    );
    expect(css).toMatch(
      /\.arrow[\s\S]*?border:\s*1px solid var\(--component-card-border\)/,
    );
    expect(css).not.toMatch(/\.arrow[^{]*\{[^}]*backdrop-filter/);

    expect(selectCss).toMatch(/\.listboxPopover\.listboxPopover/);
    expect(selectCss).toMatch(/box-shadow:\s*var\(--popover-elevation\)/);
    expect(selectCss).toMatch(/glass-backdrop-filter-md/);
    expect(selectCss).not.toMatch(/component-card-border-gradient/);

    expect(datePickerCss).toMatch(/\.popover\.popover/);
    expect(datePickerCss).toMatch(/box-shadow:\s*var\(--popover-elevation\)/);
    expect(datePickerCss).toMatch(/glass-backdrop-filter-md/);
    expect(datePickerCss).not.toMatch(/component-card-border-gradient/);

    expect(tooltipCss).toMatch(/background:\s*var\(--tooltip-surface\)/);
    expect(tooltipCss).not.toMatch(/glass-mix-sm|glass-backdrop-filter/);
    expect(tooltipCss).not.toMatch(/data-skrewww-surface/);
    expect(tooltipCss).not.toMatch(/popover-surface|component-card-border-gradient/);
  });
});

describe("Popover pointer containment", () => {
  it("ignores non-primary button pointer events for dismissal", async () => {
    render(<BasicPopover />);
    await userEvent.click(screen.getByRole("button", { name: "Open popover" }));
    fireEvent.pointerDown(document.body, { button: 2 });
    expect(screen.getByRole("dialog", { name: "Popover title" })).toBeInTheDocument();
  });
});
