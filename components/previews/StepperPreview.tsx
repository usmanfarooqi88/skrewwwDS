"use client";

import { useState } from "react";
import { Stepper, Step } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const STEPS = ["Account", "Shipping", "Payment", "Complete"];

function InteractiveStepper() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="space-y-4">
      <Stepper currentStep={currentStep} onStepClick={setCurrentStep} aria-label="Checkout progress">
        {STEPS.map((label) => (
          <Step key={label}>{label}</Step>
        ))}
      </Stepper>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setCurrentStep((step) => Math.min(STEPS.length - 1, step + 1))}
          disabled={currentStep === STEPS.length - 1}
        >
          Next
        </Button>
        <p className="font-mono text-[11px] text-ink-500" data-testid="stepper-current-step">
          currentStep: {currentStep}
        </p>
      </div>
    </div>
  );
}

function StepperExamples() {
  return (
    <ComponentPreview
      title="Live preview"
      description="Fixed horizontal sequence of named steps. Completed/Current/Upcoming are derived from currentStep — Stepper never owns navigation or routing."
    >
      <PreviewGroup label="Interactive (onStepClick advances Completed/Current steps)">
        <InteractiveStepper />
      </PreviewGroup>
      <PreviewGroup label="Read-only (no onStepClick — no step is focusable)">
        <Stepper currentStep={2} aria-label="Onboarding progress (read-only)">
          <Step>Profile</Step>
          <Step>Preferences</Step>
          <Step>Verify</Step>
          <Step>Done</Step>
        </Stepper>
      </PreviewGroup>
    </ComponentPreview>
  );
}

export function StepperPreview() {
  return <StepperExamples />;
}
