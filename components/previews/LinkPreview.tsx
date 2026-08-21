"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";
import { Link } from "@/components/ui/Link";
import { Button } from "@/components/ui/Button";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function LinkPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview" description="Semantic anchors for navigation — not primary actions.">
        <PreviewGroup label="Internal / External / Inline">
          <Link href="/components/button">Internal documentation link</Link>
          <Link
            href="https://example.com"
            target="_blank"
            trailingIcon={<ArrowSquareOut size={14} />}
          >
            External reference
          </Link>
          <Link
            href="/components/button"
            variant="danger"
            trailingIcon={<ArrowSquareOut size={14} />}
          >
            Delete this resource
          </Link>
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Links stay underlined by default so they are never identified by color alone. Use{" "}
          <Link
            href="/components/button"
            variant="subtle"
            size="sm"
            trailingIcon={<ArrowSquareOut size={14} />}
          >
            Subtle documentation link
          </Link>{" "}
          for actions that do not navigate.
        </p>
      </ComponentPreview>

      <ComponentPreview title="Focus and comparison">
        <p className="text-sm text-ink-600">
          Tab to a link to see the focus ring. External links opened in a new tab receive{" "}
          <code className="font-mono text-xs">rel=&quot;noopener noreferrer&quot;</code> by default.
        </p>
        <Button size="sm" className="mt-4">
          Action control
        </Button>
      </ComponentPreview>
    </div>
  );
}
