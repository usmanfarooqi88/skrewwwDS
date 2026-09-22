"use client";

import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";
import { trackGAEvent } from "@/lib/ga";
import { siteConfig } from "@/lib/site-config";

// Same destinations as the global header's Resources menu (lib/global-nav.ts)
// — kept as one canonical source in siteConfig, not duplicated here.
const FIGMA_FREE_FILE_HREF = siteConfig.figmaFreeFileUrl;
const GUMROAD_PRO_HREF = siteConfig.gumroadProUrl;

const FREE_FIGMA_COMPONENT_COUNT = 23;

const secondaryLinkClass =
  "inline-flex items-center py-1 text-sm font-medium text-brand-600 underline decoration-brand-300 underline-offset-4 hover:text-brand-700 hover:decoration-brand-600";

export function HomeHeroCtas({ totalComponents }: { totalComponents: number }) {
  return (
    <div className="mt-6 flex flex-col gap-4 sm:mt-7 sm:gap-3">
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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <a
            href={FIGMA_FREE_FILE_HREF}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("navigation_cta_clicked", {
                label: "Get free Figma file",
                href: FIGMA_FREE_FILE_HREF,
              });
              trackGAEvent("free_figma_click", {
                cta_location: "home_hero",
                destination: FIGMA_FREE_FILE_HREF,
              });
            }}
            className={secondaryLinkClass}
          >
            Get free Figma file
          </a>
          <a
            href={GUMROAD_PRO_HREF}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("navigation_cta_clicked", { label: "Get Skrewww Pro", href: GUMROAD_PRO_HREF });
              trackGAEvent("pro_gumroad_click", {
                cta_location: "home_hero",
                destination: GUMROAD_PRO_HREF,
              });
            }}
            className={secondaryLinkClass}
          >
            Get Skrewww Pro
          </a>
        </div>
        <p className="mt-2 font-mono text-[13px] uppercase tracking-wide text-ink-500 sm:text-xs sm:text-ink-400">
          Figma design files — {FREE_FIGMA_COMPONENT_COUNT} components free, {totalComponents} in Pro
        </p>
      </div>
    </div>
  );
}
