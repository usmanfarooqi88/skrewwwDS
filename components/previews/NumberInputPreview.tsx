"use client";

import { useState } from "react";
import { NumberInput } from "@/components/ui/NumberInput";
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

function NumberInputModeControls() {
  const { surface, shape, setSurface, setShape } = usePreviewMode();

  return (
    <div className="mb-5 flex flex-wrap gap-5" data-testid="number-input-preview-mode-controls">
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
  const [value, setValue] = useState<number | null>(1);

  return (
    <div className="max-w-xs space-y-2">
      <NumberInput
        label="Quantity"
        value={value}
        onValueChange={setValue}
        min={0}
        max={99}
        step={1}
        supportingText="Direct numeric entry — not currency. Prefer Slider for visual adjust."
      />
      <p className="font-mono text-[11px] text-ink-500" data-testid="number-input-value">
        Value: {value === null ? "—" : String(value)}
      </p>
    </div>
  );
}

function NumberInputExamples() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Text + spinbutton ARIA with optional steppers. Constraints apply on blur/step/arrows."
        controls={<NumberInputModeControls />}
      >
        <PreviewGroup label="Interactive">
          <LiveField />
        </PreviewGroup>
        <PreviewGroup label="Decimal step">
          <NumberInput label="Opacity" defaultValue={0.5} min={0} max={1} step={0.1} />
        </PreviewGroup>
        <PreviewGroup label="Error">
          <NumberInput label="Threshold" defaultValue={12} min={0} max={10} error="Must be 10 or less." />
        </PreviewGroup>
        <PreviewGroup label="Disabled">
          <NumberInput label="Quantity" defaultValue={3} disabled />
        </PreviewGroup>
        <PreviewGroup label="Read-only">
          <NumberInput label="Quantity" defaultValue={7} readOnly />
        </PreviewGroup>
        <PreviewGroup label="Without steppers">
          <NumberInput label="Score" defaultValue={42} showSteppers={false} />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}

export function NumberInputPreview() {
  return (
    <PreviewModeProvider>
      <NumberInputExamples />
    </PreviewModeProvider>
  );
}
