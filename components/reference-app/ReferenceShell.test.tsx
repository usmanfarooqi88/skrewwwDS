import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReferenceNav } from "@/components/reference-app/ReferenceNav";
import { ReferenceShell } from "@/components/reference-app/ReferenceShell";

const pathnameState = vi.hoisted(() => ({ value: "/reference" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

describe("ReferenceNav", () => {
  beforeEach(() => {
    pathnameState.value = "/reference";
  });

  it("exposes a navigation landmark with aria-current on the active route", () => {
    pathnameState.value = "/reference/data";
    render(<ReferenceNav />);
    expect(screen.getByRole("navigation", { name: "Reference app" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Requests" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("invokes onNavigate when a link is activated", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<ReferenceNav onNavigate={onNavigate} />);
    await user.click(screen.getByRole("link", { name: "Settings" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe("ReferenceShell", () => {
  it("provides skip link, main landmark, and sidebar landmark", () => {
    render(
      <ReferenceShell>
        <p>Shell child</p>
      </ReferenceShell>,
    );
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#reference-main",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "reference-main");
    expect(screen.getByRole("main")).toHaveAttribute("tabIndex", "-1");
    expect(
      screen.getByRole("complementary", { name: "Reference app sidebar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Shell child")).toBeInTheDocument();
  });
});
