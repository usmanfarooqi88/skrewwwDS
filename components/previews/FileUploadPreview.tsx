"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function FileUploadPreview() {
  const [lastBatch, setLastBatch] = useState<string>("None");

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="File Upload selects and validates files. Your application owns the network upload."
      >
        <PreviewGroup label="Single file">
          <FileUpload
            label="Profile photo"
            name="profile-photo"
            accept="image/png,image/jpeg"
            maxSize={2_000_000}
            supportingText="PNG or JPG up to 2 MB."
            className="max-w-lg"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Multiple files">
        <PreviewGroup label="Replacement selection semantics">
          <FileUpload
            label="Project attachments"
            name="attachments"
            accept="image/png,image/jpeg,.pdf"
            multiple
            maxFiles={3}
            maxSize={5_000_000}
            supportingText="Each new picker or drop batch replaces the current selection."
            className="max-w-lg"
            onFilesChange={(files) =>
              setLastBatch(files.map((file) => file.name).join(", ") || "None")
            }
          />
          <p className="text-sm text-ink-600">Selected batch: {lastBatch}</p>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="States">
        <PreviewGroup label="Required / Error / Disabled">
          <div className="grid max-w-lg gap-4">
            <FileUpload
              label="Required document"
              name="required-doc"
              accept=".pdf"
              required
              supportingText="A PDF is required before submit."
            />
            <FileUpload
              label="Upload with server error"
              name="server-error-doc"
              accept=".pdf"
              error="The server could not process these files."
            />
            <FileUpload label="Disabled upload" name="disabled-doc" disabled supportingText="Uploads are unavailable." />
          </div>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Native form submission">
        <PreviewGroup label="Multipart FormData">
          <form
            data-testid="file-upload-form"
            className="max-w-lg space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <FileUpload
              label="Invoice"
              name="invoice"
              accept=".pdf"
              required
              supportingText="Submit uses the native file input — not a hidden text field."
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
                Submit form
              </button>
              <button type="reset" className="rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-700">
                Reset form
              </button>
            </div>
          </form>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
