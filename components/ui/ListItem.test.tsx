import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ListItem } from "@/components/ui/ListItem";

describe("ListItem", () => {
  it("renders static rows without false interactive semantics", () => {
    render(
      <ul>
        <ListItem title="Static item" description="Details" />
      </ul>,
    );
    expect(screen.getByText("Static item")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders navigational mode as a real anchor", () => {
    render(
      <ul>
        <ListItem href="/components/button" title="Button" />
      </ul>,
    );
    const link = screen.getByRole("link", { name: "Button" });
    expect(link).toHaveAttribute("href", "/components/button");
  });

  it("renders action mode as a native button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ul>
        <ListItem onClick={onClick} title="Archive" />
      </ul>,
    );
    const button = screen.getByRole("button", { name: "Archive" });
    expect(button).toHaveAttribute("type", "button");
    await user.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("keeps trailing actions separate on static rows", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ul>
        <ListItem
          title="Export registry"
          trailing={
            <Button type="button" onClick={onClick}>
              Download
            </Button>
          }
        />
      </ul>,
    );
    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("composes decorative avatars without duplicating the visible title", () => {
    render(
      <ul>
        <ListItem
          leading={<Avatar size="sm" initials="UF" decorative />}
          title="Usman Farooqi"
        />
      </ul>,
    );
    expect(screen.getByText("Usman Farooqi")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("disables action rows with native button semantics", () => {
    render(
      <ul>
        <ListItem onClick={() => undefined} disabled title="Disabled action" />
      </ul>,
    );
    expect(screen.getByRole("button", { name: "Disabled action" })).toBeDisabled();
  });
});
