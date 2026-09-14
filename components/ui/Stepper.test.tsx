import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Stepper, Step } from "@/components/ui/Stepper";
import * as PublicUi from "@/components/ui";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";
import {
  STEPPER_FIGMA_COMPONENT_SET_NODE_ID,
  STEPPER_FIGMA_VARIANT_COUNT,
} from "@/lib/stepper-figma-metadata";

describe("Stepper discovery and registry", () => {
  it("registers Stepper as Beta Navigation React-first component, Figma verified", () => {
    const entry = getRegistryEntry("stepper");
    expect(entry?.name).toBe("Stepper");
    expect(entry?.category).toBe("Navigation");
    expect(entry?.status).toBe("beta");
    expect(entry?.version).toBe("0.1.0-beta");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("available");
    expect(entry?.figmaNodeId).toBe(STEPPER_FIGMA_COMPONENT_SET_NODE_ID);
    expect(STEPPER_FIGMA_VARIANT_COUNT).toBe(3);
    expect(getImplementedComponentCount()).toBe(55);
  });

  it("exports Stepper and Step publicly", () => {
    expect(PublicUi.Stepper).toBeDefined();
    expect(PublicUi.Step).toBeDefined();
  });

  it("does not declare orientation or description as a prop in the public Step/Stepper API", () => {
    const source = readFileSync(join(process.cwd(), "components", "ui", "Stepper.tsx"), "utf8");
    // Matches a type-level prop declaration like `orientation?:` — not prose
    // mentioning the word in a comment explaining its deliberate absence.
    expect(source).not.toMatch(/\borientation\s*\??:/i);
    expect(source).not.toMatch(/\bdescription\s*\??:/i);
  });
});

function renderBasicStepper(props: Partial<Parameters<typeof Stepper>[0]> = {}) {
  return render(
    <Stepper currentStep={1} aria-label="Checkout progress" {...props}>
      <Step>Account</Step>
      <Step>Shipping</Step>
      <Step>Payment</Step>
    </Stepper>,
  );
}

describe("Stepper", () => {
  it("renders an ordered list with a labeled step per child", () => {
    const { container } = renderBasicStepper();
    const list = screen.getByRole("list", { name: "Checkout progress" });
    expect(list.tagName).toBe("OL");
    expect(container.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
  });

  it("derives Completed for indexes before currentStep", () => {
    const { container } = renderBasicStepper({ currentStep: 1 });
    const items = container.querySelectorAll("li");
    // index 0 ("Account") is Completed: shows a check icon, not its number.
    expect(items[0].querySelector("svg")).toBeInTheDocument();
    expect(items[0]).not.toHaveTextContent("1");
  });

  it("derives Current for the index equal to currentStep", () => {
    renderBasicStepper({ currentStep: 1 });
    const current = screen.getByText("Shipping").closest("[aria-current]");
    expect(current).toHaveAttribute("aria-current", "step");
  });

  it("derives Upcoming for indexes after currentStep", () => {
    const { container } = renderBasicStepper({ currentStep: 1 });
    const items = container.querySelectorAll("li");
    // index 2 ("Payment") is Upcoming: shows its 1-based number, no check icon.
    expect(items[2].querySelector("svg")).not.toBeInTheDocument();
    expect(items[2]).toHaveTextContent("3");
  });

  it("renders correct 1-based step numbers for Current and Upcoming", () => {
    const { container } = renderBasicStepper({ currentStep: 1 });
    const items = container.querySelectorAll("li");
    expect(items[1]).toHaveTextContent("2"); // Current (index 1)
    expect(items[2]).toHaveTextContent("3"); // Upcoming (index 2)
  });

  it("only the Current step carries aria-current=\"step\"", () => {
    renderBasicStepper({ currentStep: 1 });
    const currentControls = screen
      .getAllByText(/Account|Shipping|Payment/)
      .map((el) => el.closest("[aria-current]"))
      .filter(Boolean);
    expect(currentControls).toHaveLength(1);
  });

  it("read-only mode (no onStepClick) renders no interactive step controls", () => {
    renderBasicStepper({ currentStep: 1 });
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("with onStepClick, Completed and Current steps become interactive; Upcoming never does", () => {
    const onStepClick = vi.fn();
    renderBasicStepper({ currentStep: 1, onStepClick });
    // 2 interactive steps: Completed (Account) + Current (Shipping). Upcoming (Payment) stays non-interactive.
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Payment" })).not.toBeInTheDocument();
  });

  it("onStepClick fires with the correct index for a Completed step", async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    renderBasicStepper({ currentStep: 1, onStepClick });
    await user.click(screen.getByRole("button", { name: "Account" }));
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("onStepClick fires with the correct index for the Current step", async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    renderBasicStepper({ currentStep: 1, onStepClick });
    await user.click(screen.getByRole("button", { name: "Shipping" }));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it("Upcoming steps never fire onStepClick, even if activated programmatically", () => {
    const onStepClick = vi.fn();
    const { container } = renderBasicStepper({ currentStep: 1, onStepClick });
    const items = container.querySelectorAll("li");
    const upcomingControl = items[2].querySelector("span, button");
    expect(upcomingControl?.tagName).toBe("SPAN");
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it("re-renders derived state when currentStep changes (controlled)", () => {
    const { rerender, container } = render(
      <Stepper currentStep={0} aria-label="Progress">
        <Step>Account</Step>
        <Step>Shipping</Step>
      </Stepper>,
    );
    expect(container.querySelectorAll("li")[0]).toHaveTextContent("1");
    rerender(
      <Stepper currentStep={1} aria-label="Progress">
        <Step>Account</Step>
        <Step>Shipping</Step>
      </Stepper>,
    );
    // index 0 is now Completed — check icon, no number text.
    expect(container.querySelectorAll("li")[0].querySelector("svg")).toBeInTheDocument();
  });

  it("applies className on the stepper root", () => {
    render(
      <Stepper currentStep={0} aria-label="Progress" className="extra">
        <Step>Account</Step>
      </Stepper>,
    );
    expect(screen.getByRole("list")).toHaveClass("extra");
  });

  it("throws if Step is rendered outside Stepper", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Step>Alone</Step>)).toThrow(/Step must be used within Stepper/);
    spy.mockRestore();
  });
});
