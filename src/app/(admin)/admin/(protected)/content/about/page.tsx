import { AdminManagedPageWorkspace } from "@/components/admin/admin-managed-page-workspace";

const ABOUT_SECTION_TYPES = [
  { value: "identity", label: "Identity" },
  { value: "timeline", label: "Timeline" },
  { value: "principles", label: "Principles" },
  { value: "supporting", label: "Supporting" },
] as const;

interface AdminAboutPageManagerProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function AdminAboutPageManager({
  searchParams,
}: AdminAboutPageManagerProps) {
  return (
    <AdminManagedPageWorkspace
      pageKey="about"
      pageTitle="About"
      description="Manage the identity page from one workspace so profile framing, supporting sections, portrait usage, and metadata stay aligned."
      sectionTypes={ABOUT_SECTION_TYPES}
      settingsHint="Optional advanced settings for profile signals, timeline items, and small metrics. Leave this as {} for normal editing."
      searchParams={searchParams}
      adminRoute="/admin/content/about"
      allowImage
      imageHint="Use a public media asset for the portrait or any supporting visual."
    />
  );
}
