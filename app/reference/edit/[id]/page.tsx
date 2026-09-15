import { notFound } from "next/navigation";
import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { Card } from "@/components/ui/Card";
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
        description="Edit-form placeholder. Full edit/create stack ships in RA-3."
        breadcrumb={[
          { label: "Overview", home: true, href: "/reference" },
          { label: "Requests", href: "/reference/data" },
          { label: request.id },
        ]}
      />
      <div className="px-4 py-6 md:px-8">
        <Card title={request.title} headingLevel="h2">
          <p className="text-sm text-ink-600">{request.description}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-500">Status</dt>
              <dd className="font-medium text-ink-900">{request.status}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Priority</dt>
              <dd className="font-medium text-ink-900">{request.priority}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
