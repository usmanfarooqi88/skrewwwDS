import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getSortedChangelogEntries, type ChangelogItemType } from "@/content/changelog";
import { absoluteUrl } from "@/lib/site-config";
import { brandedDocumentTitle } from "@/lib/registry-seo";

const pageTitle = "Changelog";
const title = brandedDocumentTitle(pageTitle);
const description =
  "What's new, improved, and fixed in Skrewww — the design system's public release history.";
const url = absoluteUrl("/changelog");

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website" },
};

const ITEM_TYPE_LABEL: Record<ChangelogItemType, string> = {
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
};

const ITEM_TYPE_VARIANT: Record<ChangelogItemType, "info" | "success" | "neutral"> = {
  new: "info",
  improved: "success",
  fixed: "neutral",
};

function ChangelogSection({ type, items }: { type: ChangelogItemType; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 first:mt-0">
      <Badge variant={ITEM_TYPE_VARIANT[type]} size="sm">
        {ITEM_TYPE_LABEL[type]}
      </Badge>
      <ul className="mt-2 space-y-1.5">
        {items.map((text) => (
          <li key={text} className="text-sm leading-relaxed text-ink-600">
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChangelogPage() {
  const entries = getSortedChangelogEntries();

  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-400">
          <li>
            <Link href="/" className="hover:text-ink-700">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-600" aria-current="page">
            Changelog
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Changelog</h1>
      <p className="mt-2 text-sm text-ink-500">
        Meaningful updates to the Skrewww design system, newest first. For current implementation
        status and technical detail, see the project documentation in the repository.
      </p>

      <div className="mt-10 space-y-6">
        {entries.map((entry) => {
          const newItems = entry.items.filter((item) => item.type === "new").map((item) => item.text);
          const improvedItems = entry.items
            .filter((item) => item.type === "improved")
            .map((item) => item.text);
          const fixedItems = entry.items.filter((item) => item.type === "fixed").map((item) => item.text);

          return (
            <Card key={entry.id} as="article" elevation="flat">
              <time dateTime={entry.date} className="font-mono text-xs text-ink-400">
                {entry.displayDate}
              </time>
              <h2 className="mt-1 text-lg font-semibold text-ink-900">{entry.title}</h2>
              {entry.summary ? <p className="mt-1.5 text-sm text-ink-500">{entry.summary}</p> : null}

              <ChangelogSection type="new" items={newItems} />
              <ChangelogSection type="improved" items={improvedItems} />
              <ChangelogSection type="fixed" items={fixedItems} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
