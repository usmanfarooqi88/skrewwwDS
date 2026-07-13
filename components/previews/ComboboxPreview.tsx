"use client";

import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/Drawer";
import { Combobox } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const countries = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "mx", label: "Mexico" },
  { value: "gb", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
];

const teamMembers = [
  { value: "alex", label: "Alex Rivera" },
  { value: "jordan", label: "Jordan Lee" },
  { value: "sam", label: "Sam Patel" },
  { value: "taylor", label: "Taylor Brooks", disabled: true },
];

export function ComboboxPreview() {
  const [controlledValue, setControlledValue] = useState("ca");
  const [controlledInput, setControlledInput] = useState("Canada");

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Combobox combines an editable text input with a filterable listbox. It chooses one predefined option — not free-form text, remote search, or multi-select."
      >
        <PreviewGroup label="Country (prefix filter)">
          <Combobox
            label="Country"
            name="country"
            placeholder="Search countries"
            options={countries}
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Filtering and keyboard selection">
        <PreviewGroup label="Team member (substring filter)">
          <Combobox
            label="Assignee"
            placeholder="Search team members"
            options={teamMembers}
            filterMode="substring"
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Required, error, and disabled">
        <PreviewGroup label="States">
          <div className="grid max-w-sm gap-4">
            <Combobox
              label="Required country"
              name="required-country"
              required
              placeholder="Choose a country"
              options={countries}
            />
            <Combobox
              label="Region"
              error="Choose a valid country."
              placeholder="Search countries"
              options={countries}
            />
            <Combobox label="Legacy country" disabled defaultValue="us" options={countries} />
          </div>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Controlled value and input">
        <PreviewGroup label="Controlled">
          <div className="grid max-w-sm gap-4">
            <Combobox
              label="Project owner"
              options={teamMembers.filter((member) => !member.disabled)}
              value={controlledValue}
              onValueChange={setControlledValue}
            />
            <Combobox
              label="Search label"
              options={countries}
              inputValue={controlledInput}
              onInputValueChange={setControlledInput}
            />
          </div>
          <p className="mt-2 text-sm text-ink-600">
            Selected value: {controlledValue || "None"} · Input text: {controlledInput || "Empty"}
          </p>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Long result list">
        <PreviewGroup label="Many countries">
          <Combobox
            label="Destination"
            placeholder="Type to filter"
            data-testid="combobox-long-list"
            options={[
              ...countries,
              { value: "es", label: "Spain" },
              { value: "it", label: "Italy" },
              { value: "nl", label: "Netherlands" },
              { value: "se", label: "Sweden" },
              { value: "no", label: "Norway" },
              { value: "dk", label: "Denmark" },
              { value: "fi", label: "Finland" },
              { value: "ie", label: "Ireland" },
              { value: "pt", label: "Portugal" },
              { value: "be", label: "Belgium" },
              { value: "ch", label: "Switzerland" },
              { value: "at", label: "Austria" },
              { value: "pl", label: "Poland" },
              { value: "cz", label: "Czech Republic" },
              { value: "gr", label: "Greece" },
            ]}
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Form submission">
        <PreviewGroup label="Submit canonical option value">
          <form data-testid="combobox-submit-form" className="max-w-sm space-y-3">
            <Combobox
              label="Country"
              name="country"
              required
              placeholder="Search countries"
              options={countries}
            />
            <Combobox
              label="Assignee"
              name="assignee"
              placeholder="Search team members"
              options={teamMembers.filter((member) => !member.disabled)}
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
                Submit country
              </button>
              <button type="reset" className="rounded-md border border-ink-200 px-3 py-2 text-sm">
                Reset form
              </button>
            </div>
          </form>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Combobox inside Dialog">
        <Dialog>
          <DialogTrigger>
            <Button type="button">Open dialog with combobox</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nested overlays</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <Combobox
                label="Country"
                placeholder="Search countries"
                options={countries}
                className="max-w-sm"
              />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </ComponentPreview>

      <ComponentPreview title="Combobox inside Drawer">
        <Drawer>
          <DrawerTrigger>
            <Button type="button">Open drawer with combobox</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer filters</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <Combobox
                label="Country"
                placeholder="Search countries"
                options={countries}
                className="max-w-sm"
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </ComponentPreview>
    </div>
  );
}
