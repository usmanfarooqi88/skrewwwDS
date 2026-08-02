"use client";

import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";

export function HomeHeroCtas() {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <Button
        href="/components"
        onClick={() =>
          trackEvent("navigation_cta_clicked", { label: "Browse components", href: "/components" })
        }
      >
        Browse components
      </Button>
      <Button
        href="/foundations"
        variant="secondary"
        onClick={() =>
          trackEvent("navigation_cta_clicked", { label: "View foundations", href: "/foundations" })
        }
      >
        View foundations
      </Button>
    </div>
  );
}
