"use client";

import { Avatar } from "@/components/ui/Avatar";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function AvatarPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview" description="Circular identity with image and fallbacks.">
        <PreviewGroup label="Image / initials / icon">
          <Avatar
            size="md"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
            alt="Contributor portrait"
          />
          <Avatar size="md" initials="UF" label="Usman Farooqi" />
          <Avatar size="md" />
        </PreviewGroup>
        <PreviewGroup label="Sizes">
          <Avatar size="sm" initials="SM" label="Small avatar" />
          <Avatar size="md" initials="MD" label="Medium avatar" />
          <Avatar size="lg" initials="LG" label="Large avatar" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Decorative vs informative">
        <PreviewGroup label="Adjacent visible name">
          <Avatar
            size="md"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
            alt=""
            decorative
          />
          <span>Usman Farooqi</span>
        </PreviewGroup>
        <PreviewGroup label="Broken image fallback">
          <Avatar
            size="md"
            src="https://invalid.example/avatar.png"
            initials="UF"
            label="Usman Farooqi"
          />
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Use empty alt and decorative when a visible name is adjacent. Provide label or meaningful
          alt when Avatar is the sole identification.
        </p>
      </ComponentPreview>
    </div>
  );
}
