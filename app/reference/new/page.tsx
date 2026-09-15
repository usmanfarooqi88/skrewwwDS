import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { RequestFormWorkflow } from "@/components/reference-app/RequestFormWorkflow";

export default function ReferenceNewPage() {
  return (
    <>
      <ReferencePageHeader
        title="New request"
        description="Create a request with the Skrewww form stack. Values are session-only — not persisted across refresh."
        breadcrumb={[
          { label: "Overview", home: true, href: "/reference" },
          { label: "New request" },
        ]}
      />
      <RequestFormWorkflow mode="new" />
    </>
  );
}
