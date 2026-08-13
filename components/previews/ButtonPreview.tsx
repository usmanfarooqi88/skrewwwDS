"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronRightIcon, PlusIcon } from "@/components/ui/icons";
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

function ButtonModeControls() {
  const { surface, shape, setSurface, setShape } = usePreviewMode();

  return (
    <div className="mb-5 flex flex-wrap gap-5" data-testid="button-preview-mode-controls">
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

function ButtonExamples() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Interactive Button instances using scoped Skrewww tokens. Shape and surface apply to the examples without changing the documentation shell."
        controls={<ButtonModeControls />}
        testId="button-preview-live-card"
      >
        <div
          className="relative isolate overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-br from-brand-50 via-white to-ink-100 px-6 py-10"
          data-testid="button-glass-qa-backdrop"
        >
          <div className="pointer-events-none absolute bottom-2 left-3 h-20 w-20 rounded-full bg-brand-400/75" aria-hidden="true" />
          <div
            className="pointer-events-none absolute left-[28%] top-8 h-20 w-1/2 -rotate-6 rounded-2xl bg-gradient-to-r from-info/80 via-brand-500/80 to-warning/70"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-danger/75" aria-hidden="true" />

          <div className="relative z-10">
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
              Visual variants
            </h3>
            <div className="relative mt-3 flex flex-wrap items-center gap-3 py-2">
              <div
                className="pointer-events-none absolute -inset-x-3 inset-y-0 rounded-lg border border-ink-900/15 opacity-55"
                data-testid="button-glass-qa-stripes"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgb(19 19 22 / 0.72) 0 2px, rgb(255 255 255 / 0.82) 2px 8px)",
                }}
                aria-hidden="true"
              />
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>
        </div>
      </ComponentPreview>

      <ComponentPreview title="Sizes" testId="button-preview-sizes-card">
        <PreviewGroup label="Small / Medium / Large">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="States" testId="button-preview-states-card">
        <PreviewGroup label="Default / Disabled / Loading">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 1500);
            }}
          >
            {loading ? "Saving…" : "Simulate loading"}
          </Button>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Icons & layout" testId="button-preview-icons-card">
        <PreviewGroup label="Leading icon / Trailing icon / Full width">
          <Button leadingIcon={<PlusIcon />}>With icon</Button>
          <Button trailingIcon={<ChevronRightIcon />}>Continue</Button>
          <Button fullWidth className="max-w-xs">
            Full width
          </Button>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}

export function ButtonPreview() {
  return (
    <PreviewModeProvider>
      <ButtonExamples />
    </PreviewModeProvider>
  );
}
