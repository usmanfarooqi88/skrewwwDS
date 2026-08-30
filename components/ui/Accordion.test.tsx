import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";

function ExampleAccordion({
  type = "single" as const,
  collapsible = false,
  defaultValue,
  value,
  onValueChange,
}: {
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (next: string | string[]) => void;
}) {
  return (
    <Accordion
      type={type}
      collapsible={collapsible}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
    >
      <AccordionItem value="one">
        <AccordionTrigger>Section one</AccordionTrigger>
        <AccordionPanel>Panel one content</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Section two</AccordionTrigger>
        <AccordionPanel>Panel two content</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("uses native button triggers with aria-expanded and aria-controls", async () => {
    const user = userEvent.setup();
    render(<ExampleAccordion defaultValue="one" />);

    const trigger = screen.getByRole("button", { name: "Section one" });
    const panel = screen.getByRole("region", { name: "Section one" });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
    expect(panel).not.toHaveAttribute("hidden");

    await user.click(screen.getByRole("button", { name: "Section two" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");
  });

  it("keeps focus on trigger after toggling", async () => {
    const user = userEvent.setup();
    render(<ExampleAccordion collapsible defaultValue="one" />);
    const trigger = screen.getByRole("button", { name: "Section one" });
    trigger.focus();
    await user.click(trigger);
    expect(trigger).toHaveFocus();
  });

  it("supports uncontrolled single mode", async () => {
    const user = userEvent.setup();
    render(<ExampleAccordion defaultValue="one" />);
    await user.click(screen.getByRole("button", { name: "Section two" }));
    expect(screen.getByRole("button", { name: "Section two" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Panel two content")).toBeVisible();
  });

  it("supports controlled single mode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <ExampleAccordion value="one" onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Section two" }));
    expect(onValueChange).toHaveBeenCalledWith("two");
    rerender(<ExampleAccordion value="two" onValueChange={onValueChange} />);
    expect(screen.getByText("Panel two content")).toBeVisible();
  });

  it("supports multiple expansion mode", async () => {
    const user = userEvent.setup();
    render(<ExampleAccordion type="multiple" defaultValue={["one"]} />);
    await user.click(screen.getByRole("button", { name: "Section two" }));
    expect(screen.getByText("Panel one content")).toBeVisible();
    expect(screen.getByText("Panel two content")).toBeVisible();
  });

  it("allows collapsible single mode to close all items", async () => {
    const user = userEvent.setup();
    render(<ExampleAccordion collapsible defaultValue="one" />);
    const trigger = screen.getByRole("button", { name: "Section one" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const panelId = trigger.getAttribute("aria-controls");
    expect(document.getElementById(panelId!)).toHaveAttribute("hidden");
  });

  it("hides decorative chevron from assistive technology", () => {
    render(<ExampleAccordion defaultValue="one" />);
    expect(document.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("hides collapsed panels from interaction", async () => {
    const user = userEvent.setup();
    render(<ExampleAccordion collapsible defaultValue="one" />);
    const trigger = screen.getByRole("button", { name: "Section one" });
    await user.click(trigger);
    const panelId = trigger.getAttribute("aria-controls");
    const panel = document.getElementById(panelId!);
    expect(panel).toHaveAttribute("hidden");
    expect(panel).not.toHaveAttribute("tabindex");
  });

  it("does not export AccordionItem as a separate public registry component", async () => {
    const registry = await import("@/lib/component-registry");
    const slugs = registry.componentRegistry.map((entry) => entry.slug);
    expect(slugs).toContain("accordion");
    expect(slugs).not.toContain("accordion-item");
  });

  it("preserves custom panel ReactNode across expand and collapse cycles", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible defaultValue="one">
        <AccordionItem value="one">
          <AccordionTrigger>Section one</AccordionTrigger>
          <AccordionPanel>
            <div data-testid="custom-accordion-content">
              <p>Custom accordion content</p>
              <Button>Action</Button>
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByRole("button", { name: "Section one" });
    const panelId = trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId!);
    expect(panel).toBeTruthy();
    const content = screen.getByTestId("custom-accordion-content");

    for (let step = 0; step < 5; step += 1) {
      const expanded = step % 2 === 0;
      expect(trigger).toHaveAttribute("aria-expanded", String(expanded));
      expect(trigger.getAttribute("aria-controls")).toBe(panel!.id);
      expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
      if (expanded) {
        expect(panel).not.toHaveAttribute("hidden");
      } else {
        expect(panel).toHaveAttribute("hidden");
      }

      expect(screen.getByTestId("custom-accordion-content")).toBe(content);
      expect(screen.getAllByTestId("custom-accordion-content")).toHaveLength(1);
      expect(content).toHaveTextContent("Custom accordion content");
      expect(within(content).getByRole("button", { name: "Action", hidden: true })).toBeInTheDocument();
      expect(screen.queryByText(/add content/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();

      if (step < 4) {
        await user.click(trigger);
      }
    }
  });

  it("does not inject instructional placeholder content when children is omitted", () => {
    render(
      <Accordion type="single" collapsible defaultValue="one">
        <AccordionItem value="one">
          <AccordionTrigger>Section one</AccordionTrigger>
          <AccordionPanel />
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByRole("button", { name: "Section one" });
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!);
    expect(panel).toBeTruthy();
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel!.childElementCount).toBe(0);
    expect(panel).toBeEmptyDOMElement();
    expect(screen.queryByText(/add content/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
  });

  it("does not inject instructional placeholder content when children is null", () => {
    render(
      <Accordion type="single" collapsible defaultValue="one">
        <AccordionItem value="one">
          <AccordionTrigger>Section one</AccordionTrigger>
          <AccordionPanel>{null}</AccordionPanel>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByRole("button", { name: "Section one" });
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!);
    expect(panel!.childElementCount).toBe(0);
    expect(screen.queryByText(/add content/i)).not.toBeInTheDocument();
  });
});
