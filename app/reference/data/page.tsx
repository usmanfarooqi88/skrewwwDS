import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { REFERENCE_REQUESTS } from "@/lib/reference-app/fixtures";

export default function ReferenceDataPage() {
  return (
    <>
      <ReferencePageHeader
        title="Requests"
        description="Data workflow placeholder. Search, advanced filters, and Data Table composition ship in RA-2."
        breadcrumb={[
          { label: "Overview", home: true, href: "/reference" },
          { label: "Requests" },
        ]}
        actions={
          <Button href="/reference/new" size="sm">
            New request
          </Button>
        }
      />
      <div className="space-y-4 px-4 py-6 md:px-8">
        <Card title="Coming in RA-2" headingLevel="h2">
          <p className="text-sm text-ink-600">
            This route will host search, filters, table, row actions, pagination, and empty
            state. Fixture count available now:{" "}
            <span className="font-medium text-ink-900">{REFERENCE_REQUESTS.length}</span>{" "}
            deterministic requests.
          </p>
          <p className="mt-3 text-sm text-ink-600">
            Sample edit target:{" "}
            <Button href="/reference/edit/req_001" variant="secondary" size="sm">
              Open req_001
            </Button>
          </p>
        </Card>
      </div>
    </>
  );
}
