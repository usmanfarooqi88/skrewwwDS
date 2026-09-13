"use client";

import { Button } from "@/components/ui/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
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

function ButtonGroupModeControls() {
  const { surface, shape, setSurface, setShape } = usePreviewMode();

  return (
    <div className="mb-5 flex flex-wrap gap-5" data-testid="button-group-preview-mode-controls">
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

function ButtonGroupExamples() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Joined Button composition — each child remains an independent Button. Divider chrome matches Figma Style gap fills."
        controls={<ButtonGroupModeControls />}
      >
        <PreviewGroup label="Primary (divider=primary)">
          <ButtonGroup aria-label="View mode" divider="primary">
            <Button variant="primary">List</Button>
            <Button variant="primary">Grid</Button>
          </ButtonGroup>
        </PreviewGroup>
        <PreviewGroup label="Secondary (divider=neutral)">
          <ButtonGroup aria-label="Period" divider="neutral">
            <Button variant="secondary">Day</Button>
            <Button variant="secondary">Week</Button>
            <Button variant="secondary">Month</Button>
          </ButtonGroup>
        </PreviewGroup>
        <PreviewGroup label="Danger (divider=danger)">
          <ButtonGroup aria-label="Severity" divider="danger">
            <Button variant="danger">Low</Button>
            <Button variant="danger">High</Button>
          </ButtonGroup>
        </PreviewGroup>
        <PreviewGroup label="Mixed disabled child">
          <ButtonGroup aria-label="Export" divider="primary">
            <Button variant="primary">PDF</Button>
            <Button variant="primary" disabled>
              CSV
            </Button>
            <Button variant="primary">Print</Button>
          </ButtonGroup>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}

export function ButtonGroupPreview() {
  return (
    <PreviewModeProvider>
      <ButtonGroupExamples />
    </PreviewModeProvider>
  );
}
