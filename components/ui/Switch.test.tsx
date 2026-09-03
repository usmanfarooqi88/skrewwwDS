import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "@/components/ui/Switch";

describe("Switch", () => {
  it("uses switch semantics with a single accessible name", () => {
    render(<Switch label="Notifications" />);
    const control = screen.getByRole("switch", { name: "Notifications" });
    expect(control).toBeInTheDocument();
    expect(control).toHaveAttribute("aria-labelledby", expect.stringMatching(/-label$/));
    expect(screen.getAllByText("Notifications")).toHaveLength(1);
  });

  it("reflects checked state through aria-checked", () => {
    render(<Switch label="Dark mode" defaultChecked />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("activates with Space through native button behavior", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Beta" onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole("switch");
    control.focus();
    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("activates with Enter through native button behavior", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Beta" onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole("switch");
    control.focus();
    await user.keyboard("{Enter}");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("activates with click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Weekly digest" onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not activate when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Disabled" disabled onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole("switch");
    expect(control).toBeDisabled();
    expect(control).toHaveAttribute("aria-checked", "false");
    control.focus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("stays pinned to a controlled `checked` prop until the parent updates it", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Controlled" checked={false} onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole("switch");
    expect(control).toHaveAttribute("aria-checked", "false");

    await user.click(control);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // No internal state change without the parent re-rendering with the new value.
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("does not submit a surrounding form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Switch label="Notifications" />
      </form>,
    );
    await user.click(screen.getByRole("switch"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("uses type=button so it never submits forms implicitly", () => {
    render(<Switch label="Notifications" id="digest-switch" />);
    expect(screen.getByRole("switch")).toHaveAttribute("type", "button");
  });
});
