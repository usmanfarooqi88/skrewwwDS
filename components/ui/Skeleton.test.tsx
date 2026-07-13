import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton, SkeletonLoading } from "@/components/ui/Skeleton";

describe("Skeleton", () => {
  it("is aria-hidden by default", () => {
    const { container } = render(<Skeleton shape="text" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("uses aria-busy on loading container", () => {
    render(
      <SkeletonLoading loading loadingLabel="Loading profile" skeleton={<Skeleton shape="text" />}>
        <p>Loaded</p>
      </SkeletonLoading>,
    );
    expect(screen.getByText("Loading profile")).toHaveClass("sr-only");
    expect(screen.getByText("Loading profile").parentElement).toHaveAttribute("aria-busy", "true");
  });

  it("does not assign role=status to skeleton shapes", () => {
    render(<Skeleton shape="circle" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("supports shape variants and custom dimensions", () => {
    const { container, rerender } = render(<Skeleton shape="rectangle" width={200} height={80} />);
    const skeleton = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(skeleton.style.width).toBe("200px");
    expect(skeleton.style.height).toBe("80px");

    rerender(<Skeleton shape="text" width="60%" />);
    expect((container.querySelector('[aria-hidden="true"]') as HTMLElement).style.width).toBe("60%");
  });

  it("shows children when not loading", () => {
    render(
      <SkeletonLoading loading={false} skeleton={<Skeleton shape="text" />}>
        <p>Loaded content</p>
      </SkeletonLoading>,
    );
    expect(screen.getByText("Loaded content")).toBeInTheDocument();
  });
});

describe("Skeleton reduced motion", () => {
  it("retains placeholder markup without semantic leakage", () => {
    const { container } = render(<Skeleton shape="text" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
  });
});
