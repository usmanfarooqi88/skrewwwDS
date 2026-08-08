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
  /** Layer 4 (Industry Systems) grouping — see lib/industry-content.ts. Undefined for Layer 2 components. */
  industry?: string;
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
  /**
   * CLI-resolution fields for the planned "npx skrewww" distribution
   * model — the CLI does not exist yet. Undefined on most entries; only
   * populated where derived from real source (see docs/project-status.md).
   *
   * `dependencies` semantics changed in schema 1.4.0 (see
   * PublicRegistryMetadata.schemaVersion below and docs/project-status.md
   * for the dated record): it previously meant "npm packages this
   * component's source actually imports, including host/framework
   * packages such as React and Next.js" (e.g. Button's dependencies were
   * `["react", "next"]`). It now means "third-party npm packages the
   * distribution/install layer should add, excluding host/framework
   * baseline packages" (Button's are now `[]`, since it has no such
   * package — react/react-dom/next are host requirements, tracked
   * separately in the canonical registry's `hostRequirements` field,
   * which is deliberately NOT exposed here yet — see project-status.md).
   */
  dependencies?: string[];
  coreDependencies?: string[];
  files?: string[];
  cssTokens?: string[];
  coreVersion?: string;
};

export type PublicRegistryMetadata = {
  schemaVersion: "1.4.0";
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
      industry,
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
      dependencies,
      coreDependencies,
      files,
      cssTokens,
      coreVersion,
    }) => ({
      slug,
      name,
      category,
      industry,
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
      dependencies,
      coreDependencies,
      files,
      cssTokens,
      coreVersion,
    }),
  );

  return {
    metadata: {
      schemaVersion: "1.4.0",
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
