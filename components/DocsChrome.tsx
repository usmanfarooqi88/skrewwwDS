import { DocsChromeClient } from "@/components/DocsChromeClient";
import { sectionNavModels } from "@/lib/section-nav-models";

/**
 * Server wrapper for the docs chrome. Builds the label/href navigation models
 * here so the client bundle never imports the component documentation prose
 * (`lib/data`); only the small projected models are passed down as props.
 */
export function DocsChrome({ children }: { children: React.ReactNode }) {
  return <DocsChromeClient models={sectionNavModels}>{children}</DocsChromeClient>;
}
