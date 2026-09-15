import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { Card } from "@/components/ui/Card";

export default function ReferenceNewPage() {
  return (
    <>
      <ReferencePageHeader
        title="New request"
        description="Create-form placeholder. Full form stack and validation ship in RA-3."
        breadcrumb={[
          { label: "Overview", home: true, href: "/reference" },
          { label: "New request" },
        ]}
      />
      <div className="px-4 py-6 md:px-8">
        <Card title="Form workflow deferred" headingLevel="h2">
          <p className="text-sm text-ink-600">
            RA-1 only proves shell navigation and page hierarchy for this route.
          </p>
        </Card>
      </div>
    </>
  );
}
