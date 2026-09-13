"use client";

import { useState } from "react";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";
import {
  PreviewModeProvider,
  previewShapeModes,
  previewSurfaceModes,
  usePreviewMode,
} from "@/components/docs/PreviewMode";

function modeLabel(mode: string) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function PhoneNumberFieldModeControls() {
  const { surface, shape, setSurface, setShape } = usePreviewMode();

  return (
    <div className="mb-5 flex flex-wrap gap-5" data-testid="phone-number-field-preview-mode-controls">
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-500">
          Surface
        </legend>
        <div className="inline-flex rounded-lg border border-ink-200 bg-white p-1" aria-label="Surface mode">
          {previewSurfaceModes.map((mode) => {
            const active = surface === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100"
                }`}
                onClick={() => setSurface(mode)}
              >
                {modeLabel(mode)}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-500">
          Shape
        </legend>
        <div className="inline-flex flex-wrap rounded-lg border border-ink-200 bg-white p-1" aria-label="Shape mode">
          {previewShapeModes.map((mode) => {
            const active = shape === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100"
                }`}
                onClick={() => setShape(mode)}
              >
                {modeLabel(mode)}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function LiveField() {
  const [country, setCountry] = useState("US");
  const [value, setValue] = useState("");

  return (
    <div className="max-w-lg space-y-2">
      <PhoneNumberField
        label="Mobile number"
        country={country}
        onCountryChange={setCountry}
        value={value}
        onValueChange={setValue}
        supportingText="UI pattern only — not SMS verification or carrier lookup."
      />
      <p className="font-mono text-[11px] text-ink-500" data-testid="phone-number-field-value">
        Value: {country} / {value || "—"}
      </p>
    </div>
  );
}

function PhoneNumberFieldExamples() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Country Select + type=tel number input. Flag is a decorative placeholder; country identity is the Select label."
        controls={<PhoneNumberFieldModeControls />}
      >
        <PreviewGroup label="Interactive">
          <LiveField />
        </PreviewGroup>
        <PreviewGroup label="Default with international number">
          <PhoneNumberField
            label="Contact phone"
            defaultCountry="GB"
            defaultValue="+44 7700 900123"
          />
        </PreviewGroup>
        <PreviewGroup label="Error">
          <PhoneNumberField
            label="Mobile number"
            defaultValue="555"
            error="Enter a valid phone number."
          />
        </PreviewGroup>
        <PreviewGroup label="Disabled">
          <PhoneNumberField
            label="Mobile number"
            defaultCountry="US"
            defaultValue="(555) 010-0100"
            disabled
          />
        </PreviewGroup>
        <PreviewGroup label="Read-only">
          <PhoneNumberField
            label="Mobile number"
            defaultCountry="PK"
            defaultValue="+92 300 1234567"
            readOnly
          />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}

export function PhoneNumberFieldPreview() {
  return (
    <PreviewModeProvider>
      <PhoneNumberFieldExamples />
    </PreviewModeProvider>
  );
}
