import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "@/components/ui/Alert";

describe("Alert", () => {
  it("renders visible status text", () => {
    render(<Alert type="warning" title="Review required" description="Check the upload settings." />);
    expect(screen.getByText("Review required")).toBeInTheDocument();
    expect(screen.getByText("Check the upload settings.")).toBeInTheDocument();
  });

  it("does not announce statically by default", () => {
    render(<Alert type="error" title="Error" description="Something failed." />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("supports assertive announcement when requested", () => {
    render(
      <Alert
        type="error"
        title="Error"
        description="Something failed."
        announce="assertive"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed.");
  });

  it("hides icon from assistive technology", () => {
    const { container } = render(<Alert type="info" description="Info message." />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("supports dismiss action", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert type="info" description="Dismiss me." dismissible onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: "Dismiss alert" }));
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.queryByText("Dismiss me.")).not.toBeInTheDocument();
  });
});
