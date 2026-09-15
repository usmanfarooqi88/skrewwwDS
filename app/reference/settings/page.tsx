import { ReferencePageHeader } from "@/components/reference-app/ReferencePageHeader";
import { Card } from "@/components/ui/Card";

export default function ReferenceSettingsPage() {
  return (
    <>
      <ReferencePageHeader
        title="Settings"
        description="Preferences placeholder. Shape/Surface gallery and preference controls ship in later RA phases."
        breadcrumb={[
          { label: "Overview", home: true, href: "/reference" },
          { label: "Settings" },
        ]}
      />
      <div className="px-4 py-6 md:px-8">
        <Card title="Appearance later" headingLevel="h2">
          <p className="text-sm text-ink-600">
            RA-1 uses the default product Shape/Surface from the root document. No
            per-route theming in this phase.
          </p>
        </Card>
      </div>
    </>
  );
}
