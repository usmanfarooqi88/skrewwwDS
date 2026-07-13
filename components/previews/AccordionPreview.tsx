"use client";

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function AccordionPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Single-mode accordion with collapsible behavior. Use keyboard Tab and Enter/Space on triggers."
      >
        <PreviewGroup label="Single + collapsible">
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full max-w-lg">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is Skrewww?</AccordionTrigger>
              <AccordionPanel>
                Skrewww is a token-driven design system with Beta React components and
                server-rendered documentation.
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Should primary docs live here?</AccordionTrigger>
              <AccordionPanel>
                No. Essential documentation must remain visible by default — Accordion is for
                optional secondary detail only.
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Long panel content</AccordionTrigger>
              <AccordionPanel>
                <p>
                  Panels can contain paragraphs, lists, and other static content. This example
                  includes enough text to verify padding and readable line length inside the
                  expanded region without relying on icon rotation alone for state.
                </p>
                <ul className="mt-2 list-disc pl-5">
                  <li>Native button triggers</li>
                  <li>aria-expanded and aria-controls</li>
                  <li>hidden panels removed from interaction</li>
                </ul>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Multiple expansion">
        <PreviewGroup label="type=&quot;multiple&quot;">
          <Accordion type="multiple" defaultValue={["a"]} className="w-full max-w-lg">
            <AccordionItem value="a">
              <AccordionTrigger>Section A</AccordionTrigger>
              <AccordionPanel>Both A and B can stay open simultaneously.</AccordionPanel>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Section B</AccordionTrigger>
              <AccordionPanel>Toggle independently from section A.</AccordionPanel>
            </AccordionItem>
          </Accordion>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
