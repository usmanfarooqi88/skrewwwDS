"use client";

import { Copy } from "@phosphor-icons/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/ToastProvider";
import { trackEvent } from "@/lib/analytics";

export function CopyCodeButton({ code, slug }: { code: string; slug: string }) {
  const { toast } = useToast();

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    trackEvent("component_code_copied", { slug });
    toast({
      type: "success",
      title: "Code copied",
      description: "The React example was copied to your clipboard.",
      duration: 3000,
    });
  }

  return (
    <div className="mb-2 flex items-center gap-2">
      <Tooltip content="Copy example to clipboard">
        <button
          type="button"
          aria-label="Copy code example"
          onClick={handleCopy}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-ink-700 text-ink-0 hover:bg-ink-800"
        >
          <Copy size={16} aria-hidden="true" />
        </button>
      </Tooltip>
      <span className="font-mono text-[11px] text-ink-500">Copy React example</span>
    </div>
  );
}
