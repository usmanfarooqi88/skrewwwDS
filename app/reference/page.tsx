import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getWorkspaceSummary,
  REFERENCE_REQUESTS,
} from "@/lib/reference-app/fixtures";

export default function ReferenceOverviewPage() {
  const summary = getWorkspaceSummary();
  const recent = REFERENCE_REQUESTS.slice(0, 3);

  return (
    <>
      <ReferencePageHeader
        title="Overview"
        description="Compact ops console used to validate Skrewww compositions before Guard. Charts and full workflows arrive in later RA phases."
        breadcrumb={[{ label: "Overview", home: true, href: "/reference" }]}
        actions={
          <Button href="/reference/new" size="sm">
            New request
          </Button>
        }
      />
      <div className="space-y-6 px-4 py-6 md:px-8">
        <section aria-labelledby="summary-heading" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <h2 id="summary-heading" className="sr-only">
            Workspace summary
          </h2>
          <Card title="Open" headingLevel="h3">
            <p className="text-3xl font-semibold tabular-nums text-ink-900">{summary.openCount}</p>
          </Card>
          <Card title="In progress" headingLevel="h3">
            <p className="text-3xl font-semibold tabular-nums text-ink-900">
              {summary.inProgressCount}
            </p>
          </Card>
          <Card title="Resolved" headingLevel="h3">
            <p className="text-3xl font-semibold tabular-nums text-ink-900">
              {summary.resolvedThisWeek}
            </p>
          </Card>
          <Card title="Total requests" headingLevel="h3">
            <p className="text-3xl font-semibold tabular-nums text-ink-900">{summary.totalCount}</p>
          </Card>
        </section>

        <section aria-labelledby="recent-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recent-heading" className="text-base font-semibold text-ink-900">
              Recent requests
            </h2>
            <Button href="/reference/data" variant="secondary" size="sm">
              View all
            </Button>
          </div>
          <ul className="space-y-2">
            {recent.map((request) => (
              <li key={request.id}>
                <Card elevation="flat">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900">{request.title}</p>
                      <p className="mt-1 text-sm text-ink-600">{request.id}</p>
                    </div>
                    <Badge variant={request.status === "open" ? "warning" : "info"}>
                      {request.status.replace("_", " ")}
                    </Badge>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
