"use client";

import { useState } from "react";
import {
  CreditCardField,
  type CreditCardFieldValue,
} from "@/components/ui/CreditCardField";
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

function CreditCardFieldModeControls() {
  const { surface, shape, setSurface, setShape } = usePreviewMode();

  return (
    <div className="mb-5 flex flex-wrap gap-5" data-testid="credit-card-field-preview-mode-controls">
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
  const [value, setValue] = useState<CreditCardFieldValue>({
    number: "",
    expiry: "",
    cvc: "",
  });

  return (
    <div className="max-w-md space-y-2">
      <CreditCardField
        label="Card details"
        value={value}
        onValueChange={setValue}
        supportingText="UI pattern only — not a payment processor. Prefer hosted provider fields for real capture."
      />
      <p className="font-mono text-[11px] text-ink-500" data-testid="credit-card-field-digits">
        Digits: {value.number || "—"} / {value.expiry || "—"} / {value.cvc || "—"}
      </p>
    </div>
  );
}

function CreditCardFieldExamples() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Compound shell: generic card icon + number + expiry + CVC. Values stay digit-only; spaces/slash are display-only."
        controls={<CreditCardFieldModeControls />}
      >
        <PreviewGroup label="Interactive">
          <LiveField />
        </PreviewGroup>
        <PreviewGroup label="Default with synthetic filled value">
          <CreditCardField
            label="Saved card"
            defaultValue={{ number: "4111111111111111", expiry: "1230", cvc: "123" }}
          />
        </PreviewGroup>
        <PreviewGroup label="Error">
          <CreditCardField
            label="Card details"
            defaultValue={{ number: "4111111111111111", expiry: "0199", cvc: "12" }}
            error="Check the card details and try again."
          />
        </PreviewGroup>
        <PreviewGroup label="Disabled">
          <CreditCardField
            label="Card details"
            defaultValue={{ number: "4111111111111111", expiry: "1230", cvc: "123" }}
            disabled
          />
        </PreviewGroup>
        <PreviewGroup label="Read-only">
          <CreditCardField
            label="Card details"
            defaultValue={{ number: "4111111111111111", expiry: "1230", cvc: "123" }}
            readOnly
          />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}

export function CreditCardFieldPreview() {
  return (
    <PreviewModeProvider>
      <CreditCardFieldExamples />
    </PreviewModeProvider>
  );
}
