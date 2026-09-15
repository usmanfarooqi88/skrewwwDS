import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { RequestsDataView } from "@/components/reference-app/RequestsDataView";
import { Button } from "@/components/ui/Button";

export default function ReferenceDataPage() {
  return (
    <>
      <ReferencePageHeader
        title="Requests"
        description="Search, filter, sort, and paginate the ops queue. Visual Table backlog is intentionally exposed here for RA-5 — not fixed in RA-2."
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
      <RequestsDataView />
    </>
  );
}
