"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function ToastPreview() {
  const { toast } = useToast();

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Transient notifications appear in the viewport without stealing focus."
      >
        <PreviewGroup label="Trigger toasts">
          <Button
            onClick={() =>
              toast({
                type: "success",
                title: "Saved",
                description: "Your changes were saved successfully.",
              })
            }
          >
            Show success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                type: "info",
                title: "Sync started",
                description: "We are refreshing component metadata.",
              })
            }
          >
            Show info toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                type: "error",
                title: "Connection lost",
                description: "Check your network and try again.",
                duration: 0,
              })
            }
          >
            Show persistent error toast
          </Button>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
