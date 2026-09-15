import { notFound } from "next/navigation";
import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { RequestFormWorkflow } from "@/components/reference-app/RequestFormWorkflow";
import { getReferenceRequestById } from "@/lib/reference-app/fixtures";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReferenceEditPage({ params }: EditPageProps) {
  const { id } = await params;
  const request = getReferenceRequestById(id);
  if (!request) {
    notFound();
  }

  return (
    <>
      <ReferencePageHeader
        title={`Edit ${request.id}`}
        description="Prefills fixture data. Saving validates in-session only — not persisted across refresh."
        breadcrumb={[
          { label: "Overview", home: true, href: "/reference" },
          { label: "Requests", href: "/reference/data" },
          { label: request.id },
        ]}
      />
      <RequestFormWorkflow mode="edit" request={request} />
    </>
  );
}
