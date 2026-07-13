import { allComponents } from "@/lib/data";
import {
  componentRegistry,
  getImplementedComponentCount,
  getImplementedRegistryEntries,
} from "@/lib/component-registry";
import { getIndexableComponentSlugs } from "@/lib/indexing-policy";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import { siteConfig } from "@/lib/site-config";
import { COMBOBOX_FIGMA_AUDIT_STATUS } from "@/lib/combobox-figma-metadata";

export function getProjectStatusFacts() {
  const implemented = getImplementedRegistryEntries();
  const implementedSlugs = new Set(implemented.map((entry) => entry.slug));
  const documentationOnly = allComponents.filter(
    (component) =>
      !implementedSlugs.has(component.slug) &&
      !REDIRECTED_COMPONENT_SLUGS.includes(
        component.slug as (typeof REDIRECTED_COMPONENT_SLUGS)[number],
      ),
  );
  const indexable = getIndexableComponentSlugs();
  const noindexDocs = allComponents.filter(
    (component) => !indexable.includes(component.slug),
  );

  const byCategory = new Map<string, string[]>();
  for (const entry of implemented) {
    const names = byCategory.get(entry.category) ?? [];
    names.push(entry.name);
    byCategory.set(entry.category, names);
  }
  for (const names of Array.from(byCategory.values())) {
    names.sort((left: string, right: string) => left.localeCompare(right));
  }

  return {
    lastVerifiedDate: siteConfig.lastUpdated,
    packageVersion: "0.2.0-beta",
    designSystemVersion: siteConfig.designSystemVersion,
    registrySchemaVersion: "1.1.0" as const,
    implementedComponentCount: getImplementedComponentCount(),
    registryEntryCount: componentRegistry.length,
    figmaDocumentedComponentCount: allComponents.length,
    documentationOnlyComponentCount: documentationOnly.length,
    indexableComponentCount: indexable.length,
    noindexComponentCount: noindexDocs.length,
    redirectAliases: [...REDIRECTED_COMPONENT_SLUGS],
    implementedByCategory: Object.fromEntries(byCategory),
    siteOriginPolicy: {
      deploymentAuthority: "NEXT_PUBLIC_SITE_URL",
      developmentDefault: "http://localhost:3000",
      productionFallback: "https://skrewww.dev",
      reservedBrandDomain: "skrewww.com",
      testOrigin: "https://skrewww.test",
    },
    figmaMcpStatus: COMBOBOX_FIGMA_AUDIT_STATUS,
  };
}
