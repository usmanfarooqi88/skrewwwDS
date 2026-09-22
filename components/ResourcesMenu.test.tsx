import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResourcesMenu } from "@/components/ResourcesMenu";

describe("ResourcesMenu", () => {
  it("lists Guard, Changelog, GitHub, Figma Free, Figma Pro in that order, opened via the trigger", async () => {
    const user = userEvent.setup();
    render(<ResourcesMenu isActive={false} />);
    await user.click(screen.getByRole("button", { name: "Resources" }));

    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Guard",
      "Changelog",
      "GitHub",
      "Figma Free",
      "Figma Pro",
    ]);
  });

  it("gives external resource links target=_blank and rel=noopener noreferrer, but not internal ones", async () => {
    const user = userEvent.setup();
    render(<ResourcesMenu isActive={false} />);
    await user.click(screen.getByRole("button", { name: "Resources" }));

    const guard = screen.getByRole("menuitem", { name: "Guard" });
    expect(guard).toHaveAttribute("href", "/guard");
    expect(guard).not.toHaveAttribute("target");

    const github = screen.getByRole("menuitem", { name: "GitHub" });
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("closes via Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<ResourcesMenu isActive={false} />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    await user.click(trigger);
    expect(screen.getByRole("menu", { name: "Resources" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "Resources" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens from the keyboard and focuses the first item", async () => {
    const user = userEvent.setup();
    render(<ResourcesMenu isActive={false} />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Guard" })).toHaveFocus();
    });
  });

  it("conveys the active Resources context semantically", () => {
    const { rerender } = render(<ResourcesMenu isActive />);
    expect(screen.getByRole("button", { name: "Resources" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    rerender(<ResourcesMenu isActive={false} />);
    expect(screen.getByRole("button", { name: "Resources" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("calls onNavigate when a menu item is selected", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<ResourcesMenu isActive={false} onNavigate={onNavigate} />);
    await user.click(screen.getByRole("button", { name: "Resources" }));
    await user.click(screen.getByRole("menuitem", { name: "Guard" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
