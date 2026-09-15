import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";

type ReferencePageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb: BreadcrumbItem[];
  actions?: ReactNode;
};

/** Application-scoped page header composition — not a design-system export. */
export function ReferencePageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: ReferencePageHeaderProps) {
  return (
    <header className="border-b border-ink-200 bg-white px-4 py-5 md:px-8">
      <Breadcrumb items={breadcrumb} homeLabel="Overview" />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-ink-600">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
