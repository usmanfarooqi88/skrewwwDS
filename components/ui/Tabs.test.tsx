import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/Tabs";

function ExampleTabs({ activationMode = "automatic" }: { activationMode?: "automatic" | "manual" }) {
  return (
    <Tabs defaultValue="one" activationMode={activationMode} onValueChange={vi.fn()}>
      <TabsList aria-label="Example tabs">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three" disabled>
          Three
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="one">Panel one</TabsPanel>
      <TabsPanel value="two">Panel two</TabsPanel>
      <TabsPanel value="three">Panel three</TabsPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("exposes tablist, tab, and tabpanel relationships", () => {
    render(<ExampleTabs />);
    const tab = screen.getByRole("tab", { name: "One" });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveAttribute("aria-controls");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("keeps one tab in the tab order", () => {
    render(<ExampleTabs />);
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("tabindex", "-1");
  });

  it("supports arrow-key navigation", () => {
    render(<ExampleTabs />);
    const first = screen.getByRole("tab", { name: "One" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
  });

  it("supports Home and End keys", () => {
    render(<ExampleTabs />);
    const first = screen.getByRole("tab", { name: "One" });
    first.focus();
    fireEvent.keyDown(first, { key: "End" });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Two" }), { key: "Home" });
    expect(screen.getByRole("tab", { name: "One" })).toHaveFocus();
  });

  it("activates automatically on focus by default", () => {
    render(<ExampleTabs activationMode="automatic" />);
    const second = screen.getByRole("tab", { name: "Two" });
    act(() => second.focus());
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel two")).toBeVisible();
  });

  it("waits for explicit activation in manual mode", async () => {
    const user = userEvent.setup();
    render(<ExampleTabs activationMode="manual" />);
    const second = screen.getByRole("tab", { name: "Two" });
    act(() => second.focus());
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Enter}");
    expect(second).toHaveAttribute("aria-selected", "true");
  });

  it("skips disabled tabs in roving focus", () => {
    render(<ExampleTabs />);
    const first = screen.getByRole("tab", { name: "One" });
    first.focus();
    fireEvent.keyDown(first, { key: "End" });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Three" })).toBeDisabled();
  });
});
