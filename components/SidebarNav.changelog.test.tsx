import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarNav } from "@/components/SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("SidebarNav changelog discoverability", () => {
  it("links to the public changelog", () => {
    render(<SidebarNav />);
    const link = screen.getByRole("link", { name: "Changelog" });
    expect(link).toHaveAttribute("href", "/changelog");
  });
});
