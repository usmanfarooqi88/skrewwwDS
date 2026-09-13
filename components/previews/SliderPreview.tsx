"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

function ControlledSlider() {
  const [value, setValue] = useState(40);
  return (
    <Slider
      label={`Controlled value ${value}`}
      value={value}
      onValueChange={setValue}
      min={0}
      max={100}
      step={1}
    />
  );
}

export function SliderPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview">
        <PreviewGroup label="Default / Disabled">
          <Slider label="Volume" defaultValue={40} min={0} max={100} />
          <Slider label="Disabled" defaultValue={40} min={0} max={100} disabled />
        </PreviewGroup>
        <PreviewGroup label="Controlled">
          <ControlledSlider />
        </PreviewGroup>
        <PreviewGroup label="Step">
          <Slider label="Amount (step 10)" defaultValue={30} min={0} max={100} step={10} />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
