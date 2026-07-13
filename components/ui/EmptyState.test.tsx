import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("exposes a visible title and description", () => {
    render(
      <EmptyState
        title="No results"
        description="Try another search term."
      />,
    );
    expect(screen.getByRole("heading", { name: "No results" })).toBeInTheDocument();
    expect(screen.getByText("Try another search term.")).toBeInTheDocument();
  });

  it("does not use alert or status roles", () => {
    render(<EmptyState title="Empty collection" description="Nothing here yet." />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hides decorative icons from assistive technology", () => {
    const { container } = render(
      <EmptyState
        icon={<MagnifyingGlass aria-label="Should not announce" />}
        title="No matches"
      />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("uses button semantics for primary actions", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Create your first project"
        primaryAction={{ label: "Create project", onClick }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Create project" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("uses link semantics for secondary navigation actions", () => {
    render(
      <EmptyState
        title="No results"
        secondaryAction={{ label: "Browse components", href: "/components" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Browse components" })).toHaveAttribute(
      "href",
      "/components",
    );
  });

  it("does not move focus on render", () => {
    render(<EmptyState title="Informational empty state" />);
    expect(document.activeElement).toBe(document.body);
  });

  it("allows informational states without actions", () => {
    render(
      <EmptyState
        title="No related documentation"
        description="Related links appear when registry metadata defines them."
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
