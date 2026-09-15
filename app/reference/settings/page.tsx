import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { Card } from "@/components/ui/Card";

export default function ReferenceSettingsPage() {
  return (
    <>
      <ReferencePageHeader
        title="Settings"
        description="Preferences placeholder. Shape/Surface gallery ships in RA-5 — not expanded here."
        breadcrumb={[
          { label: "Overview", home: true, href: "/reference" },
          { label: "Settings" },
        ]}
      />
      <div className="px-4 py-6 md:px-8">
        <Card title="Appearance later" headingLevel="h2">
          <p className="text-sm text-ink-600">
            Shell and navigation are validated in RA-4. Default product Shape/Surface
            remains from the root document until the RA-5 gallery.
          </p>
        </Card>
      </div>
    </>
  );
}
