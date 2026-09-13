import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  CreditCardField,
  type CreditCardFieldValue,
} from "@/components/ui/CreditCardField";
import * as PublicUi from "@/components/ui";
import {
  formatCardNumberDisplay,
  formatExpiryDisplay,
  digitsOnly,
} from "@/lib/credit-card-field-format";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";
import {
  CREDIT_CARD_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
  CREDIT_CARD_FIELD_FIGMA_VARIANT_COUNT,
} from "@/lib/credit-card-field-figma-metadata";

describe("credit-card-field format helpers", () => {
  it("stores digits and formats display groups", () => {
    expect(digitsOnly("4111 1111 abcd", 19)).toBe("41111111");
    expect(formatCardNumberDisplay("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(formatExpiryDisplay("1230")).toBe("12/30");
  });
});

describe("CreditCardField discovery and registry", () => {
  it("registers Credit Card Field as Beta Forms component", () => {
    const entry = getRegistryEntry("credit-card-field");
    expect(entry?.name).toBe("Credit Card Field");
    expect(entry?.category).toBe("Forms");
    expect(entry?.status).toBe("beta");
    expect(entry?.version).toBe("0.1.0-beta");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("available");
    expect(entry?.figmaNodeId).toBe(CREDIT_CARD_FIELD_FIGMA_COMPONENT_SET_NODE_ID);
    expect(CREDIT_CARD_FIELD_FIGMA_VARIANT_COUNT).toBe(4);
    expect(getImplementedComponentCount()).toBeGreaterThanOrEqual(53);
  });

  it("exports CreditCardField publicly", () => {
    expect(PublicUi.CreditCardField).toBeDefined();
  });
});

describe("CreditCardField", () => {
  it("renders three independently labeled text inputs with a group label", () => {
    render(<CreditCardField label="Card details" />);
    expect(screen.getByRole("group", { name: "Card details" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Card number" })).toHaveAttribute("type", "text");
    expect(screen.getByRole("textbox", { name: "Expiry" })).toHaveAttribute("type", "text");
    expect(screen.getByRole("textbox", { name: "CVC" })).toHaveAttribute("type", "text");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("uses text inputs with numeric inputMode and autocomplete hints", () => {
    render(<CreditCardField label="Card details" />);
    expect(screen.getByRole("textbox", { name: "Card number" })).toHaveAttribute(
      "inputmode",
      "numeric",
    );
    expect(screen.getByRole("textbox", { name: "Card number" })).toHaveAttribute(
      "autocomplete",
      "cc-number",
    );
    expect(screen.getByRole("textbox", { name: "Expiry" })).toHaveAttribute(
      "autocomplete",
      "cc-exp",
    );
    expect(screen.getByRole("textbox", { name: "CVC" })).toHaveAttribute(
      "autocomplete",
      "cc-csc",
    );
  });

  it("supports uncontrolled defaultValue with display formatting", () => {
    render(
      <CreditCardField
        label="Card details"
        defaultValue={{ number: "4111111111111111", expiry: "1230", cvc: "123" }}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Card number" })).toHaveValue(
      "4111 1111 1111 1111",
    );
    expect(screen.getByRole("textbox", { name: "Expiry" })).toHaveValue("12/30");
    expect(screen.getByRole("textbox", { name: "CVC" })).toHaveValue("123");
  });

  it("emits digit-only values on change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState<CreditCardFieldValue>({
        number: "",
        expiry: "",
        cvc: "",
      });
      return (
        <CreditCardField
          label="Card details"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Harness />);
    await user.type(screen.getByRole("textbox", { name: "Card number" }), "4111");
    const last = onValueChange.mock.calls.at(-1)?.[0] as CreditCardFieldValue;
    expect(last.number).toBe("4111");
    expect(last.number.includes(" ")).toBe(false);
  });

  it("pastes digits into the number segment", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState<CreditCardFieldValue>({
        number: "",
        expiry: "",
        cvc: "",
      });
      return (
        <CreditCardField
          label="Card details"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Harness />);
    const number = screen.getByRole("textbox", { name: "Card number" });
    await user.click(number);
    fireEvent.paste(number, {
      clipboardData: {
        getData: () => "4111-1111-1111-1111",
      },
    });
    const last = onValueChange.mock.calls.at(-1)?.[0] as CreditCardFieldValue;
    expect(last.number).toBe("4111111111111111");
  });

  it("links error text and marks the group invalid", () => {
    render(
      <CreditCardField label="Card details" error="Check the card details and try again." />,
    );
    const group = screen.getByRole("group", { name: "Card details" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Check the card details and try again.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Card number" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("disables all segments when disabled", () => {
    render(<CreditCardField label="Card details" disabled />);
    expect(screen.getByRole("textbox", { name: "Card number" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Expiry" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "CVC" })).toBeDisabled();
  });

  it("supports readOnly segments", () => {
    render(
      <CreditCardField
        label="Card details"
        readOnly
        defaultValue={{ number: "4111111111111111", expiry: "1230", cvc: "123" }}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Card number" })).toHaveAttribute("readonly");
  });

  it("marks required semantics", () => {
    render(<CreditCardField label="Card details" required />);
    expect(screen.getByRole("group", { name: /Card details/ })).toHaveAttribute(
      "aria-required",
      "true",
    );
    expect(screen.getByRole("textbox", { name: "Card number" })).toBeRequired();
  });

  it("does not invent brand-detection APIs on the public export", () => {
    expect(PublicUi.CreditCardField.length).toBeGreaterThanOrEqual(0);
    const entry = getRegistryEntry("credit-card-field");
    const names = entry?.apiProps.map((prop) => prop.name) ?? [];
    expect(names).not.toContain("cardBrand");
    expect(names).not.toContain("stripeToken");
  });
});
