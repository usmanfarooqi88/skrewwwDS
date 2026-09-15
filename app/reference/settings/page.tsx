import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { Card } from "@/components/ui/Card";

export default function ReferenceSettingsPage() {
  return (
    <>
      <ReferencePageHeader
        title="Settings"
        description="Preferences placeholder — no in-app Shape/Surface switcher here."
        breadcrumb={[
          { label: "Overview", home: true, href: "/reference" },
          { label: "Settings" },
        ]}
      />
      <div className="px-4 py-6 md:px-8">
        <Card title="Appearance later" headingLevel="h2">
          <p className="text-sm text-ink-600">
            Shell and navigation are validated in RA-4. Shape/Surface composition
            is validated on the component docs pages (see the Shape/Surface
            switcher on any component page, e.g. Toggle Group or Button Group) —
            this app keeps the default product Shape/Surface from the root
            document.
          </p>
        </Card>
      </div>
    </>
  );
}
