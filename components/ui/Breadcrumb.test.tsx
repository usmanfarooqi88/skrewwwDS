import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

describe("Breadcrumb", () => {
  it("uses a nav landmark with accessible label", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/", home: true },
          { label: "Current" },
        ]}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("marks the current page with aria-current", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Components", href: "/components" },
          { label: "Breadcrumb" },
        ]}
      />,
    );
    expect(screen.getByText("Breadcrumb")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Breadcrumb" })).not.toBeInTheDocument();
  });

  it("keeps ancestors as links", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Current" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("hides separators from assistive technology", () => {
    const { container } = render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Current" },
        ]}
      />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("provides an accessible name for icon-only home crumbs", () => {
    render(
      <Breadcrumb
        items={[
          { label: "", href: "/", home: true },
          { label: "Current" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("Home", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("aligns home icon inline with visible label", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/", home: true },
          { label: "Current" },
        ]}
      />,
    );
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveTextContent("Home");
    expect(homeLink.querySelector("svg")).toBeTruthy();
  });
});
