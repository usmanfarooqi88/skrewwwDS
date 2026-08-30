import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArrowRight, BellRinging, MagnifyingGlass } from "@phosphor-icons/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Button", () => {
  it("renders a native button without href", () => {
    render(<Button type="submit">Save</Button>);
    const control = screen.getByRole("button", { name: "Save" });
    expect(control.tagName).toBe("BUTTON");
    expect(control).toHaveAttribute("type", "submit");
  });

  it("renders link semantics with href", () => {
    render(<Button href="/components">Browse</Button>);
    const control = screen.getByRole("link", { name: "Browse" });
    expect(control.tagName).toBe("A");
    expect(control).toHaveAttribute("href", "/components");
  });

  it("renders external links with rel when target is _blank", () => {
    render(
      <Button href="https://example.com" target="_blank">
        External
      </Button>,
    );
    const control = screen.getByRole("link", { name: "External" });
    expect(control).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("uses aria-disabled for disabled href variant without native disabled", () => {
    render(
      <Button href="/components" disabled>
        Disabled link
      </Button>,
    );
    const control = screen.getByRole("link", { name: "Disabled link" });
    expect(control).toHaveAttribute("aria-disabled", "true");
    expect(control).not.toHaveAttribute("disabled");
    expect(control).toHaveAttribute("tabindex", "-1");
  });

  it("announces loading state accessibly", () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole("button", { name: /Saving/i })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading")).toHaveClass("sr-only");
  });

  it("renders leading and trailing icons", () => {
    render(
      <Button leadingIcon={<PlusIcon />} trailingIcon={<span data-testid="trailing" />}>
        Label
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Label" }).querySelector("svg")).toBeTruthy();
    expect(screen.getByTestId("trailing")).toBeInTheDocument();
  });

  it("does not paint or rewrite nested SVG icon artwork", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ui/button.module.css"), "utf8");
    expect(css).toMatch(/\.primary\s*\{[^}]*var\(--component-surface-content/);
    expect(css).toMatch(/\.danger\s*\{[^}]*var\(--component-surface-content/);
    expect(css).toMatch(/\.secondary\s*\{[^}]*var\(--semantic-text-primary\)/);
    expect(css).toMatch(/\.icon\s*\{[^}]*display:\s*inline-flex/);
    expect(css).not.toMatch(/svg/);
    expect(css).not.toMatch(/\bfill\s*:/);
    expect(css).not.toMatch(/\bstroke\s*:/);
  });

  it("lets structurally different Phosphor icons inherit fill=currentColor without a color prop", () => {
    render(
      <>
        <Button leadingIcon={<ArrowRight data-testid="icon-arrow" size={16} />}>Arrow</Button>
        <Button leadingIcon={<MagnifyingGlass data-testid="icon-search" size={16} />}>Search</Button>
        <Button aria-label="Alerts">
          <BellRinging data-testid="icon-bell" size={16} />
        </Button>
      </>,
    );

    for (const testId of ["icon-arrow", "icon-search", "icon-bell"] as const) {
      const svg = screen.getByTestId(testId);
      expect(svg.tagName.toLowerCase()).toBe("svg");
      expect(svg).toHaveAttribute("fill", "currentColor");
      expect(svg.getAttribute("color")).toBeNull();
      expect(svg.querySelector("[stroke], [fill]:not(svg)")).toBeNull();
    }
  });

  it("keeps icon-only composition on the same visual-surface contract", () => {
    render(
      <Button aria-label="Add item">
        <PlusIcon />
      </Button>,
    );
    const control = screen.getByRole("button", { name: "Add item" });
    expect(control.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(control.firstElementChild?.className).toMatch(/visualSurface/);
  });

  it("activates with keyboard", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Activate</Button>);
    const control = screen.getByRole("button", { name: "Activate" });
    control.focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps the native control as the public ref, className, and style owner", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} className="consumer-class" style={{ marginTop: 7 }}>
        Native root
      </Button>,
    );

    const control = screen.getByRole("button", { name: "Native root" });
    expect(ref.current).toBe(control);
    expect(control).toHaveClass("consumer-class");
    expect(control).toHaveStyle({ marginTop: "7px" });
    expect(control.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("preserves native submit and reset form behavior", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <input aria-label="Value" defaultValue="initial" />
        <Button type="submit">Submit</Button>
        <Button type="reset">Reset</Button>
      </form>,
    );

    const input = screen.getByRole("textbox", { name: "Value" });
    await user.clear(input);
    await user.type(input, "changed");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(input).toHaveValue("initial");
  });
});
