import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarNav } from "@/components/SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("SidebarNav release-status badges", () => {
  it("shows a NEW badge on the Agent Kit entry", () => {
    render(<SidebarNav />);
    const link = screen.getByRole("link", { name: /^Agent Kit/ });
    expect(within(link).getByText("New")).toBeInTheDocument();
  });

  it("does not badge unrelated top-level nav entries", () => {
    render(<SidebarNav />);
    expect(screen.getByRole("link", { name: "Foundations" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Changelog" })).toBeInTheDocument();
  });
});
