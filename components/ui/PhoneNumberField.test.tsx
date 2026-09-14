import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import * as PublicUi from "@/components/ui";
import {
  formatCountryOptionLabel,
  sanitizePhoneNumberInput,
} from "@/lib/phone-number-field-countries";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";
import {
  PHONE_NUMBER_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
  PHONE_NUMBER_FIELD_FIGMA_VARIANT_COUNT,
} from "@/lib/phone-number-field-figma-metadata";

describe("phone-number-field helpers", () => {
  it("allows digits and common phone punctuation", () => {
    expect(sanitizePhoneNumberInput("+1 (555) 010-0100")).toBe("+1 (555) 010-0100");
    expect(sanitizePhoneNumberInput("abc+92.300")).toBe("+92.300");
    expect(formatCountryOptionLabel({ value: "US", dialCode: "+1", label: "United States" })).toBe(
      "United States (+1)",
    );
  });
});

describe("PhoneNumberField discovery and registry", () => {
  it("registers Phone Number Field as Beta Forms component", () => {
    const entry = getRegistryEntry("phone-number-field");
    expect(entry?.name).toBe("Phone Number Field");
    expect(entry?.category).toBe("Forms");
    expect(entry?.status).toBe("beta");
    expect(entry?.version).toBe("0.1.0-beta");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("available");
    expect(entry?.figmaNodeId).toBe(PHONE_NUMBER_FIELD_FIGMA_COMPONENT_SET_NODE_ID);
    expect(PHONE_NUMBER_FIELD_FIGMA_VARIANT_COUNT).toBe(4);
    expect(getImplementedComponentCount()).toBe(54);
  });

  it("exports PhoneNumberField publicly", () => {
    expect(PublicUi.PhoneNumberField).toBeDefined();
  });
});

describe("PhoneNumberField", () => {
  it("renders a labeled group with country select and type=tel input", () => {
    render(<PhoneNumberField label="Mobile number" />);
    expect(screen.getByRole("group", { name: "Mobile number" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Country" })).toBeInTheDocument();
    const number = screen.getByRole("textbox", { name: "Phone number" });
    expect(number).toHaveAttribute("type", "tel");
    expect(number).toHaveAttribute("autocomplete", "tel");
    expect(number).toHaveAttribute("inputmode", "tel");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("supports uncontrolled defaultValue", () => {
    render(
      <PhoneNumberField label="Mobile number" defaultValue="+44 7700 900123" defaultCountry="GB" />,
    );
    expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveValue("+44 7700 900123");
    expect(screen.getByRole("combobox", { name: "Country" })).toHaveTextContent(
      "United Kingdom (+44)",
    );
  });

  it("emits sanitized values on change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState("");
      return (
        <PhoneNumberField
          label="Mobile number"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Harness />);
    await user.type(screen.getByRole("textbox", { name: "Phone number" }), "+1-555");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("+1-555");
  });

  it("strips disallowed characters while keeping punctuation", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState("");
      return (
        <PhoneNumberField
          label="Mobile number"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Harness />);
    await user.type(screen.getByRole("textbox", { name: "Phone number" }), "a(555)b");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("(555)");
  });

  it("pastes sanitized international text", async () => {
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState("");
      return (
        <PhoneNumberField
          label="Mobile number"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Harness />);
    const number = screen.getByRole("textbox", { name: "Phone number" });
    number.focus();
    fireEvent.paste(number, {
      clipboardData: {
        getData: () => "+44-7700-900123!!!",
      },
    });
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("+44-7700-900123");
  });

  it("changes country via Select", async () => {
    const user = userEvent.setup();
    const onCountryChange = vi.fn();
    function Harness() {
      const [country, setCountry] = React.useState("US");
      return (
        <PhoneNumberField
          label="Mobile number"
          country={country}
          onCountryChange={(next) => {
            onCountryChange(next);
            setCountry(next);
          }}
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole("combobox", { name: "Country" }));
    await user.click(screen.getByRole("option", { name: "Pakistan (+92)" }));
    expect(onCountryChange).toHaveBeenCalledWith("PK");
    expect(screen.getByRole("combobox", { name: "Country" })).toHaveTextContent("Pakistan (+92)");
  });

  it("links error text and marks controls invalid", () => {
    render(<PhoneNumberField label="Mobile number" error="Enter a valid phone number." />);
    const group = screen.getByRole("group", { name: "Mobile number" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid phone number.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("disables both controls when disabled", () => {
    render(<PhoneNumberField label="Mobile number" disabled />);
    expect(screen.getByRole("textbox", { name: "Phone number" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Country" })).toBeDisabled();
  });

  it("supports readOnly number and non-editable country", () => {
    render(
      <PhoneNumberField
        label="Mobile number"
        readOnly
        defaultValue="+92 300 1234567"
        defaultCountry="PK"
      />,
    );
    expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveAttribute("readonly");
    expect(screen.getByRole("combobox", { name: "Country" })).toBeDisabled();
  });

  it("marks required semantics", () => {
    render(<PhoneNumberField label="Mobile number" required />);
    expect(screen.getByRole("group", { name: /Mobile number/ })).toHaveAttribute(
      "aria-required",
      "true",
    );
    expect(screen.getByRole("textbox", { name: "Phone number" })).toBeRequired();
  });

  it("does not invent verification or network APIs", () => {
    const entry = getRegistryEntry("phone-number-field");
    const names = entry?.apiProps.map((prop) => prop.name) ?? [];
    expect(names).not.toContain("verify");
    expect(names).not.toContain("onVerify");
    expect(names).not.toContain("carrier");
    expect(names).not.toContain("otp");
  });
});
