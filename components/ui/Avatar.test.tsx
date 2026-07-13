import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "@/components/ui/Avatar";

describe("Avatar", () => {
  it("renders image with meaningful alt when informative", () => {
    render(<Avatar src="/avatar.jpg" alt="Usman Farooqi" />);
    expect(screen.getByRole("img", { name: "Usman Farooqi" })).toBeInTheDocument();
  });

  it("uses empty alt for decorative images", () => {
    render(<Avatar src="/avatar.jpg" alt="" decorative />);
    expect(document.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("hides decorative avatars from assistive technology", () => {
    const { container } = render(<Avatar initials="UF" decorative />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("labels initials fallback when informative", () => {
    render(<Avatar initials="UF" label="Usman Farooqi" />);
    expect(screen.getByRole("img", { name: "Usman Farooqi" })).toBeInTheDocument();
  });

  it("falls back to initials after image error", () => {
    render(<Avatar src="/missing.png" initials="UF" label="Usman Farooqi" />);
    fireEvent.error(document.querySelector("img")!);
    expect(screen.getByRole("img", { name: "Usman Farooqi" })).toBeInTheDocument();
    expect(screen.getByText("UF")).toBeInTheDocument();
  });

  it("uses icon fallback when no image or initials", () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector('[data-fallback="icon"]')).toBeTruthy();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("supports confirmed sizes", () => {
    const { container, rerender } = render(<Avatar size="sm" initials="SM" label="Small" />);
    expect(container.firstElementChild?.className).toMatch(/sm/);
    rerender(<Avatar size="lg" initials="LG" label="Large" />);
    expect(container.firstElementChild?.className).toMatch(/lg/);
  });

  it("does not duplicate accessible name when decorative beside visible text", () => {
    render(
      <div>
        <Avatar src="/avatar.jpg" alt="" decorative />
        <span>Usman Farooqi</span>
      </div>,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Usman Farooqi")).toBeInTheDocument();
  });

  it("does not label wrapper when informative image alt is provided", () => {
    render(<Avatar src="/avatar.jpg" alt="Usman Farooqi" label="Duplicate name" />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Usman Farooqi" })).toBeInTheDocument();
  });

  it("uses only wrapper labelling for initials fallback", () => {
    const { container } = render(<Avatar initials="UF" label="Usman Farooqi" />);
    expect(screen.getByRole("img", { name: "Usman Farooqi" })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
