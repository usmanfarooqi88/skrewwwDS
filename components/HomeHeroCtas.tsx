"use client";

import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";

const FIGMA_FREE_FILE_HREF =
  "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free";
const GUMROAD_PRO_HREF = "https://usmanfarooqi.gumroad.com/l/skrewww-pro";

const FREE_FIGMA_COMPONENT_COUNT = 23;

export function HomeHeroCtas({ totalComponents }: { totalComponents: number }) {
  return (
    <div className="mt-7 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
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
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            href={FIGMA_FREE_FILE_HREF}
            variant="secondary"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("navigation_cta_clicked", {
                label: "Get free Figma file",
                href: FIGMA_FREE_FILE_HREF,
              })
            }
          >
            Get free Figma file
          </Button>
          <Button
            href={GUMROAD_PRO_HREF}
            variant="secondary"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("navigation_cta_clicked", { label: "Get Skrewww Pro", href: GUMROAD_PRO_HREF })
            }
          >
            Get Skrewww Pro
          </Button>
        </div>
        <p className="mt-2 font-mono text-xs uppercase tracking-wide text-ink-400">
          Figma design files — {FREE_FIGMA_COMPONENT_COUNT} components free, {totalComponents} in Pro
        </p>
      </div>
    </div>
  );
}
