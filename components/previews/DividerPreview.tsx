import { Divider } from "@/components/ui/Divider";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function DividerPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Semantic, decorative, and vertical separators using token thickness."
      >
        <PreviewGroup label="Thematic horizontal (hr)">
          <div className="w-full max-w-lg">
            <p className="text-sm text-ink-700">Overview</p>
            <Divider />
            <p className="text-sm text-ink-700">Implementation details</p>
          </div>
        </PreviewGroup>

        <PreviewGroup label="Decorative">
          <div className="w-full max-w-lg">
            <p className="text-sm text-ink-700">Related links</p>
            <Divider variant="decorative" />
            <p className="text-sm text-ink-500">Purely visual separation — not announced.</p>
          </div>
        </PreviewGroup>

        <PreviewGroup label="Vertical in layout">
          <div className="flex h-16 items-stretch rounded-lg border border-ink-200 px-4">
            <span className="flex items-center text-sm text-ink-700">Left</span>
            <Divider orientation="vertical" variant="structural" />
            <span className="flex items-center text-sm text-ink-700">Right</span>
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
