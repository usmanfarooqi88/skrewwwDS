import { trackGAEvent } from "@/lib/ga";
import type { ResourceLink } from "@/lib/global-nav";

export function trackResourceClick(
  link: ResourceLink,
  location: "header_resources" | "mobile_resources",
): void {
  const event = link.label === "Figma Free"
    ? "free_figma_click"
    : link.label === "Figma Pro"
      ? "pro_gumroad_click"
      : undefined;
  if (event) {
    trackGAEvent(event, { cta_location: location, destination: link.href });
  }
}
