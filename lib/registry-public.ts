import {
  componentRegistry,
  getImplementedRegistryEntries,
  type ComponentRegistryEntry,
} from "@/lib/component-registry";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export type PublicRegistryRelatedComponent = {
  name: string;
  slug: string;
  href: string;
};

export type PublicRegistryEntry = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  status: ComponentRegistryEntry["status"];
  version: string;
  reactAvailability: ComponentRegistryEntry["reactAvailability"];
  figmaAvailability: ComponentRegistryEntry["figmaAvailability"];
  documentationCompleteness: ComponentRegistryEntry["documentationCompleteness"];
  accessibilityLevel: ComponentRegistryEntry["accessibilityLevel"];
  documentationUrl: string;
  documentationLastUpdated: string;
  reactLastUpdated: string;
  figmaReference?: string;
  supportedVariants: string[];
  supportedStates: string[];
  supportedSizes: string[];
  tokensUsed: string[];
  relatedComponents: PublicRegistryRelatedComponent[];
  openQuestions: string[];
  hasImplementation: boolean;
  hasPreview: boolean;
  indexing: ComponentRegistryEntry["indexing"];
  announcementBehavior?: string;
};

export type PublicRegistryMetadata = {
  schemaVersion: "1.1.0";
  designSystemVersion: string;
  generatedFrom: "lib/component-registry.ts";
  canonicalBaseUrl: string;
  componentCount: number;
  implementedComponentCount: number;
  lastUpdated: string;
};

export type PublicRegistry = {
  metadata: PublicRegistryMetadata;
  components: PublicRegistryEntry[];
};

function toPublicRelatedComponent(link: {
  label: string;
  href: string;
}): PublicRegistryRelatedComponent {
  const slugMatch = link.href.match(/^\/components\/([^/?#]+)/);
  const slug = slugMatch?.[1] ?? link.href;
  const name = link.label.split(" — ")[0]?.split(" - ")[0] ?? link.label;

  return {
    name,
    slug,
    href: absoluteUrl(link.href),
  };
}

export function getPublicRegistry(): PublicRegistry {
  const implementedEntries = getImplementedRegistryEntries();

  const components = componentRegistry.map(
    ({
      slug,
      name,
      category,
      summary,
      status,
      version,
      reactAvailability,
      figmaAvailability,
      documentationCompleteness,
      accessibilityLevel,
      documentationUrl,
      documentationLastUpdated,
      reactLastUpdated,
      figmaReference,
      supportedVariants,
      supportedSizes,
      tokensUsed,
      relatedComponents,
      openQuestions,
      hasImplementation,
      hasPreview,
      indexing,
      announcementBehavior,
    }) => ({
      slug,
      name,
      category,
      summary,
      status,
      version,
      reactAvailability,
      figmaAvailability,
      documentationCompleteness,
      accessibilityLevel,
      documentationUrl,
      documentationLastUpdated,
      reactLastUpdated,
      figmaReference,
      supportedVariants,
      supportedStates: supportedVariants,
      supportedSizes,
      tokensUsed,
      relatedComponents: relatedComponents.map(toPublicRelatedComponent),
      openQuestions,
      hasImplementation,
      hasPreview,
      indexing,
      announcementBehavior,
    }),
  );

  return {
    metadata: {
      schemaVersion: "1.1.0",
      designSystemVersion: siteConfig.designSystemVersion,
      generatedFrom: "lib/component-registry.ts",
      canonicalBaseUrl: siteConfig.origin,
      componentCount: components.length,
      implementedComponentCount: implementedEntries.length,
      lastUpdated: siteConfig.lastUpdated,
    },
    components,
  };
}

export function serializePublicRegistry(): string {
  return JSON.stringify(getPublicRegistry(), null, 2);
}
