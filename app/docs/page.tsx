import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { absoluteUrl } from "@/lib/site-config";
import { brandedDocumentTitle } from "@/lib/registry-seo";
import { pageSocialMetadata } from "@/lib/social-metadata";

const pageTitle = "Docs";
const title = brandedDocumentTitle(pageTitle);
const description =
  "Orientation for Skrewww's documentation — foundations, components, Agent Kit, Guard, and release history.";
const url = absoluteUrl("/docs");

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: { canonical: url },
  ...pageSocialMetadata({ title, description, url }),
};

type DocsDestination = {
  title: string;
  href: string;
  description: string;
};

/**
 * NAV-1: an orientation hub only — it does not replace any existing route
 * and does not invent Getting Started / Accessibility / Installation pages
 * that don't exist yet. Every link below is a real, already-shipped
 * destination. The fuller Docs IA (grouped sidebar, more sub-pages) is a
 * later phase (see docs/project-status.md).
 */
const destinations: DocsDestination[] = [
  {
    title: "Foundations",
    href: "/foundations",
    description: "Tokens, color, type, spacing, radius, elevation, motion, and the Shape/Surface system.",
  },
  {
    title: "Components",
    href: "/components",
    description: "The full React component library, grouped by category, with live previews and install snippets.",
  },
  {
    title: "Charts",
    href: "/components/charts",
    description: "The Cartesian chart families and the dashboard-composition components built on top of them.",
  },
  {
    title: "Agent Kit",
    href: "/agent-kit",
    description: "How AI coding agents consume Skrewww — generated contracts, the canonical Skill, and Recipes.",
  },
  {
    title: "Guard",
    href: "/guard",
    description: "The offline CLI that checks generated code against Skrewww's canonical component contracts.",
  },
  {
    title: "Changelog",
    href: "/changelog",
    description: "What shipped, changed, or was fixed, release by release.",
  },
];

export default function DocsHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Docs</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">{description}</p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {destinations.map((destination) => (
          <Link key={destination.href} href={destination.href} className="block">
            <Card
              elevation="flat"
              title={destination.title}
              headingLevel="h2"
              className="h-full transition-colors hover:border-brand-500"
            >
              <p className="text-sm text-ink-600">{destination.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
