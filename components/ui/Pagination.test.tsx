import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Pagination,
  buildPaginationItems,
} from "@/components/ui/Pagination";

describe("Pagination", () => {
  it("uses a nav landmark", () => {
    render(
      <Pagination
        items={buildPaginationItems({ currentPage: 2, totalPages: 5, hrefBuilder: (p) => `/?p=${p}` })}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("marks the current page", () => {
    render(
      <Pagination
        items={buildPaginationItems({ currentPage: 2, totalPages: 5, hrefBuilder: (p) => `/?p=${p}` })}
      />,
    );
    expect(screen.getByLabelText("Page 2")).toHaveAttribute("aria-current", "page");
  });

  it("renders link-based page controls with href", () => {
    render(
      <Pagination
        items={buildPaginationItems({ currentPage: 2, totalPages: 5, hrefBuilder: (p) => `/?p=${p}` })}
      />,
    );
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute("href", "/?p=1");
  });

  it("renders button-based page controls without href", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        items={buildPaginationItems({ currentPage: 2, totalPages: 5 })}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables boundary controls at the edges", () => {
    render(
      <Pagination
        items={buildPaginationItems({ currentPage: 1, totalPages: 5, hrefBuilder: (p) => `/?p=${p}` })}
      />,
    );
    expect(screen.getByLabelText("Previous page")).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps ellipsis non-interactive", () => {
    render(
      <Pagination
        items={buildPaginationItems({ currentPage: 6, totalPages: 20, hrefBuilder: (p) => `/?p=${p}` })}
      />,
    );
    expect(screen.getAllByText("More pages").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /ellipsis/i })).not.toBeInTheDocument();
  });
});
